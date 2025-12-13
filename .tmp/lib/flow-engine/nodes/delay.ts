/**
 * Delay Node Handler
 * 
 * Aguarda um tempo antes de continuar o fluxo.
 * Usa QStash para agendamento de continuação.
 */

import type { FlowNode, FlowEdge } from '@/types'

export interface DelayNodeData {
  delaySeconds: number
  label?: string
}

export interface DelayNodeResult {
  success: boolean
  nextNodeId?: string
  delaySeconds?: number
  shouldSchedule?: boolean
  error?: string
}

/**
 * Executa o nó de delay
 * 
 * Este nó não envia mensagem, apenas sinaliza para o executor
 * que deve agendar a continuação do fluxo após o delay.
 * 
 * @param node - Nó de delay
 * @param edges - Edges do fluxo
 * @returns Resultado com informações de agendamento
 */
export function handleDelayNode(
  node: FlowNode,
  edges: FlowEdge[]
): DelayNodeResult {
  const data = node.data as DelayNodeData
  
  // Validar delay
  const delaySeconds = data.delaySeconds || 5
  
  if (delaySeconds < 1) {
    return {
      success: false,
      error: 'Tempo de espera deve ser pelo menos 1 segundo'
    }
  }
  
  if (delaySeconds > 86400) {
    return {
      success: false,
      error: 'Tempo de espera máximo é 24 horas (86400 segundos)'
    }
  }
  
  // Buscar próximo nó
  const outgoingEdge = edges.find(e => e.source === node.id)
  
  if (!outgoingEdge) {
    return {
      success: false,
      error: 'Nó de delay precisa estar conectado a outro nó'
    }
  }
  
  return {
    success: true,
    nextNodeId: outgoingEdge.target,
    delaySeconds,
    shouldSchedule: true,
  }
}

/**
 * Valida se o nó de delay está configurado corretamente
 */
export function validateDelayNode(node: FlowNode, edges: FlowEdge[]): string[] {
  const errors: string[] = []
  const data = node.data as DelayNodeData
  
  // Verificar delay
  if (!data.delaySeconds || data.delaySeconds < 1) {
    errors.push('Nó de delay precisa ter um tempo de espera de pelo menos 1 segundo')
  }
  
  if (data.delaySeconds && data.delaySeconds > 86400) {
    errors.push('Tempo de espera máximo é 24 horas')
  }
  
  // Verificar se tem saída
  const hasOutput = edges.some(e => e.source === node.id)
  if (!hasOutput) {
    errors.push('Nó de delay precisa estar conectado a outro nó')
  }
  
  return errors
}
