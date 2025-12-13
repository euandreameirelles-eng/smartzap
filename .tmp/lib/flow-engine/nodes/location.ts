/**
 * Location Node Executor
 * 
 * Envia uma localização ao usuário.
 * Suporta substituição de variáveis no nome e endereço.
 */

import type { FlowNode, FlowEdge } from '@/types'
import type { NodeExecutor, ExecutionContext, NodeExecutionResult, WhatsAppMessagePayload, ValidationResult } from './base'
import { processText } from '../variables'

// Location node data type
export interface LocationNodeData {
  latitude: number | string
  longitude: number | string
  name?: string
  address?: string
}

export const locationNodeExecutor: NodeExecutor<LocationNodeData> = {
  type: 'location',
  
  async execute(
    context: ExecutionContext,
    node: FlowNode & { data: LocationNodeData }
  ): Promise<NodeExecutionResult> {
    const { variables, contactPhone, edges } = context
    const data = node.data
    
    // Validar latitude e longitude
    const latitude = typeof data.latitude === 'string' ? parseFloat(data.latitude) : data.latitude
    const longitude = typeof data.longitude === 'string' ? parseFloat(data.longitude) : data.longitude
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return {
        success: false,
        error: 'Nó de localização precisa ter latitude e longitude válidas'
      }
    }
    
    if (latitude < -90 || latitude > 90) {
      return {
        success: false,
        error: 'Latitude deve estar entre -90 e 90'
      }
    }
    
    if (longitude < -180 || longitude > 180) {
      return {
        success: false,
        error: 'Longitude deve estar entre -180 e 180'
      }
    }
    
    // Substituir variáveis
    const processedName = data.name 
      ? processText(data.name, variables, { contactPhone })
      : undefined
    
    const processedAddress = data.address 
      ? processText(data.address, variables, { contactPhone })
      : undefined
    
    // Construir payload WhatsApp
    const payload: WhatsAppMessagePayload = {
      type: 'location',
      payload: {
        latitude,
        longitude,
        name: processedName,
        address: processedAddress,
      }
    }
    
    // Buscar próximo nó
    const outgoingEdge = edges.find(e => e.source === node.id)
    
    return {
      success: true,
      messages: [payload],
      nextNodeId: outgoingEdge?.target,
    }
  },
  
  validate(node: FlowNode & { data: LocationNodeData }, edges: FlowEdge[]): ValidationResult {
    const errors: string[] = []
    const data = node.data
    
    // Validar latitude
    const latitude = typeof data.latitude === 'string' ? parseFloat(data.latitude) : data.latitude
    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      errors.push('Latitude inválida (deve estar entre -90 e 90)')
    }
    
    // Validar longitude
    const longitude = typeof data.longitude === 'string' ? parseFloat(data.longitude) : data.longitude
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      errors.push('Longitude inválida (deve estar entre -180 e 180)')
    }
    
    // Verificar se tem saída
    const hasOutput = edges.some(e => e.source === node.id)
    if (!hasOutput) {
      errors.push('Nó de localização precisa estar conectado a outro nó')
    }
    
    return { valid: errors.length === 0, errors }
  }
}

// Legacy exports for backwards compatibility
export function handleLocationNode(
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
  
  return locationNodeExecutor.execute(context, node as FlowNode & { data: LocationNodeData })
}

export function validateLocationNode(node: FlowNode, edges: FlowEdge[]): string[] {
  const result = locationNodeExecutor.validate!(node as FlowNode & { data: LocationNodeData }, edges)
  return result.errors || []
}
