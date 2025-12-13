/**
 * Document Node Executor
 * 
 * Envia um documento ao usuário.
 * Suporta substituição de variáveis na caption, URL e filename.
 */

import type { FlowNode, FlowEdge } from '@/types'
import type { NodeExecutor, ExecutionContext, NodeExecutionResult, WhatsAppMessagePayload, ValidationResult } from './base'
import { processText } from '../variables'

// Document node data type
export interface DocumentNodeData {
  mediaId?: string
  mediaUrl?: string
  filename: string
  caption?: string
}

export const documentNodeExecutor: NodeExecutor<DocumentNodeData> = {
  type: 'document',
  
  async execute(
    context: ExecutionContext,
    node: FlowNode & { data: DocumentNodeData }
  ): Promise<NodeExecutionResult> {
    const { variables, contactPhone, edges } = context
    const data = node.data
    
    if (!data.mediaId && !data.mediaUrl) {
      return {
        success: false,
        error: 'Nó de documento precisa ter mediaId ou mediaUrl configurado'
      }
    }
    
    if (!data.filename) {
      return {
        success: false,
        error: 'Nó de documento precisa ter filename configurado'
      }
    }
    
    // Substituir variáveis
    const processedUrl = data.mediaUrl 
      ? processText(data.mediaUrl, variables, { contactPhone })
      : undefined
    
    const processedFilename = processText(data.filename, variables, { contactPhone })
    
    const processedCaption = data.caption 
      ? processText(data.caption, variables, { contactPhone })
      : undefined
    
    // Construir payload WhatsApp
    const payload: WhatsAppMessagePayload = {
      type: 'document',
      payload: data.mediaId 
        ? { id: data.mediaId, filename: processedFilename, caption: processedCaption }
        : { link: processedUrl!, filename: processedFilename, caption: processedCaption }
    }
    
    // Buscar próximo nó
    const outgoingEdge = edges.find(e => e.source === node.id)
    
    return {
      success: true,
      messages: [payload],
      nextNodeId: outgoingEdge?.target,
    }
  },
  
  validate(node: FlowNode & { data: DocumentNodeData }, edges: FlowEdge[]): ValidationResult {
    const errors: string[] = []
    const data = node.data
    
    // Verificar se tem mídia
    if (!data.mediaId && !data.mediaUrl) {
      errors.push('Nó de documento precisa ter um ID de mídia ou URL configurado')
    }
    
    // Verificar se tem filename
    if (!data.filename || data.filename.trim() === '') {
      errors.push('Nó de documento precisa ter um nome de arquivo configurado')
    }
    
    // Verificar tamanho da caption (WhatsApp permite até 1024 caracteres)
    if (data.caption && data.caption.length > 1024) {
      errors.push('Caption do documento excede o limite de 1024 caracteres')
    }
    
    // Verificar se tem saída
    const hasOutput = edges.some(e => e.source === node.id)
    if (!hasOutput) {
      errors.push('Nó de documento precisa estar conectado a outro nó')
    }
    
    return { valid: errors.length === 0, errors }
  }
}

// Legacy exports for backwards compatibility
export function handleDocumentNode(
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
  
  return documentNodeExecutor.execute(context, node as FlowNode & { data: DocumentNodeData })
}

export function validateDocumentNode(node: FlowNode, edges: FlowEdge[]): string[] {
  const result = documentNodeExecutor.validate!(node as FlowNode & { data: DocumentNodeData }, edges)
  return result.errors || []
}
