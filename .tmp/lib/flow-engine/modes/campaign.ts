/**
 * Campaign Mode Executor
 * 
 * Executes flows for batch message sending to a list of contacts.
 * Uses QStash for distributed processing and rate limiting.
 * 
 * Features:
 * - Batch processing with configurable size
 * - Rate limiting (6s per recipient per WhatsApp pair limit)
 * - Progress tracking in database
 * - Error handling with retry logic
 * - Webhook callbacks for status updates
 */

import { Client } from '@upstash/qstash'
import type { Flow, FlowNode, Contact, FlowExecution, FlowExecutionMode } from '@/types'
import { flowExecutionDb, nodeExecutionDb } from '@/lib/supabase-db'
import { sendWhatsAppMessage } from '../sender'
import { handleSendError, logDebug, logError } from '../error-handler'
import { processText } from '../variables'
import { getNodeExecutor, findOutgoingEdge, findStartNode, getNodeById } from '../nodes'
import type { ExecutionContext as NodeExecutionContext, NodeExecutionResult, WhatsAppMessagePayload } from '../nodes/base'

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_BATCH_SIZE = 50
const DEFAULT_RATE_LIMIT_MS = 6000 // 6 seconds between messages to same recipient
const MAX_RETRIES = 3

// =============================================================================
// TYPES
// =============================================================================

export interface CampaignExecutionOptions {
  flowId: string
  flow: Flow
  contacts: Contact[]
  phoneNumberId: string
  accessToken: string
  batchSize?: number
  rateLimitMs?: number
  webhookUrl?: string
  metadata?: Record<string, unknown>
}

export interface CampaignExecutionResult {
  executionId: string
  status: 'started' | 'queued' | 'failed'
  totalContacts: number
  batchCount: number
  error?: string
}

export interface BatchJob {
  executionId: string
  flowId: string
  flow: Flow
  contacts: Contact[]
  batchIndex: number
  totalBatches: number
  phoneNumberId: string
  accessToken: string
  rateLimitMs: number
  webhookUrl?: string
}

export interface ContactExecutionResult {
  contactId: string
  phone: string
  success: boolean
  messagesSent: number
  error?: string
  nodeResults: Array<{
    nodeId: string
    nodeType: string
    success: boolean
    messageId?: string
    error?: string
  }>
}

// =============================================================================
// CAMPAIGN EXECUTOR
// =============================================================================

/**
 * Start a campaign execution
 * Creates execution record and queues batches via QStash
 */
export async function startCampaignExecution(
  options: CampaignExecutionOptions
): Promise<CampaignExecutionResult> {
  const {
    flowId,
    flow,
    contacts,
    phoneNumberId,
    accessToken,
    batchSize = DEFAULT_BATCH_SIZE,
    rateLimitMs = DEFAULT_RATE_LIMIT_MS,
    webhookUrl,
    metadata,
  } = options

  logDebug(`Starting campaign execution for flow ${flowId} with ${contacts.length} contacts`)

  // Validate flow has start node
  const startNode = findStartNode(flow.nodes)
  if (!startNode) {
    return {
      executionId: '',
      status: 'failed',
      totalContacts: contacts.length,
      batchCount: 0,
      error: 'Flow does not have a start node',
    }
  }

  // Create execution record
  const execution = await flowExecutionDb.create({
    flowId,
    mode: 'campaign' as FlowExecutionMode,
    triggerSource: 'api',
    contactCount: contacts.length,
    metadata,
  })

  // Update status to running
  await flowExecutionDb.updateStatus(execution.id, { status: 'running' })

  // Split contacts into batches
  const batches = splitIntoBatches(contacts, batchSize)

  logDebug(`Created ${batches.length} batches for execution ${execution.id}`)

  // Queue batches via QStash
  try {
    const qstash = getQStashClient()
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXTAUTH_URL || 'http://localhost:3000'

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      const batchJob: BatchJob = {
        executionId: execution.id,
        flowId,
        flow,
        contacts: batch,
        batchIndex: i,
        totalBatches: batches.length,
        phoneNumberId,
        accessToken,
        rateLimitMs,
        webhookUrl,
      }

      // Calculate delay for this batch (stagger batches)
      const delaySeconds = i * Math.ceil((batch.length * rateLimitMs) / 1000)

      await qstash.publishJSON({
        url: `${baseUrl}/api/flow-engine/worker/batch`,
        body: batchJob,
        delay: delaySeconds,
        retries: MAX_RETRIES,
      })

      logDebug(`Queued batch ${i + 1}/${batches.length} with ${delaySeconds}s delay`)
    }

    return {
      executionId: execution.id,
      status: 'queued',
      totalContacts: contacts.length,
      batchCount: batches.length,
    }
  } catch (error) {
    logError('Failed to queue campaign batches', { executionId: execution.id }, error)

    await flowExecutionDb.updateStatus(execution.id, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Failed to queue batches',
    })

    return {
      executionId: execution.id,
      status: 'failed',
      totalContacts: contacts.length,
      batchCount: 0,
      error: error instanceof Error ? error.message : 'Failed to queue batches',
    }
  }
}

/**
 * Process a batch of contacts
 * Called by QStash worker
 */
export async function processCampaignBatch(job: BatchJob): Promise<void> {
  const {
    executionId,
    flow,
    contacts,
    batchIndex,
    totalBatches,
    phoneNumberId,
    accessToken,
    rateLimitMs,
  } = job

  logDebug(`Processing batch ${batchIndex + 1}/${totalBatches} for execution ${executionId}`)

  const results: ContactExecutionResult[] = []

  for (const contact of contacts) {
    const result = await executeFlowForContact(
      executionId,
      flow,
      contact,
      phoneNumberId,
      accessToken,
      rateLimitMs
    )
    results.push(result)

    // Update execution metrics
    await updateExecutionMetrics(executionId, result)
  }

  // Check if this was the last batch
  if (batchIndex === totalBatches - 1) {
    await finalizeCampaignExecution(executionId, flow.id)
  }

  logDebug(`Batch ${batchIndex + 1}/${totalBatches} completed: ${results.filter(r => r.success).length}/${contacts.length} successful`)
}

/**
 * Execute flow for a single contact
 */
async function executeFlowForContact(
  executionId: string,
  flow: Flow,
  contact: Contact,
  phoneNumberId: string,
  accessToken: string,
  rateLimitMs: number
): Promise<ContactExecutionResult> {
  const result: ContactExecutionResult = {
    contactId: contact.id,
    phone: contact.phone,
    success: true,
    messagesSent: 0,
    nodeResults: [],
  }

  const startNode = findStartNode(flow.nodes)
  if (!startNode) {
    result.success = false
    result.error = 'No start node found'
    return result
  }

  // Find first actual node after start
  const firstEdge = findOutgoingEdge(flow.edges, startNode.id)
  let currentNodeId = firstEdge?.target

  // Build execution context
  const variables: Record<string, string> = {
    contact_name: contact.name || '',
    contact_phone: contact.phone,
  }

  // Track executed nodes to prevent infinite loops
  const executedNodes = new Set<string>()
  const maxNodes = 100

  while (currentNodeId && executedNodes.size < maxNodes) {
    if (executedNodes.has(currentNodeId)) {
      result.error = 'Loop detected in flow'
      break
    }
    executedNodes.add(currentNodeId)

    const node = getNodeById(flow.nodes, currentNodeId)
    if (!node) {
      result.error = `Node ${currentNodeId} not found`
      break
    }

    // Skip non-message nodes in campaign mode (end, etc)
    if (node.type === 'end') {
      break
    }

    // Create node execution record
    const nodeExec = await nodeExecutionDb.create({
      executionId,
      nodeId: node.id,
      nodeType: node.type,
      contactPhone: contact.phone,
    })

    await nodeExecutionDb.start(nodeExec.id)

    // Build context for node execution
    const context: NodeExecutionContext = {
      executionId,
      flowId: flow.id,
      mode: 'campaign',
      contactPhone: contact.phone,
      contactName: contact.name,
      nodes: flow.nodes,
      edges: flow.edges,
      currentNodeId: node.id,
      variables,
      phoneNumberId,
      accessToken,
      sendMessage: async (payload) => {
        return sendWhatsAppMessage({
          phoneNumberId,
          accessToken,
          to: contact.phone,
          payload,
        })
      },
      setVariable: async (key, value) => {
        variables[key] = value
      },
      log: (message, level = 'debug') => {
        if (level === 'error') {
          logError(message, { executionId, nodeId: node.id, contactPhone: contact.phone })
        } else {
          logDebug(message)
        }
      },
    }

    // Get executor for this node type
    const executor = getNodeExecutor(node.type)
    let nodeResult: NodeExecutionResult

    if (executor) {
      nodeResult = await executor.execute(context, node as any)
    } else {
      // Fallback for nodes without executor - just find next node
      const nextEdge = findOutgoingEdge(flow.edges, node.id)
      nodeResult = {
        success: true,
        nextNodeId: nextEdge?.target,
      }
    }

    // Send messages if any
    if (nodeResult.messages?.length) {
      for (const message of nodeResult.messages) {
        const sendResult = await sendWhatsAppMessage({
          phoneNumberId,
          accessToken,
          to: contact.phone,
          payload: message,
        })

        if (sendResult.success) {
          result.messagesSent++
          await nodeExecutionDb.updateWhatsappMessageId(nodeExec.id, sendResult.messageId || '')
        } else {
          const errorContext = {
            executionId,
            nodeId: node.id,
            contactPhone: contact.phone,
            retryCount: 0,
            maxRetries: MAX_RETRIES,
          }

          const handling = handleSendError(sendResult, errorContext)

          if (handling.shouldAbort) {
            result.success = false
            result.error = sendResult.errorMessage
            await nodeExecutionDb.fail(nodeExec.id, {
              errorCode: sendResult.errorCode,
              errorMessage: sendResult.errorMessage || 'Send failed',
            })
            return result
          }
        }

        // Apply rate limiting
        if (rateLimitMs > 0) {
          await delay(rateLimitMs)
        }
      }
    }

    // Record node result
    result.nodeResults.push({
      nodeId: node.id,
      nodeType: node.type,
      success: nodeResult.success,
      error: nodeResult.error,
    })

    if (!nodeResult.success) {
      result.success = false
      result.error = nodeResult.error
      await nodeExecutionDb.fail(nodeExec.id, {
        errorMessage: nodeResult.error || 'Node execution failed',
      })
      break
    }

    await nodeExecutionDb.complete(nodeExec.id, {
      output: nodeResult.output,
    })

    // Move to next node
    currentNodeId = nodeResult.nextNodeId
  }

  return result
}

/**
 * Update execution metrics after processing a contact
 */
async function updateExecutionMetrics(
  executionId: string,
  result: ContactExecutionResult
): Promise<void> {
  try {
    if (result.messagesSent > 0) {
      await flowExecutionDb.incrementMetrics(executionId, 'sent', result.messagesSent)
    }
    if (!result.success) {
      await flowExecutionDb.incrementMetrics(executionId, 'failed', 1)
    }
  } catch (error) {
    logError('Failed to update execution metrics', { executionId }, error)
  }
}

/**
 * Finalize campaign execution
 */
async function finalizeCampaignExecution(executionId: string, flowId: string): Promise<void> {
  try {
    const execution = await flowExecutionDb.getById(executionId)
    if (!execution) return

    // Determine final status based on metrics
    const status: 'completed' | 'failed' = execution.failedCount === 0 ? 'completed' :
      execution.failedCount === execution.contactCount ? 'failed' : 'completed'

    await flowExecutionDb.updateStatus(executionId, { status })

    logDebug(`Campaign execution ${executionId} finalized with status: ${status}`)
  } catch (error) {
    logError('Failed to finalize campaign execution', { executionId }, error)
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function splitIntoBatches<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = []
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize))
  }
  return batches
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function getQStashClient(): Client {
  const token = process.env.QSTASH_TOKEN
  if (!token) {
    throw new Error('QSTASH_TOKEN environment variable is required')
  }
  return new Client({ token })
}
