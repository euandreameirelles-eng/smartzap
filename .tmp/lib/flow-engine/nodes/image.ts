/**
 * Image Node Executor
 * 
 * Sends an image to the user.
 * Supports variable substitution in caption and URL.
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

export interface ImageNodeData {
  mediaId?: string
  mediaUrl?: string
  caption?: string
}

// =============================================================================
// EXECUTOR
// =============================================================================

/**
 * Image Node Executor
 * Implements the NodeExecutor interface for image messages.
 */
export const imageNodeExecutor: NodeExecutor<ImageNodeData> = {
  type: 'image',
  
  async execute(context: ExecutionContext, node: FlowNode & { data: ImageNodeData }): Promise<NodeExecutionResult> {
    const data = node.data
    
    // Validate data
    if (!data.mediaId && !data.mediaUrl) {
      return {
        success: false,
        error: 'Image node requires mediaId or mediaUrl',
      }
    }
    
    // Process variables in URL and caption
    const processedUrl = data.mediaUrl 
      ? processText(data.mediaUrl, context.variables, { 
          contactPhone: context.contactPhone,
          contactName: context.contactName,
        })
      : undefined
    
    const processedCaption = data.caption 
      ? processText(data.caption, context.variables, { 
          contactPhone: context.contactPhone,
          contactName: context.contactName,
        })
      : undefined
    
    // Build WhatsApp message payload
    const imagePayload: Record<string, unknown> = {}
    
    if (data.mediaId) {
      imagePayload.id = data.mediaId
    } else if (processedUrl) {
      imagePayload.link = processedUrl
    }
    
    if (processedCaption) {
      imagePayload.caption = processedCaption
    }
    
    const message: WhatsAppMessagePayload = {
      type: 'image',
      payload: {
        messaging_product: 'whatsapp',
        to: context.contactPhone,
        type: 'image',
        image: imagePayload,
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
  
  validate(node: FlowNode & { data: ImageNodeData }, edges: FlowEdge[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const data = node.data
    
    // Check if has media source
    if (!data.mediaId && !data.mediaUrl) {
      errors.push('Image node requires a media ID or URL')
    }
    
    // Check caption length (WhatsApp allows up to 1024 characters)
    if (data.caption && data.caption.length > 1024) {
      errors.push('Image caption exceeds 1024 character limit')
    }
    
    // Warn if near limit
    if (data.caption && data.caption.length > 900) {
      warnings.push('Image caption is approaching the 1024 character limit')
    }
    
    // Check if has output
    const hasOutput = edges.some(e => e.source === node.id)
    if (!hasOutput) {
      warnings.push('Image node is not connected to another node')
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

export interface ImageNodeResult {
  success: boolean
  nextNodeId?: string
  message?: {
    messaging_product: 'whatsapp'
    to: string
    type: 'image'
    image: { id?: string; link?: string; caption?: string }
  }
  error?: string
}

/**
 * Legacy handler for image nodes
 * @deprecated Use imageNodeExecutor instead
 */
export function handleImageNode(
  node: FlowNode,
  edges: FlowEdge[],
  variables: Record<string, string>,
  recipientPhone: string
): ImageNodeResult {
  const data = node.data as ImageNodeData
  
  if (!data.mediaId && !data.mediaUrl) {
    return {
      success: false,
      error: 'Nó de imagem precisa ter mediaId ou mediaUrl configurado'
    }
  }
  
  // Substituir variáveis na URL e caption
  const processedUrl = data.mediaUrl 
    ? processText(data.mediaUrl, variables, { contactPhone: recipientPhone })
    : undefined
  
  const processedCaption = data.caption 
    ? processText(data.caption, variables, { contactPhone: recipientPhone })
    : undefined
  
  // Construir mensagem WhatsApp
  const imagePayload: { id?: string; link?: string; caption?: string } = {}
  
  if (data.mediaId) {
    imagePayload.id = data.mediaId
  } else if (processedUrl) {
    imagePayload.link = processedUrl
  }
  
  if (processedCaption) {
    imagePayload.caption = processedCaption
  }
  
  const message = {
    messaging_product: 'whatsapp' as const,
    to: recipientPhone,
    type: 'image' as const,
    image: imagePayload,
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
 * Legacy validator for image nodes
 * @deprecated Use imageNodeExecutor.validate instead
 */
export function validateImageNode(node: FlowNode, edges: FlowEdge[]): string[] {
  if (!imageNodeExecutor.validate) return []
  const result = imageNodeExecutor.validate(node as FlowNode & { data: ImageNodeData }, edges)
  return result.errors || []
}
