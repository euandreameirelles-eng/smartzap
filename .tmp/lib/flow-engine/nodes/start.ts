/**
 * Start Node Handler
 * 
 * Ponto de entrada do fluxo. Não produz mensagens,
 * apenas transiciona para o próximo nó.
 */

import type { FlowNode, FlowEdge } from '@/types'

export interface StartNodeResult {
  success: boolean
  nextNodeId?: string
  error?: string
}

/**
 * Executa o nó de início
 * 
 * @param node - Nó de início
 * @param edges - Edges do fluxo
 * @returns Resultado com próximo nó
 */
export function handleStartNode(node: FlowNode, edges: FlowEdge[]): StartNodeResult {
  // Start node apenas busca a saída e segue para o próximo nó
  const outgoingEdge = edges.find(e => e.source === node.id)
  
  if (!outgoingEdge) {
    return {
      success: false,
      error: 'Start node has no outgoing connection'
    }
  }
  
  return {
    success: true,
    nextNodeId: outgoingEdge.target
  }
}

/**
 * Valida se o nó de início está configurado corretamente
 */
export function validateStartNode(node: FlowNode, edges: FlowEdge[]): string[] {
  const errors: string[] = []
  
  // Verificar se tem saída
  const hasOutput = edges.some(e => e.source === node.id)
  if (!hasOutput) {
    errors.push('Nó de início precisa estar conectado a outro nó')
  }
  
  // Verificar se não tem entradas (start não pode ter entradas)
  const hasInput = edges.some(e => e.target === node.id)
  if (hasInput) {
    errors.push('Nó de início não pode ter conexões de entrada')
  }
  
  return errors
}
