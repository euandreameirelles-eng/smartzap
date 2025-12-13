/**
 * Handoff Node Handler
 * 
 * Transfere a conversa para atendimento humano.
 * Pausa o bot e notifica a equipe de atendimento.
 */

import type { FlowNode, FlowEdge, HandoffNodeData } from '@/types'
import { processText } from '../variables'
import { buildTextMessage } from '@/lib/whatsapp/text'
import { botConversationDb } from '@/lib/supabase-db'
import { redis } from '@/lib/redis'

export interface HandoffNodeResult {
  success: boolean
  message?: ReturnType<typeof buildTextMessage>
  pauseBot: boolean
  nextNodeId?: string
  error?: string
}

/**
 * Executa o nó de handoff - transfere para atendimento humano
 * 
 * @param node - Nó de handoff
 * @param edges - Edges do fluxo
 * @param variables - Variáveis disponíveis para substituição
 * @param recipientPhone - Telefone do destinatário
 * @param conversationId - ID da conversa (para pausar o bot)
 * @returns Resultado com mensagem de transferência e flag para pausar o bot
 */
export async function handleHandoffNode(
  node: FlowNode,
  edges: FlowEdge[],
  variables: Record<string, string>,
  recipientPhone: string,
  conversationId?: string
): Promise<HandoffNodeResult> {
  const data = node.data as HandoffNodeData

  // Pausar a conversa no banco de dados
  if (conversationId) {
    try {
      await botConversationDb.update(conversationId, {
        status: 'paused',
      })

      // Armazenar informações do handoff no Redis
      const handoffKey = `conversation:${conversationId}:handoff`
      await redis.set(handoffKey, JSON.stringify({
        handoffAt: new Date().toISOString(),
        fromNode: node.id,
        notifyKeyword: data.notifyKeyword,
      }), { ex: 86400 }) // Expira em 24h
    } catch (error) {
      console.error('Erro ao pausar conversa para handoff:', error)
      // Continuar mesmo com erro - a mensagem ainda é enviada
    }
  }

  // Construir mensagem de handoff (se configurada)
  let message: ReturnType<typeof buildTextMessage> | undefined

  if (data.message) {
    const processedMessage = processText(data.message, variables, {
      contactPhone: recipientPhone,
    })

    message = buildTextMessage({
      to: recipientPhone,
      text: processedMessage,
    })
  }

  // O nó de handoff geralmente não tem próximo nó automático
  // O fluxo só continua quando o operador devolve ao bot
  const outgoingEdge = edges.find(e => e.source === node.id)

  return {
    success: true,
    message,
    pauseBot: true,
    nextNodeId: outgoingEdge?.target, // Pode haver um nó de "após handoff"
  }
}

/**
 * Valida se o nó de handoff está configurado corretamente
 */
export function validateHandoffNode(node: FlowNode): string[] {
  const errors: string[] = []
  const data = node.data as HandoffNodeData

  // Verificar se tem mensagem de transferência (recomendado)
  if (!data.message || data.message.trim() === '') {
    // Não é erro, apenas warning - uma mensagem de handoff é recomendada
  }

  // Handoff não precisa de saída obrigatória
  // O fluxo pode terminar no handoff ou continuar após operador devolver

  return errors
}

/**
 * Verifica se a conversa está em modo de handoff
 */
export async function isInHandoffMode(conversationId: string): Promise<boolean> {
  try {
    const conversation = await botConversationDb.getById(conversationId)
    return conversation?.status === 'paused'
  } catch {
    return false
  }
}

/**
 * Obtém informações do handoff de uma conversa
 */
export async function getHandoffInfo(conversationId: string): Promise<{
  handoffAt: string
  fromNode: string
  notifyKeyword?: string
} | null> {
  try {
    const handoffKey = `conversation:${conversationId}:handoff`
    const data = await redis.get(handoffKey)

    if (data) {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data
      if (parsed && typeof parsed === 'object' && 'handoffAt' in parsed && 'fromNode' in parsed) {
        return parsed as { handoffAt: string; fromNode: string; notifyKeyword?: string }
      }
    }

    return null
  } catch {
    return null
  }
}
