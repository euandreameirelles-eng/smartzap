/**
 * Flow Engine State Manager
 * 
 * Gerencia o estado das conversas com duas camadas:
 * - Redis: Cache quente para acesso rápido
 * - Turso: Fonte de verdade persistente
 */

import { botConversationDb, conversationVariableDb, flowDb } from '@/lib/supabase-db'
import {
  redis,
  getConversationState,
  setConversationState,
  deleteConversationState,
  getConversationVariables,
  setConversationVariables,
  setConversationVariable,
  type ConversationState
} from '@/lib/redis'
import type { ConversationStatus } from '@/types'

export type { ConversationState }

// Re-export with alias for compatibility
export interface ChatbotState extends ConversationState {
  flowId?: string
  lastActivityAt?: string
}

// =============================================================================
// STATE OPERATIONS
// =============================================================================

/**
 * Obtém ou cria o estado da conversa
 * 
 * Usa duas chaves de cache:
 * 1. Lookup key: ${phoneNumberId}:${recipientPhone} -> conversationId
 * 2. State key: conv:${conversationId} -> state completo
 */
export async function getOrCreateState(
  botId: string,
  phoneNumberId: string,
  recipientPhone: string
): Promise<ConversationState> {
  // 1. Tentar buscar conversationId do lookup cache
  const lookupKey = getConversationKey(phoneNumberId, recipientPhone)
  const cachedConversationId = await redis.get(`lookup:${lookupKey}`) as string | null

  if (cachedConversationId) {
    // 2. Tentar buscar state do cache
    const cachedState = await getConversationState(cachedConversationId)
    if (cachedState) {
      return cachedState
    }
  }

  // 3. Buscar conversa existente ou criar nova no Turso
  let conversation = await botConversationDb.getByContact(botId, recipientPhone)

  if (!conversation) {
    conversation = await botConversationDb.create({
      botId,
      contactPhone: recipientPhone,
    })
  }

  // 4. Buscar variáveis da conversa
  const variables = await conversationVariableDb.getAsMap(conversation.id)

  // 5. Montar estado
  const state: ConversationState = {
    conversationId: conversation.id,
    botId: conversation.botId,
    currentNodeId: conversation.currentNodeId || undefined,
    status: mapConversationStatus(conversation.status),
    variables,
    lastMessageAt: conversation.lastMessageAt || new Date().toISOString(),
    cswStartedAt: conversation.cswStartedAt || undefined,
  }

  // 6. Salvar no cache Redis (lookup + state)
  await redis.setex(`lookup:${lookupKey}`, 3600, conversation.id) // 1 hora
  await setConversationState(state)

  return state
}

/**
 * Atualiza o nó atual da conversa
 */
export async function updateCurrentNode(
  conversationId: string,
  nodeId: string
): Promise<void> {
  // 1. Atualizar no Turso
  await botConversationDb.update(conversationId, { currentNodeId: nodeId })

  // 2. Atualizar no cache Redis
  const state = await getConversationState(conversationId)
  if (state) {
    state.currentNodeId = nodeId
    await setConversationState(state)
  }
}

/**
 * Atualiza o status da conversa
 */
export async function updateStatus(
  conversationId: string,
  status: ConversationStatus
): Promise<void> {
  // 1. Atualizar no Turso
  await botConversationDb.update(conversationId, { status })

  // 2. Atualizar no cache Redis
  const state = await getConversationState(conversationId)
  if (state) {
    state.status = mapConversationStatus(status)
    await setConversationState(state)
  }
}

/**
 * Define uma variável da conversa
 */
export async function setVariable(
  conversationId: string,
  key: string,
  value: string
): Promise<void> {
  // 1. Salvar no Turso
  await conversationVariableDb.set(conversationId, key, value)

  // 2. Atualizar no cache Redis
  await setConversationVariable(conversationId, key, value)
}

/**
 * Obtém uma variável da conversa
 */
export async function getVariable(
  conversationId: string,
  key: string
): Promise<string | null> {
  // 1. Tentar do cache Redis primeiro
  const cachedVars = await getConversationVariables(conversationId)
  if (cachedVars && key in cachedVars) {
    return cachedVars[key]
  }

  // 2. Buscar do Turso
  const variables = await conversationVariableDb.getAsMap(conversationId)
  return variables[key] || null
}

/**
 * Obtém todas as variáveis da conversa
 */
export async function getAllVariables(
  conversationId: string
): Promise<Record<string, string>> {
  // 1. Tentar do cache Redis primeiro
  const cachedVars = await getConversationVariables(conversationId)
  if (cachedVars) {
    return cachedVars
  }

  // 2. Buscar do Turso
  const variables = await conversationVariableDb.getAsMap(conversationId)

  // 3. Salvar no cache
  if (Object.keys(variables).length > 0) {
    await setConversationVariables(conversationId, variables)
  }

  return variables
}

/**
 * Encerra a conversa
 */
export async function endConversation(conversationId: string): Promise<void> {
  // 1. Atualizar status no Turso
  await botConversationDb.end(conversationId)

  // 2. Remover do cache Redis
  await deleteConversationState(conversationId)
}

/**
 * Reseta a conversa para o estado inicial
 */
export async function resetConversation(conversationId: string): Promise<void> {
  // 1. Resetar conversa no Turso (limpa currentNodeId)
  await botConversationDb.update(conversationId, {
    currentNodeId: null,
    status: 'active',
    lastMessageAt: new Date().toISOString()
  })

  // 2. Remover do cache Redis para forçar reload
  await deleteConversationState(conversationId)
}

/**
 * Define o ID do flow ativo na conversa (armazenado no Redis)
 */
export async function setFlowId(
  conversationId: string,
  flowId: string
): Promise<void> {
  // Armazenar o flowId no Redis como parte do state
  const state = await getConversationState(conversationId)
  if (state) {
    ; (state as any).flowId = flowId
    await setConversationState(state)
  }
}

/**
 * Assume controle manual da conversa (takeover)
 */
export async function takeoverConversation(
  conversationId: string,
  agentId: string
): Promise<void> {
  // 1. Atualizar no Turso
  await botConversationDb.takeover(conversationId, agentId)

  // 2. Atualizar no cache Redis
  const state = await getConversationState(conversationId)
  if (state) {
    state.status = 'paused'
    await setConversationState(state)
  }
}

/**
 * Libera controle da conversa de volta para o bot
 */
export async function releaseConversation(conversationId: string): Promise<void> {
  // 1. Atualizar no Turso
  await botConversationDb.release(conversationId)

  // 2. Atualizar no cache Redis
  const state = await getConversationState(conversationId)
  if (state) {
    state.status = 'active'
    await setConversationState(state)
  }
}

/**
 * Busca o fluxo principal publicado do bot
 */
export async function getMainFlow(botId: string) {
  return flowDb.getMainFlow(botId)
}

// =============================================================================
// HELPERS
// =============================================================================

function getConversationKey(phoneNumberId: string, recipientPhone: string): string {
  return `${phoneNumberId}:${recipientPhone}`
}

function mapConversationStatus(status: ConversationStatus): 'active' | 'paused' | 'ended' {
  switch (status) {
    case 'active':
      return 'active'
    case 'paused':
      return 'paused'
    case 'ended':
      return 'ended'
    default:
      return 'active'
  }
}
