/**
 * Flow Engine Variable Substitution and Persistence
 * 
 * Substitui variáveis no formato {{variavel}} nas mensagens
 * e persiste variáveis coletadas no banco de dados.
 */

import { conversationVariableDb } from '@/lib/supabase-db'

// Regex para capturar variáveis no formato {{nome}}
const VARIABLE_REGEX = /\{\{([^}]+)\}\}/g

/**
 * Substitui variáveis em um texto
 * 
 * @param text - Texto com placeholders {{variavel}}
 * @param variables - Map de variáveis disponíveis
 * @returns Texto com variáveis substituídas
 */
export function substituteVariables(
  text: string,
  variables: Record<string, string>
): string {
  return text.replace(VARIABLE_REGEX, (match, varName) => {
    const trimmedName = varName.trim()

    // Tentar buscar a variável exata
    if (trimmedName in variables) {
      return variables[trimmedName]
    }

    // Tentar variações comuns (case insensitive)
    const lowerName = trimmedName.toLowerCase()
    const foundKey = Object.keys(variables).find(
      key => key.toLowerCase() === lowerName
    )

    if (foundKey) {
      return variables[foundKey]
    }

    // Se não encontrar, retornar o placeholder original
    return match
  })
}

/**
 * Extrai nomes de variáveis usadas em um texto
 * 
 * @param text - Texto com placeholders {{variavel}}
 * @returns Lista de nomes de variáveis encontradas
 */
export function extractVariableNames(text: string): string[] {
  const names: string[] = []
  let match

  while ((match = VARIABLE_REGEX.exec(text)) !== null) {
    const varName = match[1].trim()
    if (!names.includes(varName)) {
      names.push(varName)
    }
  }

  // Reset regex lastIndex para próxima chamada
  VARIABLE_REGEX.lastIndex = 0

  return names
}

/**
 * Verifica se todas as variáveis de um texto estão disponíveis
 * 
 * @param text - Texto com placeholders {{variavel}}
 * @param variables - Map de variáveis disponíveis
 * @returns Objeto com resultado da validação
 */
export function validateVariables(
  text: string,
  variables: Record<string, string>
): { valid: boolean; missing: string[] } {
  const requiredVars = extractVariableNames(text)
  const missing: string[] = []

  for (const varName of requiredVars) {
    const lowerName = varName.toLowerCase()
    const hasVar = Object.keys(variables).some(
      key => key.toLowerCase() === lowerName
    )

    if (!hasVar) {
      missing.push(varName)
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}

/**
 * Variáveis do sistema disponíveis automaticamente
 * 
 * Built-in variables:
 * - {{contact_phone}} - Telefone do contato
 * - {{contact_name}} - Nome do contato
 * - {{last_message}} - Última mensagem recebida
 * - {{current_date}} - Data atual (DD/MM/YYYY)
 * - {{current_time}} - Hora atual (HH:MM)
 * - {{current_datetime}} - Data e hora atual
 * - {{day_of_week}} - Dia da semana
 * - {{greeting}} - Saudação automática (Bom dia/Boa tarde/Boa noite)
 * - {{bot_name}} - Nome do bot
 * - {{execution_id}} - ID da execução atual
 * - {{flow_id}} - ID do flow
 */
export function getSystemVariables(context: {
  contactPhone?: string
  contactName?: string
  botName?: string
  currentTime?: Date
  lastMessage?: string
  executionId?: string
  flowId?: string
}): Record<string, string> {
  const now = context.currentTime || new Date()

  return {
    // Dados do contato - múltiplos formatos para compatibilidade
    phone: context.contactPhone || '',
    contact_phone: context.contactPhone || '',
    contactPhone: context.contactPhone || '',

    nome: context.contactName || '',
    name: context.contactName || '',
    contact_name: context.contactName || '',
    contactName: context.contactName || '',

    // Última mensagem
    last_message: context.lastMessage || '',
    lastMessage: context.lastMessage || '',
    ultima_mensagem: context.lastMessage || '',

    // Dados do bot
    bot_name: context.botName || '',
    botName: context.botName || '',

    // IDs de execução
    execution_id: context.executionId || '',
    executionId: context.executionId || '',
    flow_id: context.flowId || '',
    flowId: context.flowId || '',

    // Data e hora - múltiplos formatos
    data: now.toLocaleDateString('pt-BR'),
    current_date: now.toLocaleDateString('pt-BR'),
    currentDate: now.toLocaleDateString('pt-BR'),
    date: now.toLocaleDateString('pt-BR'),

    hora: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    current_time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    currentTime: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),

    current_datetime: `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    currentDateTime: `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,

    dia_semana: now.toLocaleDateString('pt-BR', { weekday: 'long' }),
    day_of_week: now.toLocaleDateString('pt-BR', { weekday: 'long' }),
    dayOfWeek: now.toLocaleDateString('pt-BR', { weekday: 'long' }),

    // Saudação automática
    saudacao: getSaudacao(now),
    greeting: getSaudacao(now),

    // Úteis para templates
    year: now.getFullYear().toString(),
    month: (now.getMonth() + 1).toString().padStart(2, '0'),
    day: now.getDate().toString().padStart(2, '0'),
  }
}

/**
 * Retorna saudação apropriada para a hora do dia
 */
function getSaudacao(date: Date): string {
  const hour = date.getHours()

  if (hour >= 5 && hour < 12) {
    return 'Bom dia'
  } else if (hour >= 12 && hour < 18) {
    return 'Boa tarde'
  } else {
    return 'Boa noite'
  }
}

/**
 * Processa texto com substituição de variáveis e validação
 * 
 * @param text - Texto com placeholders
 * @param userVariables - Variáveis definidas pelo usuário
 * @param systemContext - Contexto para variáveis do sistema
 * @returns Texto processado
 */
export function processText(
  text: string,
  userVariables: Record<string, string>,
  systemContext?: {
    contactPhone?: string
    contactName?: string
    botName?: string
    currentTime?: Date
  }
): string {
  const systemVars = systemContext ? getSystemVariables(systemContext) : {}

  // Variáveis do usuário têm prioridade sobre as do sistema
  const allVariables = { ...systemVars, ...userVariables }

  return substituteVariables(text, allVariables)
}

// ============================================================================
// VARIABLE PERSISTENCE
// ============================================================================

/**
 * Carrega variáveis de uma conversa do banco de dados
 * 
 * @param conversationId - ID da conversa
 * @returns Map de variáveis
 */
export async function loadConversationVariables(
  conversationId: string
): Promise<Record<string, string>> {
  return await conversationVariableDb.getAsMap(conversationId)
}

/**
 * Salva uma variável de conversa no banco de dados
 * 
 * @param conversationId - ID da conversa
 * @param key - Nome da variável
 * @param value - Valor da variável
 */
export async function saveConversationVariable(
  conversationId: string,
  key: string,
  value: string
): Promise<void> {
  await conversationVariableDb.set(conversationId, key, value)
}

/**
 * Salva múltiplas variáveis de conversa no banco de dados
 * 
 * @param conversationId - ID da conversa
 * @param variables - Map de variáveis a salvar
 */
export async function saveConversationVariables(
  conversationId: string,
  variables: Record<string, string>
): Promise<void> {
  const entries = Object.entries(variables)

  // Salvar em paralelo para melhor performance
  await Promise.all(
    entries.map(([key, value]) =>
      conversationVariableDb.set(conversationId, key, value)
    )
  )
}

/**
 * Remove uma variável de conversa do banco de dados
 * 
 * @param conversationId - ID da conversa
 * @param key - Nome da variável a remover
 */
export async function deleteConversationVariable(
  conversationId: string,
  key: string
): Promise<void> {
  await conversationVariableDb.delete(conversationId, key)
}

/**
 * Carrega variáveis e combina com variáveis do sistema
 * 
 * @param conversationId - ID da conversa
 * @param systemContext - Contexto para variáveis do sistema
 * @returns Map combinado de variáveis
 */
export async function getFullVariableContext(
  conversationId: string,
  systemContext?: {
    contactPhone?: string
    contactName?: string
    botName?: string
    currentTime?: Date
  }
): Promise<Record<string, string>> {
  // Carregar variáveis salvas
  const savedVariables = await loadConversationVariables(conversationId)

  // Obter variáveis do sistema
  const systemVariables = systemContext ? getSystemVariables(systemContext) : {}

  // Variáveis salvas têm prioridade sobre as do sistema
  return { ...systemVariables, ...savedVariables }
}

