/**
 * Flow Engine Message Sender
 * 
 * Handles sending messages via WhatsApp Cloud API v24.0.
 * Integrates with whatsapp-errors.ts for error handling.
 */

import { mapWhatsAppError, isCriticalError, isRetryableError } from '@/lib/whatsapp-errors'
import type { SendMessageResult, WhatsAppMessagePayload } from './types'

// =============================================================================
// CONSTANTS
// =============================================================================

const WHATSAPP_API_VERSION = 'v24.0'
const WHATSAPP_API_BASE = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`

// Debug logging
const DEBUG = process.env.FLOW_ENGINE_DEBUG === 'true'

// =============================================================================
// TYPES
// =============================================================================

export interface SendOptions {
  phoneNumberId: string
  accessToken: string
  to: string
  payload: WhatsAppMessagePayload
  replyToMessageId?: string
}

export interface WhatsAppApiResponse {
  messaging_product: 'whatsapp'
  contacts: Array<{ input: string; wa_id: string }>
  messages: Array<{ id: string }>
}

export interface WhatsAppApiError {
  error: {
    message: string
    type: string
    code: number
    error_subcode?: number
    error_data?: {
      messaging_product: string
      details: string
    }
    fbtrace_id?: string
  }
}

// =============================================================================
// MAIN SEND FUNCTION
// =============================================================================

/**
 * Send a message via WhatsApp Cloud API
 */
export async function sendWhatsAppMessage(options: SendOptions): Promise<SendMessageResult> {
  const { phoneNumberId, accessToken, to, payload, replyToMessageId } = options
  
  const url = `${WHATSAPP_API_BASE}/${phoneNumberId}/messages`
  
  // Build the request body
  const body: Record<string, unknown> = {
    messaging_product: 'whatsapp',
    to,
    ...payload.payload,
  }
  
  // Add reply context if provided
  if (replyToMessageId) {
    body.context = { message_id: replyToMessageId }
  }
  
  if (DEBUG) {
    console.log(`[FlowEngine:Sender] Sending ${payload.type} to ${to}`)
  }
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      return handleApiError(data as WhatsAppApiError, to)
    }
    
    const apiResponse = data as WhatsAppApiResponse
    const messageId = apiResponse.messages?.[0]?.id
    
    if (DEBUG) {
      console.log(`[FlowEngine:Sender] ✅ Message sent: ${messageId}`)
    }
    
    return {
      success: true,
      messageId,
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[FlowEngine:Sender] ❌ Network error:`, errorMessage)
    
    return {
      success: false,
      errorMessage: `Network error: ${errorMessage}`,
    }
  }
}

/**
 * Handle API error response
 */
function handleApiError(data: WhatsAppApiError, to: string): SendMessageResult {
  const errorCode = data.error?.code || 0
  const errorSubcode = data.error?.error_subcode
  const rawMessage = data.error?.message || 'Unknown WhatsApp API error'
  
  // Use our error mapping for detailed info
  const mappedError = mapWhatsAppError(errorSubcode || errorCode)
  
  console.error(`[FlowEngine:Sender] ❌ API error for ${to}: [${errorCode}/${errorSubcode}] ${rawMessage}`)
  
  return {
    success: false,
    errorCode: errorSubcode || errorCode,
    errorMessage: mappedError?.userMessage || rawMessage,
  }
}

// =============================================================================
// BATCH SENDING
// =============================================================================

export interface BatchSendOptions {
  phoneNumberId: string
  accessToken: string
  messages: Array<{
    to: string
    payload: WhatsAppMessagePayload
    replyToMessageId?: string
  }>
  delayMs?: number  // Delay between messages (default: 0)
  onProgress?: (sent: number, total: number) => void
  onError?: (to: string, error: SendMessageResult) => void
}

export interface BatchSendResult {
  total: number
  successful: number
  failed: number
  results: Array<{
    to: string
    result: SendMessageResult
  }>
}

/**
 * Send multiple messages with optional delay
 * 
 * Note: For campaign mode with many contacts, use QStash workflow instead
 * to handle rate limiting and durability.
 */
export async function sendBatch(options: BatchSendOptions): Promise<BatchSendResult> {
  const { phoneNumberId, accessToken, messages, delayMs = 0, onProgress, onError } = options
  
  const results: BatchSendResult['results'] = []
  let successful = 0
  let failed = 0
  
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    
    const result = await sendWhatsAppMessage({
      phoneNumberId,
      accessToken,
      to: msg.to,
      payload: msg.payload,
      replyToMessageId: msg.replyToMessageId,
    })
    
    results.push({ to: msg.to, result })
    
    if (result.success) {
      successful++
    } else {
      failed++
      onError?.(msg.to, result)
    }
    
    onProgress?.(i + 1, messages.length)
    
    // Apply delay between messages (except for last one)
    if (delayMs > 0 && i < messages.length - 1) {
      await sleep(delayMs)
    }
  }
  
  return {
    total: messages.length,
    successful,
    failed,
    results,
  }
}

// =============================================================================
// SPECIFIC MESSAGE BUILDERS
// =============================================================================

/**
 * Build and send a text message
 */
export async function sendTextMessage(options: {
  phoneNumberId: string
  accessToken: string
  to: string
  text: string
  previewUrl?: boolean
  replyToMessageId?: string
}): Promise<SendMessageResult> {
  return sendWhatsAppMessage({
    phoneNumberId: options.phoneNumberId,
    accessToken: options.accessToken,
    to: options.to,
    replyToMessageId: options.replyToMessageId,
    payload: {
      type: 'text',
      payload: {
        type: 'text',
        text: {
          body: options.text,
          preview_url: options.previewUrl ?? false,
        },
      },
    },
  })
}

/**
 * Build and send an image message
 */
export async function sendImageMessage(options: {
  phoneNumberId: string
  accessToken: string
  to: string
  imageUrl?: string
  mediaId?: string
  caption?: string
}): Promise<SendMessageResult> {
  const image: Record<string, string> = {}
  
  if (options.mediaId) {
    image.id = options.mediaId
  } else if (options.imageUrl) {
    image.link = options.imageUrl
  } else {
    return { success: false, errorMessage: 'Either imageUrl or mediaId is required' }
  }
  
  if (options.caption) {
    image.caption = options.caption
  }
  
  return sendWhatsAppMessage({
    phoneNumberId: options.phoneNumberId,
    accessToken: options.accessToken,
    to: options.to,
    payload: {
      type: 'image',
      payload: {
        type: 'image',
        image,
      },
    },
  })
}

/**
 * Build and send a video message
 */
export async function sendVideoMessage(options: {
  phoneNumberId: string
  accessToken: string
  to: string
  videoUrl?: string
  mediaId?: string
  caption?: string
}): Promise<SendMessageResult> {
  const video: Record<string, string> = {}
  
  if (options.mediaId) {
    video.id = options.mediaId
  } else if (options.videoUrl) {
    video.link = options.videoUrl
  } else {
    return { success: false, errorMessage: 'Either videoUrl or mediaId is required' }
  }
  
  if (options.caption) {
    video.caption = options.caption
  }
  
  return sendWhatsAppMessage({
    phoneNumberId: options.phoneNumberId,
    accessToken: options.accessToken,
    to: options.to,
    payload: {
      type: 'video',
      payload: {
        type: 'video',
        video,
      },
    },
  })
}

/**
 * Build and send an audio message
 */
export async function sendAudioMessage(options: {
  phoneNumberId: string
  accessToken: string
  to: string
  audioUrl?: string
  mediaId?: string
}): Promise<SendMessageResult> {
  const audio: Record<string, string> = {}
  
  if (options.mediaId) {
    audio.id = options.mediaId
  } else if (options.audioUrl) {
    audio.link = options.audioUrl
  } else {
    return { success: false, errorMessage: 'Either audioUrl or mediaId is required' }
  }
  
  return sendWhatsAppMessage({
    phoneNumberId: options.phoneNumberId,
    accessToken: options.accessToken,
    to: options.to,
    payload: {
      type: 'audio',
      payload: {
        type: 'audio',
        audio,
      },
    },
  })
}

/**
 * Build and send a document message
 */
export async function sendDocumentMessage(options: {
  phoneNumberId: string
  accessToken: string
  to: string
  documentUrl?: string
  mediaId?: string
  filename?: string
  caption?: string
}): Promise<SendMessageResult> {
  const document: Record<string, string> = {}
  
  if (options.mediaId) {
    document.id = options.mediaId
  } else if (options.documentUrl) {
    document.link = options.documentUrl
  } else {
    return { success: false, errorMessage: 'Either documentUrl or mediaId is required' }
  }
  
  if (options.filename) {
    document.filename = options.filename
  }
  if (options.caption) {
    document.caption = options.caption
  }
  
  return sendWhatsAppMessage({
    phoneNumberId: options.phoneNumberId,
    accessToken: options.accessToken,
    to: options.to,
    payload: {
      type: 'document',
      payload: {
        type: 'document',
        document,
      },
    },
  })
}

/**
 * Build and send a location message
 */
export async function sendLocationMessage(options: {
  phoneNumberId: string
  accessToken: string
  to: string
  latitude: number
  longitude: number
  name?: string
  address?: string
}): Promise<SendMessageResult> {
  const location: Record<string, string | number> = {
    latitude: options.latitude,
    longitude: options.longitude,
  }
  
  if (options.name) {
    location.name = options.name
  }
  if (options.address) {
    location.address = options.address
  }
  
  return sendWhatsAppMessage({
    phoneNumberId: options.phoneNumberId,
    accessToken: options.accessToken,
    to: options.to,
    payload: {
      type: 'location',
      payload: {
        type: 'location',
        location,
      },
    },
  })
}

/**
 * Build and send an interactive buttons message
 */
export async function sendButtonsMessage(options: {
  phoneNumberId: string
  accessToken: string
  to: string
  bodyText: string
  buttons: Array<{ id: string; title: string }>
  headerText?: string
  footerText?: string
}): Promise<SendMessageResult> {
  if (options.buttons.length > 3) {
    return { success: false, errorMessage: 'Maximum 3 buttons allowed' }
  }
  
  const interactive: Record<string, unknown> = {
    type: 'button',
    body: { text: options.bodyText },
    action: {
      buttons: options.buttons.map(btn => ({
        type: 'reply',
        reply: {
          id: btn.id,
          title: btn.title.substring(0, 20),
        },
      })),
    },
  }
  
  if (options.headerText) {
    interactive.header = { type: 'text', text: options.headerText }
  }
  if (options.footerText) {
    interactive.footer = { text: options.footerText }
  }
  
  return sendWhatsAppMessage({
    phoneNumberId: options.phoneNumberId,
    accessToken: options.accessToken,
    to: options.to,
    payload: {
      type: 'interactive',
      payload: {
        type: 'interactive',
        interactive,
      },
    },
  })
}

/**
 * Build and send an interactive list message
 */
export async function sendListMessage(options: {
  phoneNumberId: string
  accessToken: string
  to: string
  bodyText: string
  buttonText: string
  sections: Array<{
    title?: string
    rows: Array<{ id: string; title: string; description?: string }>
  }>
  headerText?: string
  footerText?: string
}): Promise<SendMessageResult> {
  const interactive: Record<string, unknown> = {
    type: 'list',
    body: { text: options.bodyText },
    action: {
      button: options.buttonText.substring(0, 20),
      sections: options.sections.map(section => ({
        title: section.title?.substring(0, 24),
        rows: section.rows.map(row => ({
          id: row.id,
          title: row.title.substring(0, 24),
          description: row.description?.substring(0, 72),
        })),
      })),
    },
  }
  
  if (options.headerText) {
    interactive.header = { type: 'text', text: options.headerText }
  }
  if (options.footerText) {
    interactive.footer = { text: options.footerText }
  }
  
  return sendWhatsAppMessage({
    phoneNumberId: options.phoneNumberId,
    accessToken: options.accessToken,
    to: options.to,
    payload: {
      type: 'interactive',
      payload: {
        type: 'interactive',
        interactive,
      },
    },
  })
}

/**
 * Build and send a reaction message
 */
export async function sendReactionMessage(options: {
  phoneNumberId: string
  accessToken: string
  to: string
  messageId: string
  emoji: string
}): Promise<SendMessageResult> {
  return sendWhatsAppMessage({
    phoneNumberId: options.phoneNumberId,
    accessToken: options.accessToken,
    to: options.to,
    payload: {
      type: 'reaction',
      payload: {
        type: 'reaction',
        reaction: {
          message_id: options.messageId,
          emoji: options.emoji,
        },
      },
    },
  })
}

// =============================================================================
// HELPERS
// =============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Check if an error is critical (should stop execution)
 */
export function isFlowCriticalError(errorCode: number | undefined): boolean {
  if (!errorCode) return false
  return isCriticalError(errorCode)
}

/**
 * Check if an error is retryable
 */
export function isFlowRetryableError(errorCode: number | undefined): boolean {
  if (!errorCode) return false
  return isRetryableError(errorCode)
}
