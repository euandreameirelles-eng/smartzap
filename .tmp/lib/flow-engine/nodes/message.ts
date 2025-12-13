/**
 * Message Node Executor
 * 
 * Sends a simple text message to the user.
 * Supports variable substitution and link preview.
 */

import type { FlowNode, FlowEdge } from '@/types'
import { processText } from '../variables'
import type { 
  NodeExecutor, 
  ExecutionContext, 
  NodeExecutionResult,
  WhatsAppMessagePayload,
  ValidationResult 
} from './base'
import { findOutgoingEdge } from './base'

// =============================================================================
// TYPES
// =============================================================================

export interface MessageNodeData {
  text: string
  previewUrl?: boolean
}

// =============================================================================
// EXECUTOR
// =============================================================================

/**
 * Message Node Executor
 * Implements the NodeExecutor interface for text messages.
 */
export const messageNodeExecutor: NodeExecutor<MessageNodeData> = {
  type: 'message',
  
  async execute(context: ExecutionContext, node: FlowNode & { data: MessageNodeData }): Promise<NodeExecutionResult> {
    const data = node.data
    
    // Validate data
    if (!data.text) {
      return {
        success: false,
        error: 'Message node has no text configured',
      }
    }
    
    // Process variables in text
    const processedText = processText(data.text, context.variables, {
      contactPhone: context.contactPhone,
      contactName: context.contactName,
    })
    
    // Build WhatsApp message payload
    const message: WhatsAppMessagePayload = {
      type: 'text',
      payload: {
        messaging_product: 'whatsapp',
        to: context.contactPhone,
        type: 'text',
        text: {
          body: processedText,
          preview_url: data.previewUrl ?? false,
        },
      },
    }
    
    // Find next node
    const outgoingEdge = findOutgoingEdge(context.edges, node.id)
    
    return {
      success: true,
      messages: [message],
      nextNodeId: outgoingEdge?.target,
    }
  },
  
  validate(node: FlowNode & { data: MessageNodeData }, edges: FlowEdge[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const data = node.data
    
    // Check if text exists
    if (!data.text || data.text.trim() === '') {
      errors.push('Message node requires text content')
    }
    
    // Check max length (WhatsApp allows up to 4096 characters)
    if (data.text && data.text.length > 4096) {
      errors.push('Message text exceeds 4096 character limit')
    }
    
    // Warn if near limit
    if (data.text && data.text.length > 3500) {
      warnings.push('Message text is approaching the 4096 character limit')
    }
    
    // Check if has output
    const hasOutput = edges.some(e => e.source === node.id)
    if (!hasOutput) {
      warnings.push('Message node is not connected to another node')
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  },
}

// =============================================================================
// LEGACY EXPORTS (for backward compatibility)
// =============================================================================

export interface MessageNodeResult {
  success: boolean
  nextNodeId?: string
  message?: {
    messaging_product: 'whatsapp'
    to: string
    type: 'text'
    text: { body: string; preview_url?: boolean }
  }
  error?: string
}

/**
 * Legacy handler for message nodes
 * @deprecated Use messageNodeExecutor instead
 */
export function handleMessageNode(
  node: FlowNode,
  edges: FlowEdge[],
  variables: Record<string, string>,
  recipientPhone: string
): MessageNodeResult {
  const data = node.data as MessageNodeData
  
  if (!data.text) {
    return {
      success: false,
      error: 'Nó de mensagem não tem texto configurado'
    }
  }
  
  // Substituir variáveis no texto
  const processedText = processText(data.text, variables, {
    contactPhone: recipientPhone,
  })
  
  // Construir mensagem WhatsApp
  const message = {
    messaging_product: 'whatsapp' as const,
    to: recipientPhone,
    type: 'text' as const,
    text: {
      body: processedText,
      preview_url: data.previewUrl,
    },
  }
  
  // Buscar próximo nó
  const outgoingEdge = edges.find(e => e.source === node.id)
  
  return {
    success: true,
    message,
    nextNodeId: outgoingEdge?.target,
  }
}

/**
 * Legacy validator for message nodes
 * @deprecated Use messageNodeExecutor.validate instead
 */
export function validateMessageNode(node: FlowNode, edges: FlowEdge[]): string[] {
  if (!messageNodeExecutor.validate) return []
  const result = messageNodeExecutor.validate(node as FlowNode & { data: MessageNodeData }, edges)
  return result.errors || []
}
