/**
 * Flow Engine - Bot conversation flow execution
 * 
 * Handles the execution of visual flows created in the editor.
 * Manages state, variable substitution, and node traversal.
 */

// Core executor (export specific items to avoid conflicts)
export {
  executeStep,
  processIncomingMessage,
  FlowExecutor,
  type ExecutionContext as LegacyExecutionContext,
  type ExecutionResult,
  type WhatsAppMessage,
} from './executor'

// State management
export * from './state'

// Variable processing
export * from './variables'

// Validation
export { validateFlow, canPublish, type ValidationResult, type ValidationError, type ValidationWarning } from './validator'

// Node handlers
export * from './nodes'

// Types (from types.ts)
export type {
  ExecuteFlowOptions,
  ExecuteFlowResult,
  ModeExecutor,
  IncomingWebhookMessage,
  WhatsAppStatusUpdate,
  TriggerType,
  TriggerConfig,
  RateLimitConfig,
  FlowEngineErrorType,
} from './types'

export { DEFAULT_RATE_LIMIT, FlowEngineError } from './types'

// Re-export ExecutionContext from nodes/base as the canonical type
export type { ExecutionContext } from './nodes/base'

// Sender utilities
export * from './sender'

// Error handling
export * from './error-handler'

// Plugins (extensões do Flow Engine)
export * from './plugins'


