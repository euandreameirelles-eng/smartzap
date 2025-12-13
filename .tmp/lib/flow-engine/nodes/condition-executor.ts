/**
 * Condition Node Executor (V3)
 * 
 * Avalia condições baseadas em variáveis e redireciona o fluxo.
 */

import type { FlowNode, FlowEdge, ConditionNodeData, ConditionOperator } from '@/types'
import type { 
  NodeExecutor, 
  ExecutionContext, 
  NodeExecutionResult,
  ValidationResult 
} from './base'
import { findEdgeByHandle } from './base'

// =============================================================================
// EVALUATORS
// =============================================================================

const evaluators: Record<ConditionOperator, (varValue: string | undefined, compareValue: string | undefined) => boolean> = {
  equals: (varValue, compareValue) => {
    if (varValue === undefined || compareValue === undefined) return false
    return varValue.toLowerCase() === compareValue.toLowerCase()
  },

  not_equals: (varValue, compareValue) => {
    if (varValue === undefined) return compareValue !== undefined
    if (compareValue === undefined) return true
    return varValue.toLowerCase() !== compareValue.toLowerCase()
  },

  contains: (varValue, compareValue) => {
    if (varValue === undefined || compareValue === undefined) return false
    return varValue.toLowerCase().includes(compareValue.toLowerCase())
  },

  not_contains: (varValue, compareValue) => {
    if (varValue === undefined) return true
    if (compareValue === undefined) return true
    return !varValue.toLowerCase().includes(compareValue.toLowerCase())
  },

  greater: (varValue, compareValue) => {
    if (varValue === undefined || compareValue === undefined) return false
    const numVar = parseFloat(varValue)
    const numCompare = parseFloat(compareValue)
    if (isNaN(numVar) || isNaN(numCompare)) return false
    return numVar > numCompare
  },

  less: (varValue, compareValue) => {
    if (varValue === undefined || compareValue === undefined) return false
    const numVar = parseFloat(varValue)
    const numCompare = parseFloat(compareValue)
    if (isNaN(numVar) || isNaN(numCompare)) return false
    return numVar < numCompare
  },

  exists: (varValue) => {
    return varValue !== undefined && varValue !== ''
  },

  not_exists: (varValue) => {
    return varValue === undefined || varValue === ''
  },
}

function evaluateCondition(
  operator: ConditionOperator,
  varValue: string | undefined,
  compareValue?: string
): boolean {
  const evaluator = evaluators[operator]
  return evaluator ? evaluator(varValue, compareValue) : false
}

// =============================================================================
// EXECUTOR
// =============================================================================

export const conditionNodeExecutor: NodeExecutor<ConditionNodeData> = {
  type: 'condition',
  
  async execute(
    context: ExecutionContext,
    node: FlowNode & { data: ConditionNodeData }
  ): Promise<NodeExecutionResult> {
    const data = node.data
    
    if (!data.variable) {
      return {
        success: false,
        error: 'Nó de condição não tem variável configurada',
      }
    }
    
    if (!data.operator) {
      return {
        success: false,
        error: 'Nó de condição não tem operador configurado',
      }
    }
    
    // Avaliar condição
    const varValue = context.variables[data.variable]
    const result = evaluateCondition(data.operator, varValue, data.value)
    
    // Buscar edge baseado no resultado
    // Tenta sourceHandle 'true'/'false' primeiro
    let nextEdge = findEdgeByHandle(context.edges, node.id, result ? 'true' : 'false')
    
    // Fallback: tenta 'yes'/'no'
    if (!nextEdge) {
      nextEdge = findEdgeByHandle(context.edges, node.id, result ? 'yes' : 'no')
    }
    
    // Fallback: tenta 'sim'/'nao'
    if (!nextEdge) {
      nextEdge = findEdgeByHandle(context.edges, node.id, result ? 'sim' : 'nao')
    }
    
    // Último fallback: edge sem handle específico
    if (!nextEdge) {
      nextEdge = context.edges.find(e => e.source === node.id && !e.sourceHandle)
    }
    
    return {
      success: true,
      nextNodeId: nextEdge?.target,
      output: {
        conditionResult: result,
        evaluatedVariable: data.variable,
        evaluatedValue: varValue,
      },
    }
  },
  
  validate(node: FlowNode & { data: ConditionNodeData }, edges: FlowEdge[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const data = node.data
    
    if (!data.variable?.trim()) {
      errors.push('Nó de condição precisa ter uma variável')
    }
    
    if (!data.operator) {
      errors.push('Nó de condição precisa ter um operador')
    }
    
    const requiresValue: ConditionOperator[] = ['equals', 'not_equals', 'contains', 'not_contains', 'greater', 'less']
    if (data.operator && requiresValue.includes(data.operator) && !data.value) {
      errors.push(`Operador "${data.operator}" requer um valor de comparação`)
    }
    
    const outgoingEdges = edges.filter(e => e.source === node.id)
    if (outgoingEdges.length === 0) {
      errors.push('Nó de condição precisa ter pelo menos uma saída')
    }
    
    const hasTrueEdge = outgoingEdges.some(e => 
      e.sourceHandle === 'true' || e.sourceHandle === 'yes' || e.sourceHandle === 'sim'
    )
    const hasFalseEdge = outgoingEdges.some(e => 
      e.sourceHandle === 'false' || e.sourceHandle === 'no' || e.sourceHandle === 'nao'
    )
    
    if (!hasTrueEdge && !hasFalseEdge && outgoingEdges.length > 0) {
      warnings.push('Nó de condição sem saídas específicas para true/false')
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  },
}
