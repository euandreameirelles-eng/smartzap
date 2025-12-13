/**
 * Start Node Executor (V3)
 * 
 * Ponto de entrada do fluxo. Não executa ação, apenas define o trigger.
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

export interface StartNodeData {
  label?: string
  trigger?: {
    type: 'any_message' | 'keyword' | 'starts_with' | 'contains' | 'regex'
    keywords?: string[]
    pattern?: string
    caseSensitive?: boolean
  }
}

// =============================================================================
// EXECUTOR
// =============================================================================

export const startNodeExecutor: NodeExecutor<StartNodeData> = {
  type: 'start',
  
  async execute(
    context: ExecutionContext,
    node: FlowNode & { data: StartNodeData }
  ): Promise<NodeExecutionResult> {
    // Start não executa nada, apenas passa para o próximo nó
    const outgoingEdge = findOutgoingEdge(context.edges, node.id)
    
    return {
      success: true,
      nextNodeId: outgoingEdge?.target,
    }
  },
  
  validate(node: FlowNode & { data: StartNodeData }, edges: FlowEdge[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    
    // Deve ter pelo menos uma saída
    const hasOutput = edges.some(e => e.source === node.id)
    if (!hasOutput) {
      errors.push('Nó de início precisa estar conectado a outro nó')
    }
    
    // Não deve ter entradas
    const hasInput = edges.some(e => e.target === node.id)
    if (hasInput) {
      warnings.push('Nó de início não deve ter conexões de entrada')
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  },
}
