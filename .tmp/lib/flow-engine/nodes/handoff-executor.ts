/**
 * Handoff Node Executor (V3)
 * 
 * Transfere a conversa para atendimento humano.
 * Pausa o bot e notifica a equipe.
 */

import type { FlowNode, FlowEdge, HandoffNodeData } from '@/types'
import type { 
  NodeExecutor, 
  ExecutionContext, 
  NodeExecutionResult,
  WhatsAppMessagePayload,
  ValidationResult 
} from './base'
import { processText } from '../variables'
import { findOutgoingEdge } from './base'

// =============================================================================
// EXECUTOR
// =============================================================================

export const handoffNodeExecutor: NodeExecutor<HandoffNodeData> = {
  type: 'handoff',
  
  async execute(
    context: ExecutionContext,
    node: FlowNode & { data: HandoffNodeData }
  ): Promise<NodeExecutionResult> {
    const data = node.data
    const messages: WhatsAppMessagePayload[] = []
    
    // Enviar mensagem de handoff se configurada
    if (data.message) {
      const processedMessage = processText(data.message, context.variables, {
        contactPhone: context.contactPhone,
      })
      
      messages.push({
        type: 'text',
        payload: {
          messaging_product: 'whatsapp',
          to: context.contactPhone,
          type: 'text',
          text: { body: processedMessage },
        },
      })
    }
    
    // Marcar para pausar a conversa
    // O executor principal vai atualizar o estado da conversa
    const outgoingEdge = findOutgoingEdge(context.edges, node.id)
    
    return {
      success: true,
      messages,
      pauseExecution: true,  // Pausa o bot
      endConversation: false, // Mas não encerra a conversa
      nextNodeId: outgoingEdge?.target, // Nó para quando voltar do handoff
      output: {
        handoffAt: new Date().toISOString(),
        notifyKeyword: data.notifyKeyword,
      },
    }
  },
  
  validate(node: FlowNode & { data: HandoffNodeData }, edges: FlowEdge[]): ValidationResult {
    const warnings: string[] = []
    const data = node.data
    
    if (!data.message?.trim()) {
      warnings.push('Recomendado configurar uma mensagem de transferência')
    }
    
    return {
      valid: true, // Handoff não tem erros obrigatórios
      errors: [],
      warnings,
    }
  },
}
