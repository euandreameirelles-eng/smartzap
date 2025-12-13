/**
 * Sticker Node Executor
 * 
 * Envia um sticker (figurinha) ao usuário.
 * Suporta stickers via mediaId ou URL.
 */

import type { FlowNode, FlowEdge } from '@/types'
import type { NodeExecutor, ExecutionContext, NodeExecutionResult, WhatsAppMessagePayload, ValidationResult } from './base'
import { processText } from '../variables'

// Sticker node data type
export interface StickerNodeData {
  mediaId?: string
  mediaUrl?: string
}

export const stickerNodeExecutor: NodeExecutor<StickerNodeData> = {
  type: 'sticker',
  
  async execute(
    context: ExecutionContext,
    node: FlowNode & { data: StickerNodeData }
  ): Promise<NodeExecutionResult> {
    const { variables, contactPhone, edges } = context
    const data = node.data
    
    if (!data.mediaId && !data.mediaUrl) {
      return {
        success: false,
        error: 'Nó de sticker precisa ter mediaId ou mediaUrl configurado'
      }
    }
    
    // Substituir variáveis na URL
    const processedUrl = data.mediaUrl 
      ? processText(data.mediaUrl, variables, { contactPhone })
      : undefined
    
    // Construir payload WhatsApp
    const payload: WhatsAppMessagePayload = {
      type: 'sticker',
      payload: data.mediaId 
        ? { id: data.mediaId }
        : { link: processedUrl! }
    }
    
    // Buscar próximo nó
    const outgoingEdge = edges.find(e => e.source === node.id)
    
    return {
      success: true,
      messages: [payload],
      nextNodeId: outgoingEdge?.target,
    }
  },
  
  validate(node: FlowNode & { data: StickerNodeData }, edges: FlowEdge[]): ValidationResult {
    const errors: string[] = []
    const data = node.data
    
    // Verificar se tem mídia
    if (!data.mediaId && !data.mediaUrl) {
      errors.push('Nó de sticker precisa ter um ID de mídia ou URL configurado')
    }
    
    // Verificar se tem saída
    const hasOutput = edges.some(e => e.source === node.id)
    if (!hasOutput) {
      errors.push('Nó de sticker precisa estar conectado a outro nó')
    }
    
    return { valid: errors.length === 0, errors }
  }
}

// Legacy exports for backwards compatibility
export function handleStickerNode(
  node: FlowNode,
  edges: FlowEdge[],
  variables: Record<string, string>,
  recipientPhone: string
) {
  // Build minimal context for legacy usage
  const context: ExecutionContext = {
    executionId: '',
    flowId: '',
    mode: 'campaign',
    contactPhone: recipientPhone,
    nodes: [],
    edges,
    currentNodeId: node.id,
    variables,
    phoneNumberId: '',
    accessToken: '',
    sendMessage: async () => ({ success: true }),
    setVariable: async () => {},
    log: () => {},
  }
  
  return stickerNodeExecutor.execute(context, node as FlowNode & { data: StickerNodeData })
}

export function validateStickerNode(node: FlowNode, edges: FlowEdge[]): string[] {
  const result = stickerNodeExecutor.validate!(node as FlowNode & { data: StickerNodeData }, edges)
  return result.errors || []
}
