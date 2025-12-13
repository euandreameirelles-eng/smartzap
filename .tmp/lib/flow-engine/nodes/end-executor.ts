/**
 * End Node Executor (V3)
 * 
 * Finaliza o fluxo da conversa.
 */

import type { FlowNode, FlowEdge } from '@/types'
import type { 
  NodeExecutor, 
  ExecutionContext, 
  NodeExecutionResult,
  ValidationResult 
} from './base'

// =============================================================================
// TYPES
// =============================================================================

export interface EndNodeData {
  label?: string
}

// =============================================================================
// EXECUTOR
// =============================================================================

export const endNodeExecutor: NodeExecutor<EndNodeData> = {
  type: 'end',
  
  async execute(
    context: ExecutionContext,
    node: FlowNode & { data: EndNodeData }
  ): Promise<NodeExecutionResult> {
    // Nó de fim apenas sinaliza para encerrar
    return {
      success: true,
      endConversation: true,
    }
  },
  
  validate(node: FlowNode & { data: EndNodeData }, edges: FlowEdge[]): ValidationResult {
    const warnings: string[] = []
    
    // End não deve ter saída
    const hasOutput = edges.some(e => e.source === node.id)
    if (hasOutput) {
      warnings.push('Nó de fim não deve ter conexões de saída')
    }
    
    return {
      valid: true,
      errors: [],
      warnings,
    }
  },
}
