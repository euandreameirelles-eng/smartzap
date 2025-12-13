/**
 * Condition Node Handler
 * 
 * Avalia condições baseadas em variáveis e redireciona o fluxo.
 * Suporta operadores: equals, not_equals, contains, not_contains, greater, less, exists, not_exists
 */

import type { FlowNode, FlowEdge, ConditionNodeData, ConditionOperator } from '@/types'

export interface ConditionNodeResult {
  success: boolean
  nextNodeId?: string
  conditionResult?: boolean
  error?: string
}

/**
 * Avaliadores de condição por operador
 */
const evaluators: Record<ConditionOperator, (variableValue: string | undefined, compareValue: string | undefined) => boolean> = {
  equals: (variableValue, compareValue) => {
    if (variableValue === undefined || compareValue === undefined) return false
    return variableValue.toLowerCase() === compareValue.toLowerCase()
  },

  not_equals: (variableValue, compareValue) => {
    if (variableValue === undefined) return compareValue !== undefined
    if (compareValue === undefined) return true
    return variableValue.toLowerCase() !== compareValue.toLowerCase()
  },

  contains: (variableValue, compareValue) => {
    if (variableValue === undefined || compareValue === undefined) return false
    return variableValue.toLowerCase().includes(compareValue.toLowerCase())
  },

  not_contains: (variableValue, compareValue) => {
    if (variableValue === undefined) return true
    if (compareValue === undefined) return true
    return !variableValue.toLowerCase().includes(compareValue.toLowerCase())
  },

  greater: (variableValue, compareValue) => {
    if (variableValue === undefined || compareValue === undefined) return false
    const numVar = parseFloat(variableValue)
    const numCompare = parseFloat(compareValue)
    if (isNaN(numVar) || isNaN(numCompare)) return false
    return numVar > numCompare
  },

  less: (variableValue, compareValue) => {
    if (variableValue === undefined || compareValue === undefined) return false
    const numVar = parseFloat(variableValue)
    const numCompare = parseFloat(compareValue)
    if (isNaN(numVar) || isNaN(numCompare)) return false
    return numVar < numCompare
  },

  exists: (variableValue) => {
    return variableValue !== undefined && variableValue !== ''
  },

  not_exists: (variableValue) => {
    return variableValue === undefined || variableValue === ''
  },
}

/**
 * Avalia uma condição
 */
export function evaluateCondition(
  operator: ConditionOperator,
  variableValue: string | undefined,
  compareValue?: string
): boolean {
  const evaluator = evaluators[operator]
  if (!evaluator) {
    // Operador desconhecido - retornar false
    return false
  }
  return evaluator(variableValue, compareValue)
}

/**
 * Executa o nó de condição
 * 
 * @param node - Nó de condição
 * @param edges - Edges do fluxo
 * @param variables - Variáveis disponíveis para avaliação
 * @returns Resultado com o próximo nó baseado na condição
 */
export function handleConditionNode(
  node: FlowNode,
  edges: FlowEdge[],
  variables: Record<string, string>
): ConditionNodeResult {
  const data = node.data as ConditionNodeData
  
  if (!data.variable) {
    return {
      success: false,
      error: 'Nó de condição não tem variável configurada'
    }
  }
  
  if (!data.operator) {
    return {
      success: false,
      error: 'Nó de condição não tem operador configurado'
    }
  }
  
  // Buscar valor da variável
  const variableValue = variables[data.variable]
  
  // Avaliar condição
  const result = evaluateCondition(data.operator, variableValue, data.value)
  
  // Buscar edge correto baseado no resultado
  // Edges de condição devem ter data.condition = 'true' ou 'false'
  const matchingEdge = edges.find(e => {
    if (e.source !== node.id) return false
    
    // Se edge tem condition definida, usar ela
    if (e.data?.condition) {
      return e.data.condition === (result ? 'true' : 'false')
    }
    
    // Fallback: usar sourceHandle
    if (e.sourceHandle) {
      return e.sourceHandle === (result ? 'true' : 'false')
    }
    
    return false
  })
  
  // Se não encontrou edge específico, tentar edge padrão (sem condition)
  const fallbackEdge = edges.find(e => 
    e.source === node.id && 
    !e.data?.condition && 
    !e.sourceHandle
  )
  
  const nextNodeId = matchingEdge?.target || fallbackEdge?.target
  
  return {
    success: true,
    conditionResult: result,
    nextNodeId,
  }
}

/**
 * Valida se o nó de condição está configurado corretamente
 */
export function validateConditionNode(node: FlowNode, edges: FlowEdge[]): string[] {
  const errors: string[] = []
  const data = node.data as ConditionNodeData
  
  // Verificar se tem variável
  if (!data.variable || data.variable.trim() === '') {
    errors.push('Nó de condição precisa ter uma variável configurada')
  }
  
  // Verificar se tem operador
  if (!data.operator) {
    errors.push('Nó de condição precisa ter um operador configurado')
  }
  
  // Operadores que requerem valor de comparação
  const requiresValue: ConditionOperator[] = ['equals', 'not_equals', 'contains', 'not_contains', 'greater', 'less']
  if (data.operator && requiresValue.includes(data.operator) && !data.value) {
    errors.push(`Operador "${data.operator}" requer um valor de comparação`)
  }
  
  // Verificar se tem saídas para true e false
  const outgoingEdges = edges.filter(e => e.source === node.id)
  
  if (outgoingEdges.length === 0) {
    errors.push('Nó de condição precisa ter pelo menos uma saída')
  }
  
  const hasTrueEdge = outgoingEdges.some(e => 
    e.data?.condition === 'true' || e.sourceHandle === 'true'
  )
  const hasFalseEdge = outgoingEdges.some(e => 
    e.data?.condition === 'false' || e.sourceHandle === 'false'
  )
  
  if (outgoingEdges.length > 0 && !hasTrueEdge && !hasFalseEdge) {
    // Tem edges mas sem condition - warning, não erro
  } else if (hasTrueEdge && !hasFalseEdge) {
    // Apenas caminho true - pode ser intencional
  } else if (!hasTrueEdge && hasFalseEdge) {
    // Apenas caminho false - pode ser intencional
  }
  
  return errors
}

/**
 * Retorna descrição legível da condição
 */
export function describeCondition(data: ConditionNodeData): string {
  const operatorLabels: Record<ConditionOperator, string> = {
    equals: 'é igual a',
    not_equals: 'é diferente de',
    contains: 'contém',
    not_contains: 'não contém',
    greater: 'é maior que',
    less: 'é menor que',
    exists: 'existe',
    not_exists: 'não existe',
  }
  
  const operatorLabel = operatorLabels[data.operator] || data.operator
  
  if (data.operator === 'exists' || data.operator === 'not_exists') {
    return `{{${data.variable}}} ${operatorLabel}`
  }
  
  return `{{${data.variable}}} ${operatorLabel} "${data.value || ''}"`
}
