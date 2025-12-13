/**
 * Video Node Executor
 * 
 * Envia um vídeo ao usuário.
 * Suporta substituição de variáveis na caption e URL.
 */

import type { FlowNode, FlowEdge } from '@/types'
import type { NodeExecutor, ExecutionContext, NodeExecutionResult, WhatsAppMessagePayload, ValidationResult } from './base'
import { processText } from '../variables'

// Video node data type
export interface VideoNodeData {
  mediaId?: string
  mediaUrl?: string
  caption?: string
}

export const videoNodeExecutor: NodeExecutor<VideoNodeData> = {
  type: 'video',
  
  async execute(
    context: ExecutionContext,
    node: FlowNode & { data: VideoNodeData }
  ): Promise<NodeExecutionResult> {
    const { variables, contactPhone, edges } = context
    const data = node.data
    
    if (!data.mediaId && !data.mediaUrl) {
      return {
        success: false,
        error: 'Nó de vídeo precisa ter mediaId ou mediaUrl configurado'
      }
    }
    
    // Substituir variáveis na URL e caption
    const processedUrl = data.mediaUrl 
      ? processText(data.mediaUrl, variables, { contactPhone })
      : undefined
    
    const processedCaption = data.caption 
      ? processText(data.caption, variables, { contactPhone })
      : undefined
    
    // Construir payload WhatsApp
    const payload: WhatsAppMessagePayload = {
      type: 'video',
      payload: data.mediaId 
        ? { id: data.mediaId, caption: processedCaption }
        : { link: processedUrl!, caption: processedCaption }
    }
    
    // Buscar próximo nó
    const outgoingEdge = edges.find(e => e.source === node.id)
    
    return {
      success: true,
      messages: [payload],
      nextNodeId: outgoingEdge?.target,
    }
  },
  
  validate(node: FlowNode & { data: VideoNodeData }, edges: FlowEdge[]): ValidationResult {
    const errors: string[] = []
    const data = node.data
    
    // Verificar se tem mídia
    if (!data.mediaId && !data.mediaUrl) {
      errors.push('Nó de vídeo precisa ter um ID de mídia ou URL configurado')
    }
    
    // Verificar tamanho da caption (WhatsApp permite até 1024 caracteres)
    if (data.caption && data.caption.length > 1024) {
      errors.push('Caption do vídeo excede o limite de 1024 caracteres')
    }
    
    // Verificar se tem saída
    const hasOutput = edges.some(e => e.source === node.id)
    if (!hasOutput) {
      errors.push('Nó de vídeo precisa estar conectado a outro nó')
    }
    
    return { valid: errors.length === 0, errors }
  }
}

// Legacy exports for backwards compatibility
export function handleVideoNode(
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
  
  return videoNodeExecutor.execute(context, node as FlowNode & { data: VideoNodeData })
}

export function validateVideoNode(node: FlowNode, edges: FlowEdge[]): string[] {
  const result = videoNodeExecutor.validate!(node as FlowNode & { data: VideoNodeData }, edges)
  return result.errors || []
}
