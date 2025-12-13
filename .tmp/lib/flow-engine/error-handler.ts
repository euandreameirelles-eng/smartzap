/**
 * Flow Engine Error Handler
 * 
 * Handles errors during flow execution with retry logic,
 * categorization, and appropriate responses.
 */

import { mapWhatsAppError, isCriticalError, isOptOutError, isRetryableError } from '@/lib/whatsapp-errors'
import { FlowEngineError, type FlowEngineErrorType, DEFAULT_RATE_LIMIT } from './types'
import type { SendMessageResult } from './nodes/base'

// =============================================================================
// TYPES
// =============================================================================

export interface ErrorContext {
  executionId: string
  nodeId: string
  contactPhone?: string
  retryCount: number
  maxRetries: number
}

export interface ErrorHandlingResult {
  shouldRetry: boolean
  shouldContinue: boolean  // Continue with other contacts/nodes
  shouldAbort: boolean     // Stop entire execution
  delayMs?: number         // Delay before retry
  action?: string          // Suggested action for user
  category?: string        // Error category
}

// =============================================================================
// ERROR HANDLER
// =============================================================================

/**
 * Handle an error from message sending
 */
export function handleSendError(
  result: SendMessageResult,
  context: ErrorContext
): ErrorHandlingResult {
  const { errorCode, errorMessage } = result
  const { retryCount, maxRetries } = context
  
  // Get mapped error info
  const mappedError = errorCode ? mapWhatsAppError(errorCode) : null
  
  // Default result
  const handling: ErrorHandlingResult = {
    shouldRetry: false,
    shouldContinue: true,
    shouldAbort: false,
    category: mappedError?.category || 'unknown',
    action: mappedError?.action,
  }
  
  // No error code - treat as network error, retry
  if (!errorCode) {
    handling.shouldRetry = retryCount < maxRetries
    handling.delayMs = calculateBackoff(retryCount)
    handling.category = 'network'
    return handling
  }
  
  // Critical errors - stop everything
  if (isCriticalError(errorCode)) {
    handling.shouldRetry = false
    handling.shouldContinue = false
    handling.shouldAbort = true
    return handling
  }
  
  // Opt-out errors - mark contact, continue with others
  if (isOptOutError(errorCode)) {
    handling.shouldRetry = false
    handling.shouldContinue = true
    handling.shouldAbort = false
    handling.category = 'opt_out'
    return handling
  }
  
  // Rate limit errors - retry with backoff
  if (isRateLimitError(errorCode)) {
    handling.shouldRetry = retryCount < maxRetries
    handling.shouldContinue = true
    handling.delayMs = calculateRateLimitBackoff(retryCount)
    handling.category = 'rate_limit'
    return handling
  }
  
  // Retryable errors - retry with standard backoff
  if (isRetryableError(errorCode)) {
    handling.shouldRetry = retryCount < maxRetries
    handling.shouldContinue = true
    handling.delayMs = calculateBackoff(retryCount)
    return handling
  }
  
  // Invalid number errors - skip contact, continue
  if (isInvalidNumberError(errorCode)) {
    handling.shouldRetry = false
    handling.shouldContinue = true
    handling.category = 'invalid_number'
    return handling
  }
  
  // Unknown errors - limited retry
  handling.shouldRetry = retryCount < Math.min(maxRetries, 1)
  handling.shouldContinue = true
  handling.delayMs = calculateBackoff(retryCount)
  
  return handling
}

// =============================================================================
// BACKOFF CALCULATIONS
// =============================================================================

/**
 * Calculate exponential backoff delay
 */
function calculateBackoff(retryCount: number): number {
  const baseDelay = 1000 // 1 second
  const maxDelay = 30000 // 30 seconds
  const delay = Math.min(baseDelay * Math.pow(DEFAULT_RATE_LIMIT.backoffMultiplier, retryCount), maxDelay)
  // Add jitter (±10%)
  const jitter = delay * 0.1 * (Math.random() * 2 - 1)
  return Math.floor(delay + jitter)
}

/**
 * Calculate rate limit specific backoff
 * WhatsApp rate limit is 1 msg/6s per pair
 */
function calculateRateLimitBackoff(retryCount: number): number {
  const baseDelay = DEFAULT_RATE_LIMIT.delayBetweenMessages // 6 seconds
  const multiplier = Math.pow(DEFAULT_RATE_LIMIT.backoffMultiplier, retryCount)
  const delay = Math.min(baseDelay * multiplier, 60000) // Max 60 seconds
  return delay
}

// =============================================================================
// ERROR CODE CHECKS
// =============================================================================

/**
 * Check if error is a rate limit error
 */
function isRateLimitError(code: number): boolean {
  return [
    131056, // Pair rate limit
    131048, // Spam rate limit
    131026, // Message undeliverable (rate)
    130472, // Number not in the whitelist
  ].includes(code)
}

/**
 * Check if error is an invalid number error
 */
function isInvalidNumberError(code: number): boolean {
  return [
    131009, // Parameter value is not valid
    131021, // Parameter value missing
    131052, // Media upload error
    131053, // Media download error  
    133010, // Phone number ID doesn't match
  ].includes(code)
}

// =============================================================================
// ERROR CREATION HELPERS
// =============================================================================

/**
 * Create a FlowEngineError from a send result
 */
export function createFlowError(
  result: SendMessageResult,
  defaultMessage: string = 'Message send failed'
): FlowEngineError {
  const errorCode = result.errorCode
  const mappedError = errorCode ? mapWhatsAppError(errorCode) : null
  
  let type: FlowEngineErrorType = 'UNKNOWN'
  let retryable = false
  
  if (errorCode) {
    if (isCriticalError(errorCode)) {
      type = 'WHATSAPP_ERROR'
      retryable = false
    } else if (isRateLimitError(errorCode)) {
      type = 'RATE_LIMIT'
      retryable = true
    } else if (isRetryableError(errorCode)) {
      type = 'WHATSAPP_ERROR'
      retryable = true
    }
  }
  
  return new FlowEngineError(
    type,
    result.errorMessage || mappedError?.userMessage || defaultMessage,
    errorCode,
    retryable
  )
}

/**
 * Create a critical error that should stop execution
 */
export function createCriticalError(
  message: string,
  code?: number
): FlowEngineError {
  return new FlowEngineError('WHATSAPP_ERROR', message, code, false)
}

/**
 * Create a validation error
 */
export function createValidationError(message: string): FlowEngineError {
  return new FlowEngineError('VALIDATION_ERROR', message, undefined, false)
}

// =============================================================================
// LOGGING
// =============================================================================

const DEBUG = process.env.FLOW_ENGINE_DEBUG === 'true'

/**
 * Log an error with context
 */
export function logError(
  message: string,
  context: Partial<ErrorContext>,
  error?: unknown
): void {
  const logData = {
    executionId: context.executionId,
    nodeId: context.nodeId,
    contactPhone: context.contactPhone,
    retryCount: context.retryCount,
    error: error instanceof Error ? error.message : String(error),
  }
  
  console.error(`[FlowEngine:Error] ${message}`, logData)
}

/**
 * Log a warning
 */
export function logWarning(
  message: string,
  context: Partial<ErrorContext>
): void {
  if (DEBUG) {
    console.warn(`[FlowEngine:Warning] ${message}`, {
      executionId: context.executionId,
      nodeId: context.nodeId,
    })
  }
}

/**
 * Log debug info
 */
export function logDebug(message: string, data?: unknown): void {
  if (DEBUG) {
    console.log(`[FlowEngine:Debug] ${message}`, data)
  }
}
