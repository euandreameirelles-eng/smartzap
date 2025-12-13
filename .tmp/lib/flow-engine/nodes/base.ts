/**
 * Flow Engine Node Base
 * 
 * Define a interface base para todos os executores de node.
 * Seguindo o padrão de plugin para extensibilidade.
 */

import type {
  FlowNode,
  FlowEdge,
  NodeType,
  FlowExecutionMode,
  NodeExecutionStatus
} from '@/types'

// =============================================================================
// EXECUTION CONTEXT
// =============================================================================

/**
 * Context passed to every node executor
 */
export interface ExecutionContext {
  // Execution identifiers
  executionId: string
  flowId: string
  mode: FlowExecutionMode

  // Contact information
  contactPhone: string
  contactName?: string

  // Flow structure
  nodes: FlowNode[]
  edges: FlowEdge[]

  // Current state
  currentNodeId: string
  previousNodeId?: string

  // Variables available for substitution
  variables: Record<string, string>

  // Conversation history (for AI nodes)
  conversationHistory?: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }>

  // WhatsApp credentials
  phoneNumberId: string
  accessToken: string

  // Incoming message (for chatbot mode)
  incomingMessage?: {
    type: 'text' | 'button_reply' | 'list_reply' | 'interactive' | 'image' | 'audio' | 'video' | 'document' | 'location'
    text?: string
    buttonId?: string
    listId?: string
    messageId: string
    contextMessageId?: string
    mediaUrl?: string
  }

  // Utilities
  sendMessage: (payload: WhatsAppMessagePayload) => Promise<SendMessageResult>
  setVariable: (key: string, value: string) => Promise<void>
  log: (message: string, level?: 'debug' | 'info' | 'warn' | 'error') => void
}

// =============================================================================
// MESSAGE TYPES
// =============================================================================

/**
 * WhatsApp message payload structure
 */
export interface WhatsAppMessagePayload {
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'location' | 'contacts' | 'interactive' | 'template' | 'reaction'
  payload: Record<string, unknown>
}

/**
 * Result from sending a message
 */
export interface SendMessageResult {
  success: boolean
  messageId?: string
  errorCode?: number
  errorMessage?: string
}

// =============================================================================
// NODE EXECUTION RESULT
// =============================================================================

/**
 * Result returned by a node executor
 */
export interface NodeExecutionResult {
  // Whether the node executed successfully
  success: boolean

  // Next node to execute (if any)
  nextNodeId?: string

  // Messages to send to the user
  messages?: WhatsAppMessagePayload[]

  // Error information
  error?: string
  errorCode?: number

  // Special flags
  endConversation?: boolean
  pauseExecution?: boolean
  collectInput?: {
    variableName: string
    validationType?: string
  }

  // For delay nodes
  delayMs?: number

  // Output data (saved to node execution record)
  output?: Record<string, unknown>
}

// =============================================================================
// VALIDATION RESULT
// =============================================================================

/**
 * Result from validating node configuration
 */
export interface ValidationResult {
  valid: boolean
  errors?: string[]
  warnings?: string[]
}

// =============================================================================
// NODE EXECUTOR INTERFACE
// =============================================================================

/**
 * Interface for node executors
 * 
 * Each node type implements this interface to handle its specific logic.
 * This enables a plugin architecture where new nodes can be added easily.
 * 
 * @example
 * ```typescript
 * const messageExecutor: NodeExecutor<MessageNodeData> = {
 *   type: 'message',
 *   
 *   async execute(context, node) {
 *     const text = processVariables(node.data.text, context.variables)
 *     await context.sendMessage({ type: 'text', payload: { text: { body: text } } })
 *     return { success: true, nextNodeId: findNextNode(context.edges, node.id) }
 *   },
 *   
 *   validate(node, edges) {
 *     if (!node.data.text) return { valid: false, errors: ['Text is required'] }
 *     return { valid: true }
 *   }
 * }
 * ```
 */
export interface NodeExecutor<TData = unknown> {
  /**
   * The node type this executor handles
   */
  type: NodeType | string

  /**
   * Execute the node logic
   * 
   * @param context - Execution context with state and utilities
   * @param node - The node to execute
   * @returns Execution result with next steps
   */
  execute(context: ExecutionContext, node: FlowNode & { data: TData }): Promise<NodeExecutionResult>

  /**
   * Validate node configuration (optional)
   * 
   * @param node - The node to validate
   * @param edges - Flow edges for connection validation
   * @returns Validation result with any errors or warnings
   */
  validate?(node: FlowNode & { data: TData }, edges: FlowEdge[]): ValidationResult

  /**
   * Process user response for this node (optional)
   * Only needed for nodes that wait for user input (menu, input, buttons, etc.)
   * 
   * @param context - Execution context with incoming message
   * @param node - The current node
   * @returns Next node to transition to, or undefined to stay on current node
   */
  processResponse?(context: ExecutionContext, node: FlowNode & { data: TData }): Promise<string | undefined>
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Find the default outgoing edge from a node
 * Handles edges with sourceHandle="output", edges without sourceHandle,
 * and falls back to ANY outgoing edge if none of the above match
 */
export function findOutgoingEdge(edges: FlowEdge[], sourceId: string): FlowEdge | undefined {
  // First try to find edge with "output" handle (common default)
  const outputEdge = edges.find(e => e.source === sourceId && e.sourceHandle === 'output')
  if (outputEdge) return outputEdge

  // Second: try edge without sourceHandle
  const noHandleEdge = edges.find(e => e.source === sourceId && !e.sourceHandle)
  if (noHandleEdge) return noHandleEdge

  // Final fallback: any edge coming from this source (for workflow builder compatibility)
  // This handles cases where all edges have specific handles like "button_xyz"
  return edges.find(e => e.source === sourceId)
}

/**
 * Find an edge by source handle (for branching nodes)
 */
export function findEdgeByHandle(edges: FlowEdge[], sourceId: string, handle: string): FlowEdge | undefined {
  return edges.find(e => e.source === sourceId && e.sourceHandle === handle)
}

/**
 * Find the next node ID based on default edge
 */
export function findNextNodeId(edges: FlowEdge[], sourceId: string): string | undefined {
  const edge = findOutgoingEdge(edges, sourceId)
  return edge?.target
}

/**
 * Find the start node in a flow
 */
export function findStartNode(nodes: FlowNode[]): FlowNode | undefined {
  return nodes.find(n => n.type === 'start')
}

/**
 * Get a node by ID
 */
export function getNodeById(nodes: FlowNode[], nodeId: string): FlowNode | undefined {
  return nodes.find(n => n.id === nodeId)
}

// =============================================================================
// NODE EXECUTOR REGISTRY TYPE
// =============================================================================

/**
 * Registry mapping node types to their executors
 */
export type NodeExecutorRegistry = Record<string, NodeExecutor<unknown>>
