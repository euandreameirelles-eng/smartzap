/**
 * Flow Validator
 * 
 * Valida a estrutura e configuração de um fluxo antes da execução
 */

import type { Flow, FlowNode, FlowEdge } from '@/types'

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  nodeId?: string
  message: string
  type: 'error'
}

export interface ValidationWarning {
  nodeId?: string
  message: string
  type: 'warning'
}

/**
 * Valida um fluxo completo
 */
export function validateFlow(flow: Flow): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  
  const nodes = flow.nodes || []
  const edges = flow.edges || []
  
  // 1. Verificar se tem nó de início
  const startNodes = nodes.filter(n => n.type === 'start')
  if (startNodes.length === 0) {
    errors.push({
      message: 'Fluxo precisa ter um nó de início',
      type: 'error'
    })
  } else if (startNodes.length > 1) {
    errors.push({
      message: 'Fluxo pode ter apenas um nó de início',
      type: 'error'
    })
  }
  
  // 2. Verificar se tem nó de fim
  const endNodes = nodes.filter(n => n.type === 'end')
  if (endNodes.length === 0) {
    warnings.push({
      message: 'Fluxo não tem nó de fim - conversas podem ficar pendentes',
      type: 'warning'
    })
  }
  
  // 3. Verificar nós órfãos (sem conexão de entrada, exceto start)
  for (const node of nodes) {
    if (node.type === 'start') continue
    
    const hasIncoming = edges.some(e => e.target === node.id)
    if (!hasIncoming) {
      warnings.push({
        nodeId: node.id,
        message: `Nó "${node.data?.label || node.id}" não está conectado a nenhum outro nó`,
        type: 'warning'
      })
    }
  }
  
  // 4. Verificar se start tem saída
  for (const startNode of startNodes) {
    const hasOutgoing = edges.some(e => e.source === startNode.id)
    if (!hasOutgoing) {
      errors.push({
        nodeId: startNode.id,
        message: 'Nó de início precisa estar conectado a outro nó',
        type: 'error'
      })
    }
  }
  
  // 5. Verificar loops infinitos
  const loopErrors = detectInfiniteLoops(nodes, edges)
  errors.push(...loopErrors)
  
  // 6. Validar cada nó individualmente
  for (const node of nodes) {
    const nodeErrors = validateNode(node, edges)
    errors.push(...nodeErrors.map(e => ({ ...e, nodeId: node.id })))
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Detecta loops infinitos no fluxo
 */
function detectInfiniteLoops(nodes: FlowNode[], edges: FlowEdge[]): ValidationError[] {
  const errors: ValidationError[] = []
  
  // Construir grafo de adjacência
  const graph = new Map<string, string[]>()
  for (const node of nodes) {
    graph.set(node.id, [])
  }
  for (const edge of edges) {
    const targets = graph.get(edge.source) || []
    targets.push(edge.target)
    graph.set(edge.source, targets)
  }
  
  // DFS para detectar ciclos
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  
  function hasCycle(nodeId: string, path: string[]): boolean {
    if (recursionStack.has(nodeId)) {
      // Encontrou um ciclo
      const cycleStart = path.indexOf(nodeId)
      const cycle = [...path.slice(cycleStart), nodeId]
      
      // Verificar se o ciclo tem um nó que espera input (menu, input)
      // Se não tiver, é loop infinito
      const hasBreakPoint = cycle.some(id => {
        const node = nodes.find(n => n.id === id)
        return node?.type === 'menu' || node?.type === 'input' || node?.type === 'delay'
      })
      
      if (!hasBreakPoint) {
        errors.push({
          message: `Loop infinito detectado: ${cycle.map(id => {
            const node = nodes.find(n => n.id === id)
            return node?.data?.label || id
          }).join(' → ')}`,
          type: 'error'
        })
      }
      
      return true
    }
    
    if (visited.has(nodeId)) {
      return false
    }
    
    visited.add(nodeId)
    recursionStack.add(nodeId)
    
    const neighbors = graph.get(nodeId) || []
    for (const neighbor of neighbors) {
      hasCycle(neighbor, [...path, nodeId])
    }
    
    recursionStack.delete(nodeId)
    return false
  }
  
  // Começar DFS de cada nó de início
  const startNodes = nodes.filter(n => n.type === 'start')
  for (const startNode of startNodes) {
    hasCycle(startNode.id, [])
  }
  
  return errors
}

/**
 * Valida um nó específico
 */
function validateNode(node: FlowNode, edges: FlowEdge[]): Omit<ValidationError, 'nodeId'>[] {
  const errors: Omit<ValidationError, 'nodeId'>[] = []
  
  switch (node.type) {
    case 'message': {
      const data = node.data as { text?: string }
      if (!data.text || data.text.trim() === '') {
        errors.push({
          message: 'Nó de mensagem precisa ter um texto',
          type: 'error'
        })
      }
      if (data.text && data.text.length > 4096) {
        errors.push({
          message: 'Texto excede limite de 4096 caracteres',
          type: 'error'
        })
      }
      break
    }
    
    case 'menu': {
      const data = node.data as { text?: string; options?: Array<{ id: string; label: string }> }
      if (!data.text) {
        errors.push({
          message: 'Nó de menu precisa ter um texto',
          type: 'error'
        })
      }
      if (!data.options || data.options.length === 0) {
        errors.push({
          message: 'Nó de menu precisa ter opções',
          type: 'error'
        })
      }
      if (data.options && data.options.length > 10) {
        errors.push({
          message: 'Menu pode ter no máximo 10 opções',
          type: 'error'
        })
      }
      // Verificar se cada opção tem saída
      if (data.options) {
        for (const opt of data.options) {
          const hasEdge = edges.some(e => 
            e.source === node.id && 
            (e.sourceHandle === opt.id)
          )
          if (!hasEdge) {
            errors.push({
              message: `Opção "${opt.label}" não tem conexão de saída`,
              type: 'error'
            })
          }
        }
      }
      break
    }
    
    case 'input': {
      const data = node.data as { prompt?: string; variableName?: string }
      if (!data.prompt) {
        errors.push({
          message: 'Nó de input precisa ter uma pergunta',
          type: 'error'
        })
      }
      if (!data.variableName) {
        errors.push({
          message: 'Nó de input precisa definir nome da variável',
          type: 'error'
        })
      }
      break
    }
    
    case 'condition': {
      const data = node.data as { conditions?: Array<{ id: string }> }
      if (!data.conditions || data.conditions.length === 0) {
        errors.push({
          message: 'Nó de condição precisa ter condições definidas',
          type: 'error'
        })
      }
      // Verificar se tem edge para else
      const hasElse = edges.some(e => 
        e.source === node.id && e.sourceHandle === 'else'
      )
      if (!hasElse) {
        errors.push({
          message: 'Nó de condição precisa ter caminho "senão"',
          type: 'error'
        })
      }
      break
    }
  }
  
  return errors
}

/**
 * Verifica se um fluxo pode ser publicado
 */
export function canPublish(flow: Flow): { canPublish: boolean; reason?: string } {
  const validation = validateFlow(flow)
  
  if (!validation.valid) {
    return {
      canPublish: false,
      reason: validation.errors[0]?.message || 'Fluxo contém erros'
    }
  }
  
  return { canPublish: true }
}
