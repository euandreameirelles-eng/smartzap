/**
 * Chatbot Mode Executor
 * 
 * Executes flows in real-time for incoming WhatsApp messages.
 * Maintains conversation state in Redis for stateful conversations.
 * 
 * Features:
 * - Real-time message processing
 * - Conversation state persistence
 * - Session timeout handling
 * - Trigger matching (keyword, regex, starts_with, contains)
 * - Interactive message response handling
 */

import type { Flow, FlowNode, FlowExecutionMode } from '@/types'
import { flowExecutionDb, nodeExecutionDb, flowDb, botDb, settingsDb } from '@/lib/supabase-db'
import { supabase } from '@/lib/supabase'
import { sendWhatsAppMessage } from '../sender'
import { handleSendError, logDebug, logError } from '../error-handler'
import { processText } from '../variables'
import { getNodeExecutor, findOutgoingEdge, findStartNode, getNodeById, findEdgeByHandle } from '../nodes'
import type { ExecutionContext as NodeExecutionContext, NodeExecutionResult, WhatsAppMessagePayload } from '../nodes/base'
import * as stateManager from '../state'

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
const MAX_NODES_PER_EXECUTION = 100 // Prevent infinite loops

// =============================================================================
// TYPES
// =============================================================================

export interface ChatbotExecutionOptions {
  phoneNumberId: string
  accessToken: string
  recipientPhone: string
  incomingMessage: IncomingMessage
  sessionTimeoutMs?: number
}

export interface IncomingMessage {
  type: 'text' | 'button_reply' | 'list_reply' | 'image' | 'audio' | 'video' | 'document' | 'location'
  text?: string
  buttonId?: string
  listId?: string
  messageId: string
  contextMessageId?: string
  mediaUrl?: string
}

export interface ChatbotExecutionResult {
  success: boolean
  messagesCount: number
  nextNodeId?: string
  waitingForInput?: boolean
  conversationEnded?: boolean
  error?: string
}

export interface TriggerConfig {
  type: 'any_message' | 'keyword' | 'starts_with' | 'contains' | 'regex'
  value?: string
  caseSensitive?: boolean
}

// =============================================================================
// CHATBOT EXECUTOR
// =============================================================================

/**
 * Process an incoming message through the chatbot flow
 */
export async function processChatbotMessage(
  options: ChatbotExecutionOptions
): Promise<ChatbotExecutionResult> {
  const {
    phoneNumberId,
    accessToken,
    recipientPhone,
    incomingMessage,
    sessionTimeoutMs = DEFAULT_SESSION_TIMEOUT_MS,
  } = options

  logDebug(`Processing chatbot message from ${recipientPhone}: ${incomingMessage.text || incomingMessage.type}`)

  try {
    // 1. Get or create conversation state
    const botId = await getActiveBotId(phoneNumberId)
    if (!botId) {
      logDebug(`No active bot found for phone number ${phoneNumberId}`)
      return { success: true, messagesCount: 0 }
    }

    const state = await stateManager.getOrCreateState(botId, phoneNumberId, recipientPhone)

    // 2. Check session timeout
    const isSessionExpired = await checkSessionTimeout(state, sessionTimeoutMs)
    if (isSessionExpired) {
      // Reset conversation and start fresh
      await stateManager.resetConversation(state.conversationId)
      return processChatbotMessage(options) // Retry with fresh state
    }

    // 3. Check if conversation is paused (human takeover)
    if (state.status === 'paused') {
      logDebug(`Conversation ${state.conversationId} is paused (human takeover)`)
      return { success: true, messagesCount: 0 }
    }

    // 4. Find matching flow
    const flow = await findMatchingFlow(botId, incomingMessage, state)
    if (!flow) {
      logDebug(`No matching flow found for message from ${recipientPhone}`)
      return { success: true, messagesCount: 0 }
    }

    // 5. Execute flow
    const result = await executeFlowForChatbot(
      state,
      flow,
      phoneNumberId,
      accessToken,
      recipientPhone,
      incomingMessage
    )

    return result

  } catch (error) {
    logError('Chatbot execution error', { contactPhone: recipientPhone }, error)
    return {
      success: false,
      messagesCount: 0,
      error: error instanceof Error ? error.message : 'Chatbot execution failed',
    }
  }
}

/**
 * Execute flow for chatbot mode
 */
async function executeFlowForChatbot(
  state: stateManager.ConversationState,
  flow: Flow,
  phoneNumberId: string,
  accessToken: string,
  recipientPhone: string,
  incomingMessage: IncomingMessage
): Promise<ChatbotExecutionResult> {
  const result: ChatbotExecutionResult = {
    success: true,
    messagesCount: 0,
  }

  // Determine starting node
  let currentNodeId = state.currentNodeId

  if (!currentNodeId) {
    const startNode = findStartNode(flow.nodes)
    if (!startNode) {
      return { success: false, messagesCount: 0, error: 'No start node found' }
    }

    // Move to first node after start
    const firstEdge = findOutgoingEdge(flow.edges, startNode.id)
    currentNodeId = firstEdge?.target
  }

  // Build variables from state
  const variables: Record<string, string> = {
    ...await stateManager.getAllVariables(state.conversationId),
    contact_phone: recipientPhone,
    last_message: incomingMessage.text || '',
    current_date: new Date().toLocaleDateString('pt-BR'),
    current_time: new Date().toLocaleTimeString('pt-BR'),
  }

  // Track executed nodes to prevent loops
  const executedNodes = new Set<string>()
  const messagesToSend: WhatsAppMessagePayload[] = []

  while (currentNodeId && executedNodes.size < MAX_NODES_PER_EXECUTION) {
    if (executedNodes.has(currentNodeId)) {
      logDebug(`Loop detected at node ${currentNodeId}`)
      break
    }
    executedNodes.add(currentNodeId)

    const node = getNodeById(flow.nodes, currentNodeId)
    if (!node) {
      result.error = `Node ${currentNodeId} not found`
      break
    }

    logDebug(`[V3] Executing node: ${node.type} (${node.id})`)

    // Handle end node
    if (node.type === 'end') {
      await stateManager.endConversation(state.conversationId)
      result.conversationEnded = true
      break
    }

    // Build context
    const context: NodeExecutionContext = {
      executionId: state.conversationId,
      flowId: flow.id,
      mode: 'chatbot' as FlowExecutionMode,
      contactPhone: recipientPhone,
      nodes: flow.nodes,
      edges: flow.edges,
      currentNodeId: node.id,
      variables,
      phoneNumberId,
      accessToken,
      incomingMessage: {
        type: incomingMessage.type as any,
        text: incomingMessage.text,
        buttonId: incomingMessage.buttonId,
        listId: incomingMessage.listId,
        messageId: incomingMessage.messageId,
        contextMessageId: incomingMessage.contextMessageId,
        mediaUrl: incomingMessage.mediaUrl,
      },
      sendMessage: async (payload) => {
        return sendWhatsAppMessage({
          phoneNumberId,
          accessToken,
          to: recipientPhone,
          payload,
        })
      },
      setVariable: async (key, value) => {
        variables[key] = value
        await stateManager.setVariable(state.conversationId, key, value)
      },
      log: (message, level = 'debug') => {
        if (level === 'error') {
          logError(message, { executionId: state.conversationId, nodeId: node.id })
        } else {
          logDebug(message)
        }
      },
    }

    // Process user response first if this node expects input
    if (incomingMessage && executedNodes.size === 1) {
      const responseNodeId = await processUserResponse(node, context, flow)
      if (responseNodeId) {
        currentNodeId = responseNodeId
        await stateManager.updateCurrentNode(state.conversationId, currentNodeId)
        continue
      }
    }

    // Execute node
    const executor = getNodeExecutor(node.type)
    let nodeResult: NodeExecutionResult

    if (executor) {
      nodeResult = await executor.execute(context, node as any)
    } else {
      // Default: just find next node
      const nextEdge = findOutgoingEdge(flow.edges, node.id)
      nodeResult = { success: true, nextNodeId: nextEdge?.target }
    }

    // Collect messages to send
    if (nodeResult.messages?.length) {
      messagesToSend.push(...nodeResult.messages)
    }

    if (!nodeResult.success) {
      result.success = false
      result.error = nodeResult.error
      break
    }

    // Handle nodes that wait for user input
    // Check collectInput, pauseExecution, or specific node types
    if (
      nodeResult.collectInput ||
      nodeResult.pauseExecution ||
      node.type === 'menu' ||
      node.type === 'input' ||
      node.type === 'buttons' ||
      node.type === 'list'
    ) {
      // Save state and wait for user response
      await stateManager.updateCurrentNode(state.conversationId, node.id)
      result.waitingForInput = true
      result.nextNodeId = node.id
      break
    }

    // Move to next node
    currentNodeId = nodeResult.nextNodeId
    if (currentNodeId) {
      await stateManager.updateCurrentNode(state.conversationId, currentNodeId)
    } else {
      // Flow ended (no next node) - reset conversation state for next interaction
      logDebug(`[V3] Flow ended - resetting conversation state`)
      await stateManager.resetConversation(state.conversationId)
    }

    // Clear incoming message after first node (only process once)
    if (incomingMessage) {
      (context as any).incomingMessage = undefined
    }
  }

  // Send all collected messages
  for (const message of messagesToSend) {
    const sendResult = await sendWhatsAppMessage({
      phoneNumberId,
      accessToken,
      to: recipientPhone,
      payload: message,
    })

    if (sendResult.success) {
      result.messagesCount++
    } else {
      logDebug(`Failed to send message: ${sendResult.errorMessage}`)
    }
  }

  return result
}

/**
 * Normaliza texto removendo acentos, espaços e pontuação para comparação
 * Útil para comparar payloads de botões (ex: "sim_estarei_la" vs "Sim, Estarei Lá")
 */
function normalizeTextForComparison(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]/g, '_')      // Substitui não-alfanuméricos por _
    .replace(/_+/g, '_')              // Remove underscores duplicados
    .replace(/^_|_$/g, '')            // Remove _ no início/fim
}

/**
 * Process user response and determine next node
 */
async function processUserResponse(
  node: FlowNode,
  context: NodeExecutionContext,
  flow: Flow
): Promise<string | undefined> {
  const { incomingMessage, edges } = context

  if (!incomingMessage) return undefined

  switch (node.type) {
    case 'template': {
      // Template com botões de resposta rápida (QUICK_REPLY)
      const data = node.data as {
        buttons?: Array<{ id?: string; type: string; text: string }>
      }
      const buttons = data.buttons || []

      // Filtrar apenas botões QUICK_REPLY
      const quickReplyButtons = buttons.filter(b =>
        b.type === 'QUICK_REPLY' || b.type === 'quick_reply'
      )

      if (quickReplyButtons.length === 0) {
        // Template sem botões de resposta, seguir para próximo nó
        const edge = findOutgoingEdge(edges, node.id)
        return edge?.target
      }

      // O payload que recebemos do WhatsApp pode ser:
      // 1. ID customizado (btn.id ou "button-{index}") - quando configurado
      // 2. Texto do botão - comportamento padrão do WhatsApp Cloud API
      const userPayload = incomingMessage.buttonId || ''
      const userText = incomingMessage.text || ''

      logDebug(`[V3] Template: Processing button response - payload: "${userPayload}", text: "${userText}"`)
      logDebug(`[V3] Template: Available buttons: ${JSON.stringify(quickReplyButtons)}`)

      // Encontrar o botão pelo payload (forma preferida - match exato pelo ID)
      let matchedButton = quickReplyButtons.find((btn, index) => {
        const expectedPayload = btn.id || `button-${index}`
        return userPayload === expectedPayload
      })

      // Fallback 1: O payload pode ser o TEXTO do botão (comportamento padrão do WhatsApp)
      if (!matchedButton && userPayload) {
        const normalizedPayload = normalizeTextForComparison(userPayload)
        matchedButton = quickReplyButtons.find(btn => {
          if (btn.text.toLowerCase() === userPayload.toLowerCase()) return true
          if (normalizeTextForComparison(btn.text) === normalizedPayload) return true
          return false
        })
        if (matchedButton) {
          logDebug(`[V3] Template: Matched by payload-as-text: "${userPayload}"`)
        }
      }

      // Fallback 2: tentar match pelo texto da mensagem
      if (!matchedButton && userText) {
        const normalizedInput = normalizeTextForComparison(userText)
        matchedButton = quickReplyButtons.find(btn => {
          if (btn.text.toLowerCase() === userText.toLowerCase()) return true
          if (normalizeTextForComparison(btn.text) === normalizedInput) return true
          return false
        })
      }

      if (matchedButton) {
        const buttonIndex = quickReplyButtons.indexOf(matchedButton)
        const handleId = matchedButton.id || `button-${buttonIndex}`

        logDebug(`[V3] Template: Matched button: ${handleId}`)

        // Buscar edge pelo handle do botão
        const edge = findEdgeByHandle(edges, node.id, handleId)
        if (edge) {
          logDebug(`[V3] Template: Found edge to ${edge.target}`)
          return edge.target
        }

        // Tentar handle alternativo (button-X format sem ID customizado)
        const altEdge = findEdgeByHandle(edges, node.id, `button-${buttonIndex}`)
        if (altEdge) {
          logDebug(`[V3] Template: Found alt edge to ${altEdge.target}`)
          return altEdge.target
        }
      }

      // Fallback: tentar edge padrão (para templates sem conexões específicas por botão)
      const fallbackEdge = findEdgeByHandle(edges, node.id, 'fallback')
      if (fallbackEdge) {
        logDebug(`[V3] Template: Using fallback edge`)
        return fallbackEdge.target
      }

      // Último recurso: edge de saída padrão
      const defaultEdge = findOutgoingEdge(edges, node.id)
      if (defaultEdge) {
        logDebug(`[V3] Template: Using default edge to ${defaultEdge.target}`)
        return defaultEdge.target
      }

      logDebug(`[V3] Template: No matching edge found`)
      return undefined
    }

    case 'buttons': {
      // Botões interativos (reply buttons)
      // Suportar ambos formatos: { id, title } ou { id, label }
      const data = node.data as {
        buttons?: Array<{ id: string; title?: string; label?: string }>
      }
      const buttons = data.buttons || []

      const userInput = incomingMessage.buttonId ||
        incomingMessage.text?.toLowerCase()

      logDebug(`[V3] Buttons: Processing response: ${userInput}`)

      const normalizedInput = normalizeTextForComparison(userInput || '')

      const matchedButton = buttons.find(btn => {
        const buttonTitle = (btn.title || btn.label || '').toLowerCase()
        if (btn.id === userInput || btn.id.toLowerCase() === userInput) return true
        if (buttonTitle === userInput) return true
        if (normalizeTextForComparison(btn.title || btn.label || '') === normalizedInput) return true
        return false
      })

      if (matchedButton) {
        logDebug(`[V3] Buttons: Matched button: ${matchedButton.id}`)

        // Tentar encontrar edge pelo ID direto
        let edge = findEdgeByHandle(edges, node.id, matchedButton.id)

        // Fallback: tentar com prefixo 'button_' (formato do workflow builder)
        if (!edge) {
          edge = findEdgeByHandle(edges, node.id, `button_${matchedButton.id}`)
          if (edge) logDebug(`[V3] Buttons: Found edge with button_ prefix`)
        }

        if (edge) {
          logDebug(`[V3] Buttons: Advancing to node: ${edge.target}`)
          return edge.target
        }

        logDebug(`[V3] Buttons: No specific edge found for button ${matchedButton.id}, trying fallback`)
      }

      // Fallback edge específico
      const fallbackEdge = findEdgeByHandle(edges, node.id, 'fallback')
      if (fallbackEdge) {
        logDebug(`[V3] Buttons: Using fallback edge to ${fallbackEdge.target}`)
        return fallbackEdge.target
      }

      // Default: qualquer edge de saída (botão não conectado pode seguir para próximo nó genérico)
      const defaultEdge = findOutgoingEdge(edges, node.id)
      if (defaultEdge) {
        logDebug(`[V3] Buttons: Using default edge to ${defaultEdge.target}`)
        return defaultEdge.target
      }

      logDebug(`[V3] Buttons: No edge found at all, flow will end`)
      return undefined
    }

    case 'list': {
      // Lista interativa
      const data = node.data as {
        items?: Array<{ id: string; title: string }>
      }
      const items = data.items || []

      const userInput = incomingMessage.listId ||
        incomingMessage.buttonId ||
        incomingMessage.text?.toLowerCase()

      logDebug(`[V3] List: Processing response: ${userInput}`)

      const normalizedInput = normalizeTextForComparison(userInput || '')

      const matchedItem = items.find(item => {
        if (item.id === userInput || item.id.toLowerCase() === userInput) return true
        if (item.title.toLowerCase() === userInput) return true
        if (normalizeTextForComparison(item.title) === normalizedInput) return true
        return false
      })

      if (matchedItem) {
        logDebug(`[V3] List: Matched item: ${matchedItem.id}`)

        // Tentar encontrar edge pelo ID direto
        let edge = findEdgeByHandle(edges, node.id, matchedItem.id)

        // Fallback: tentar com prefixo 'item_' (formato do workflow builder)
        if (!edge) {
          edge = findEdgeByHandle(edges, node.id, `item_${matchedItem.id}`)
          if (edge) logDebug(`[V3] List: Found edge with item_ prefix`)
        }

        if (edge) return edge.target
      }

      // Fallback
      const fallbackEdge = findEdgeByHandle(edges, node.id, 'fallback')
      if (fallbackEdge) return fallbackEdge.target

      // Default edge
      const defaultEdge = findOutgoingEdge(edges, node.id)
      return defaultEdge?.target
    }

    case 'menu': {
      // Match button/menu response
      const data = node.data as { options?: Array<{ id: string; label: string }> }
      const options = data.options || []

      const userInput = incomingMessage.buttonId ||
        incomingMessage.listId ||
        incomingMessage.text?.toLowerCase()

      const normalizedInput = normalizeTextForComparison(userInput || '')

      const matchedOption = options.find(opt => {
        if (opt.id === userInput || opt.id.toLowerCase() === userInput) return true
        if (opt.label.toLowerCase() === userInput) return true
        if (normalizeTextForComparison(opt.label) === normalizedInput) return true
        return false
      })

      if (matchedOption) {
        const edge = findEdgeByHandle(edges, node.id, matchedOption.id)
        if (edge) return edge.target
      }

      // Fallback edge
      const fallbackEdge = findEdgeByHandle(edges, node.id, 'fallback')
      if (fallbackEdge) return fallbackEdge.target

      return undefined
    }

    case 'input': {
      // Save input value and continue
      const data = node.data as { variableName?: string }
      if (data.variableName && incomingMessage.text) {
        await context.setVariable(data.variableName, incomingMessage.text)
      }

      const edge = findOutgoingEdge(edges, node.id)
      return edge?.target
    }

    default:
      return undefined
  }
}

// =============================================================================
// FLOW MATCHING
// =============================================================================

/**
 * Find a flow that matches the incoming message
 * Searches both 'flows' table (new) and 'workflows' table (legacy)
 */
async function findMatchingFlow(
  botId: string,
  incomingMessage: IncomingMessage,
  state: stateManager.ConversationState
): Promise<Flow | null> {
  // If conversation has active flow, continue with it
  const stateWithFlow = state as stateManager.ConversationState & { flowId?: string }
  if (state.currentNodeId && stateWithFlow.flowId) {
    // Try flows table first
    let flow = await flowDb.getById(stateWithFlow.flowId)
    if (flow && flow.status === 'published') {
      return flow
    }

    // Try workflows table (legacy)
    flow = await getWorkflowAsFlow(stateWithFlow.flowId)
    if (flow) return flow
  }

  // Get all published flows for this bot from flows table
  const allFlows = await flowDb.getAll(botId)
  let flows = allFlows.filter((f: Flow) => f.status === 'published')

  // Also get workflows from legacy table
  const workflows = await getPublishedWorkflows()
  flows = [...flows, ...workflows]

  logDebug(`[V3] Found ${flows.length} flows (${allFlows.length} from flows table, ${workflows.length} from workflows table)`)

  if (!flows.length) return null

  // Find first matching flow based on trigger
  for (const flow of flows) {
    // Try flow-level trigger first
    let trigger = (flow as any).trigger as TriggerConfig | undefined

    // If no flow-level trigger, try to get from start node
    if (!trigger) {
      const startNode = flow.nodes.find(n => n.type === 'start')
      const startData = startNode?.data as Record<string, unknown> | undefined
      if (startData?.trigger) {
        trigger = startData.trigger as TriggerConfig
      }
    }

    logDebug(`[V3] Checking flow "${flow.name}" (${flow.id}), trigger: ${JSON.stringify(trigger)}`)

    if (!trigger) continue

    if (matchesTrigger(trigger, incomingMessage)) {
      logDebug(`[V3] ✅ Flow "${flow.name}" matched!`)
      // Update state with new flow
      await stateManager.setFlowId(state.conversationId, flow.id)
      return flow
    }
  }

  // If no trigger matches and it's a fresh conversation, use default flow
  if (!state.currentNodeId) {
    const defaultFlow = flows.find((f: Flow) => {
      let trigger = (f as any).trigger as TriggerConfig | undefined
      if (!trigger) {
        const startNode = f.nodes.find((n: FlowNode) => n.type === 'start')
        const startData = startNode?.data as Record<string, unknown> | undefined
        trigger = startData?.trigger as TriggerConfig | undefined
      }
      return trigger?.type === 'any_message'
    }) || flows[0]

    if (defaultFlow) {
      await stateManager.setFlowId(state.conversationId, defaultFlow.id)
      return defaultFlow
    }
  }

  return null
}

/**
 * Check if message matches a trigger configuration
 */
function matchesTrigger(trigger: TriggerConfig, message: IncomingMessage): boolean {
  if (trigger.type === 'any_message') {
    return true
  }

  if (!message.text) return false

  const text = trigger.caseSensitive
    ? message.text
    : message.text.toLowerCase()

  // Support both single value and keywords array
  const triggerWithKeywords = trigger as TriggerConfig & { keywords?: string[] }
  const values = triggerWithKeywords.keywords || [trigger.value || '']

  switch (trigger.type) {
    case 'keyword':
      // Match any of the keywords
      return values.some(keyword => {
        const k = trigger.caseSensitive ? keyword : keyword.toLowerCase()
        return text === k
      })
    case 'starts_with':
      return values.some(v => {
        const val = trigger.caseSensitive ? v : v.toLowerCase()
        return text.startsWith(val)
      })
    case 'contains':
      return values.some(v => {
        const val = trigger.caseSensitive ? v : v.toLowerCase()
        return text.includes(val)
      })
    case 'regex':
      try {
        const regex = new RegExp(trigger.value || '', trigger.caseSensitive ? '' : 'i')
        return regex.test(message.text)
      } catch {
        return false
      }
    default:
      return false
  }
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get workflow from legacy 'workflows' table and convert to Flow format
 */
async function getWorkflowAsFlow(workflowId: string): Promise<Flow | null> {
  try {
    const { data: row, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .eq('status', 'published')
      .single()

    if (error || !row) return null

    return {
      id: row.id as string,
      botId: 'workflow', // Mark as legacy workflow
      name: row.name as string,
      nodes: typeof row.nodes === 'string' ? JSON.parse(row.nodes) : row.nodes || [],
      edges: typeof row.edges === 'string' ? JSON.parse(row.edges) : row.edges || [],
      version: 1,
      status: 'published',
      isMainFlow: false,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }
  } catch {
    return null
  }
}

/**
 * Get all published workflows from legacy 'workflows' table
 */
async function getPublishedWorkflows(): Promise<Flow[]> {
  try {
    const { data: rows, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })

    if (error || !rows) return []

    return rows.map((row: any) => ({
      id: row.id as string,
      botId: 'workflow', // Mark as legacy workflow
      name: row.name as string,
      nodes: typeof row.nodes === 'string' ? JSON.parse(row.nodes) : row.nodes || [],
      edges: typeof row.edges === 'string' ? JSON.parse(row.edges) : row.edges || [],
      version: 1,
      status: 'published' as const,
      isMainFlow: false,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }))
  } catch {
    return []
  }
}

/**
 * Get active bot ID for a phone number
 * Creates a default bot if none exists
 */
async function getActiveBotId(phoneNumberId: string): Promise<string | null> {
  try {
    // 1. Check if there's a configured active bot
    const botId = await settingsDb.get('active_bot_id')
    if (botId) {
      // Verify the bot exists
      const bot = await botDb.getById(botId)
      if (bot) return botId
    }

    // 2. Try to find any existing bot
    const bots = await botDb.getAll()
    if (bots.length > 0) {
      // Save as active bot for future use
      await settingsDb.set('active_bot_id', bots[0].id)
      return bots[0].id
    }

    // 3. Create a default bot if none exists
    const defaultBot = await botDb.create({
      name: 'Bot Principal',
      phoneNumberId,
    })

    await settingsDb.set('active_bot_id', defaultBot.id)
    logDebug(`Created default bot: ${defaultBot.id}`)

    return defaultBot.id
  } catch (error) {
    logError('Failed to get or create bot', {}, error)
    return null
  }
}

/**
 * Check if session has timed out
 */
async function checkSessionTimeout(
  state: stateManager.ConversationState,
  timeoutMs: number
): Promise<boolean> {
  if (!state.lastMessageAt) return false

  const lastActivity = new Date(state.lastMessageAt).getTime()
  const now = Date.now()

  return (now - lastActivity) > timeoutMs
}
