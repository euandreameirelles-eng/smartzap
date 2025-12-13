/**
 * End Node Handler
 * 
 * Encerra a conversa, opcionalmente enviando uma mensagem final.
 */

import type { FlowNode } from '@/types'
import { processText } from '../variables'
import { buildTextMessage } from '@/lib/whatsapp/text'

export interface EndNodeData {
  message?: string
}

export interface EndNodeResult {
  success: boolean
  message?: ReturnType<typeof buildTextMessage>
  endConversation: true
  error?: string
}

/**
 * Executa o nó de fim
 * 
 * @param node - Nó de fim
 * @param variables - Variáveis disponíveis para substituição
 * @param recipientPhone - Telefone do destinatário
 * @returns Resultado indicando fim da conversa
 */
export function handleEndNode(
  node: FlowNode,
  variables: Record<string, string>,
  recipientPhone: string
): EndNodeResult {
  const data = node.data as EndNodeData
  
  let message: ReturnType<typeof buildTextMessage> | undefined
  
  // Se tem mensagem de despedida, enviar
  if (data.message) {
    const processedMessage = processText(data.message, variables, {
      contactPhone: recipientPhone,
    })
    
    message = buildTextMessage({
      to: recipientPhone,
      text: processedMessage,
    })
  }
  
  return {
    success: true,
    message,
    endConversation: true,
  }
}

/**
 * Valida se o nó de fim está configurado corretamente
 */
export function validateEndNode(node: FlowNode): string[] {
  // End node não tem validações obrigatórias
  // A mensagem é opcional
  return []
}
