/**
 * Jump Node Executor (V3)
 * 
 * Permite saltar para qualquer nó específico no fluxo.
 * Útil para criar loops controlados ou voltar a um ponto anterior.
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

export interface JumpNodeData {
  /** ID do nó de destino do salto */
  targetNodeId: string
  /** Label opcional para identificação */
  label?: string
  /** Condição opcional para o salto (variável que deve ser true) */
  conditionVariable?: string
}

// =============================================================================
// EXECUTOR
// =============================================================================

export const jumpNodeExecutor: NodeExecutor<JumpNodeData> = {
  type: 'jump',
  
  async execute(
    context: ExecutionContext,
    node: FlowNode & { data: JumpNodeData }
  ): Promise<NodeExecutionResult> {
    const data = node.data
    
    if (!data.targetNodeId) {
      return {
        success: false,
        error: 'Nó de salto não tem destino configurado',
      }
    }
    
    // Verificar se o nó de destino existe no flow
    const targetNode = context.nodes.find(n => n.id === data.targetNodeId)
    if (!targetNode) {
      return {
        success: false,
        error: `Nó de destino "${data.targetNodeId}" não encontrado no fluxo`,
      }
    }
    
    // Verificar condição se configurada
    if (data.conditionVariable) {
      const conditionValue = context.variables[data.conditionVariable]
      const shouldJump = conditionValue === 'true' || conditionValue === '1' || conditionValue === 'yes'
      
      if (!shouldJump) {
        // Condição não satisfeita, não pular (continuar fluxo normal)
        const outgoingEdge = context.edges.find(
          e => e.source === node.id && e.sourceHandle === 'fallback'
        ) || context.edges.find(
          e => e.source === node.id
        )
        
        return {
          success: true,
          nextNodeId: outgoingEdge?.target,
          output: {
            jumped: false,
            reason: `Condição ${data.conditionVariable} não satisfeita`,
          },
        }
      }
    }
    
    console.log(`🔀 [V3] Jump para nó: ${data.targetNodeId}`)
    
    return {
      success: true,
      nextNodeId: data.targetNodeId,
      output: {
        jumped: true,
        targetNodeId: data.targetNodeId,
      },
    }
  },
  
  validate(node: FlowNode & { data: JumpNodeData }, edges: FlowEdge[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const data = node.data
    
    if (!data.targetNodeId?.trim()) {
      errors.push('Nó de salto precisa ter um nó de destino')
    }
    
    // Não é necessário ter edges de saída pois o salto é o destino
    // Mas podemos ter um edge de fallback para quando a condição não é satisfeita
    
    if (data.conditionVariable) {
      const hasFallback = edges.some(
        e => e.source === node.id && (e.sourceHandle === 'fallback' || !e.sourceHandle)
      )
      if (!hasFallback) {
        warnings.push('Nó de salto com condição deveria ter uma saída fallback')
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  },
}

// =============================================================================
// LEGACY HANDLER (for backward compatibility)
// =============================================================================

export interface JumpNodeResult {
  jumped: boolean
  targetNodeId?: string
  reason?: string
}

export function handleJumpNode(
  node: FlowNode & { data: JumpNodeData },
  nodes: FlowNode[],
  variables: Record<string, string>
): JumpNodeResult {
  const data = node.data
  
  if (!data.targetNodeId) {
    return { jumped: false, reason: 'No target node configured' }
  }
  
  const targetExists = nodes.some(n => n.id === data.targetNodeId)
  if (!targetExists) {
    return { jumped: false, reason: `Target node ${data.targetNodeId} not found` }
  }
  
  if (data.conditionVariable) {
    const conditionValue = variables[data.conditionVariable]
    const shouldJump = conditionValue === 'true' || conditionValue === '1' || conditionValue === 'yes'
    
    if (!shouldJump) {
      return { 
        jumped: false, 
        reason: `Condition ${data.conditionVariable} not satisfied` 
      }
    }
  }
  
  return {
    jumped: true,
    targetNodeId: data.targetNodeId,
  }
}
