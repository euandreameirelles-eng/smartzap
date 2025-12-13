/**
 * Delay Node Executor (V3)
 * 
 * Aguarda um tempo antes de continuar o fluxo.
 */

import type { FlowNode, FlowEdge } from '@/types'
import type { 
  NodeExecutor, 
  ExecutionContext, 
  NodeExecutionResult,
  ValidationResult 
} from './base'
import { findOutgoingEdge } from './base'

// =============================================================================
// TYPES
// =============================================================================

export interface DelayNodeData {
  delaySeconds: number
  label?: string
}

// =============================================================================
// EXECUTOR
// =============================================================================

export const delayNodeExecutor: NodeExecutor<DelayNodeData> = {
  type: 'delay',
  
  async execute(
    context: ExecutionContext,
    node: FlowNode & { data: DelayNodeData }
  ): Promise<NodeExecutionResult> {
    const data = node.data
    const delaySeconds = data.delaySeconds || 5
    
    if (delaySeconds < 1) {
      return {
        success: false,
        error: 'Tempo de espera deve ser pelo menos 1 segundo',
      }
    }
    
    if (delaySeconds > 86400) {
      return {
        success: false,
        error: 'Tempo de espera máximo é 24 horas',
      }
    }
    
    const outgoingEdge = findOutgoingEdge(context.edges, node.id)
    
    if (!outgoingEdge) {
      return {
        success: false,
        error: 'Nó de delay precisa estar conectado a outro nó',
      }
    }
    
    // Retornar delay em ms para o executor principal tratar
    return {
      success: true,
      nextNodeId: outgoingEdge.target,
      delayMs: delaySeconds * 1000,
    }
  },
  
  validate(node: FlowNode & { data: DelayNodeData }, edges: FlowEdge[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const data = node.data
    
    if (!data.delaySeconds || data.delaySeconds < 1) {
      errors.push('Tempo de espera deve ser pelo menos 1 segundo')
    }
    
    if (data.delaySeconds && data.delaySeconds > 86400) {
      errors.push('Tempo de espera máximo é 24 horas')
    }
    
    const hasOutput = edges.some(e => e.source === node.id)
    if (!hasOutput) {
      errors.push('Nó de delay precisa estar conectado a outro nó')
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  },
}
