/**
 * Flow Engine Types
 * 
 * Types specific to the flow engine execution layer.
 * Re-exports base types from nodes/base.ts for convenience.
 */

// Re-export base types
export type {
  ExecutionContext,
  WhatsAppMessagePayload,
  SendMessageResult,
  NodeExecutionResult,
  ValidationResult,
  NodeExecutor,
  NodeExecutorRegistry,
} from './nodes/base'

export {
  findOutgoingEdge,
  findEdgeByHandle,
  findNextNodeId,
  findStartNode,
  getNodeById,
} from './nodes/base'

// =============================================================================
// MODE EXECUTOR INTERFACE
// =============================================================================

import type { Flow, FlowExecution, FlowExecutionMode } from '@/types'
import type { ExecutionContext, NodeExecutionResult } from './nodes/base'

/**
 * Options for starting a flow execution
 */
export interface ExecuteFlowOptions {
  flowId: string
  mode: FlowExecutionMode
  
  // For campaign mode
  contacts?: Array<{
    phone: string
    name?: string
    variables?: Record<string, string>
  }>
  
  // For chatbot mode
  webhookMessage?: {
    from: string
    content: string
    type: 'text' | 'button_reply' | 'list_reply' | 'interactive'
    buttonId?: string
    listId?: string
    messageId: string
    contextMessageId?: string
  }
  
  // Execution options
  options?: {
    delayBetweenMessages?: number  // ms, default 6000 for campaigns
    maxRetries?: number            // default 3
    dryRun?: boolean               // simulate without sending
  }
}

/**
 * Result from starting a flow execution
 */
export interface ExecuteFlowResult {
  executionId: string
  status: 'pending' | 'running'
  mode: FlowExecutionMode
  contactCount?: number
  estimatedDuration?: string
  statusUrl: string
}

/**
 * Interface for mode-specific executors (campaign vs chatbot)
 */
export interface ModeExecutor {
  /**
   * The execution mode this executor handles
   */
  mode: FlowExecutionMode
  
  /**
   * Start execution of a flow in this mode
   */
  execute(options: ExecuteFlowOptions): Promise<ExecuteFlowResult>
  
  /**
   * Get the status of an execution
   */
  getStatus(executionId: string): Promise<FlowExecution | null>
  
  /**
   * Pause an execution (campaign only)
   */
  pause?(executionId: string): Promise<FlowExecution | null>
  
  /**
   * Resume a paused execution (campaign only)
   */
  resume?(executionId: string): Promise<FlowExecution | null>
  
  /**
   * Cancel an execution
   */
  cancel(executionId: string): Promise<FlowExecution | null>
}

// =============================================================================
// WEBHOOK PROCESSING
// =============================================================================

/**
 * Incoming WhatsApp webhook message
 */
export interface IncomingWebhookMessage {
  from: string
  messageId: string
  timestamp: string
  type: 'text' | 'interactive' | 'button' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'contacts' | 'sticker' | 'reaction'
  
  // Content based on type
  text?: { body: string }
  interactive?: {
    type: 'button_reply' | 'list_reply'
    button_reply?: { id: string; title: string }
    list_reply?: { id: string; title: string; description?: string }
  }
  button?: { text: string; payload: string }
  
  // Media content
  image?: { id: string; mime_type: string; sha256: string; caption?: string }
  audio?: { id: string; mime_type: string; sha256: string; voice?: boolean }
  video?: { id: string; mime_type: string; sha256: string; caption?: string }
  document?: { id: string; mime_type: string; sha256: string; filename?: string; caption?: string }
  sticker?: { id: string; mime_type: string; sha256: string; animated?: boolean }
  
  // Location content
  location?: { latitude: number; longitude: number; name?: string; address?: string }
  
  // Contact sharing
  contacts?: Array<{
    name: { formatted_name: string; first_name?: string; last_name?: string }
    phones?: Array<{ phone: string; type?: string }>
  }>
  
  // Reaction
  reaction?: { message_id: string; emoji: string }
  
  // Context (reply reference)
  context?: { from: string; id: string }
  
  // Contact info from webhook
  contactName?: string
}

/**
 * WhatsApp status update from webhook
 */
export interface WhatsAppStatusUpdate {
  messageId: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: string
  recipientId: string
  errors?: Array<{
    code: number
    title: string
    message: string
  }>
}

// =============================================================================
// TRIGGER CONFIGURATION
// =============================================================================

/**
 * Trigger types for chatbot flows
 */
export type TriggerType = 
  | 'any_message'     // Trigger on any incoming message
  | 'keyword'         // Exact keyword match
  | 'starts_with'     // Message starts with pattern
  | 'contains'        // Message contains pattern
  | 'regex'           // Regular expression match
  | 'button_click'    // Button reply from previous message
  | 'list_select'     // List selection from previous message

/**
 * Flow trigger configuration
 */
export interface TriggerConfig {
  type: TriggerType
  value?: string          // Keyword, pattern, or regex
  caseSensitive?: boolean // For text matching, default false
  priority?: number       // Higher priority triggers are checked first
}

// =============================================================================
// RATE LIMITING
// =============================================================================

/**
 * Rate limit configuration for campaign mode
 */
export interface RateLimitConfig {
  messagesPerSecond: number      // Max messages per second
  delayBetweenMessages: number   // Delay in ms between messages to same recipient
  maxRetries: number             // Max retries on rate limit error
  backoffMultiplier: number      // Multiplier for exponential backoff
}

/**
 * Default rate limit configuration
 * WhatsApp allows 1 message per 6 seconds to the same recipient
 */
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  messagesPerSecond: 10,
  delayBetweenMessages: 6000,  // 6 seconds
  maxRetries: 3,
  backoffMultiplier: 2,
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Flow engine error types
 */
export type FlowEngineErrorType =
  | 'FLOW_NOT_FOUND'
  | 'EXECUTION_NOT_FOUND'
  | 'NODE_NOT_FOUND'
  | 'INVALID_MODE'
  | 'CREDENTIALS_MISSING'
  | 'WHATSAPP_ERROR'
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN'

/**
 * Flow engine error
 */
export class FlowEngineError extends Error {
  constructor(
    public type: FlowEngineErrorType,
    message: string,
    public code?: number,
    public retryable: boolean = false
  ) {
    super(message)
    this.name = 'FlowEngineError'
  }
}
