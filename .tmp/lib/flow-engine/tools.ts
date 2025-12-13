/**
 * Flow Engine Tool Execution
 * 
 * Gerencia execução de ferramentas (webhooks) para agentes de IA.
 * Cada ferramenta é um endpoint HTTP que pode ser chamado durante
 * a geração de resposta do agente.
 */

import type { AITool, ToolExecution } from '@/types'
import { aiToolDb, toolExecutionDb } from '@/lib/supabase-db'

// =============================================================================
// TYPES
// =============================================================================

export interface ToolExecutionContext {
  toolId: string
  conversationId: string
  input: Record<string, unknown>
  agentId?: string
}

export interface ToolExecutionResult {
  success: boolean
  output?: Record<string, unknown>
  error?: string
  durationMs: number
  executionId: string
}

export interface ToolCallRequest {
  name: string
  arguments: Record<string, unknown>
}

// =============================================================================
// TOOL EXECUTION
// =============================================================================

/**
 * Executa uma ferramenta via webhook
 * 
 * @param tool - Configuração da ferramenta
 * @param context - Contexto de execução
 * @returns Resultado da execução
 */
export async function executeTool(
  tool: AITool,
  context: ToolExecutionContext
): Promise<ToolExecutionResult> {
  const startTime = Date.now()

  // Criar registro de execução
  const execution = await toolExecutionDb.create({
    toolId: tool.id,
    conversationId: context.conversationId,
    input: context.input,
  })

  try {
    // Preparar payload para webhook
    const webhookPayload = {
      tool: {
        id: tool.id,
        name: tool.name,
      },
      execution: {
        id: execution.id,
        conversationId: context.conversationId,
      },
      input: context.input,
      timestamp: new Date().toISOString(),
    }

    // Configurar timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), tool.timeoutMs)

    // Chamar webhook
    const response = await fetch(tool.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tool-Id': tool.id,
        'X-Execution-Id': execution.id,
        'X-Conversation-Id': context.conversationId,
      },
      body: JSON.stringify(webhookPayload),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    const durationMs = Date.now() - startTime

    // Processar resposta
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      const errorMessage = `HTTP ${response.status}: ${errorText.substring(0, 200)}`

      await toolExecutionDb.fail(execution.id, errorMessage, durationMs)

      return {
        success: false,
        error: errorMessage,
        durationMs,
        executionId: execution.id,
      }
    }

    // Parse resposta JSON
    const output = await response.json().catch(() => ({}))

    await toolExecutionDb.complete(execution.id, output, durationMs)

    return {
      success: true,
      output,
      durationMs,
      executionId: execution.id,
    }
  } catch (error) {
    const durationMs = Date.now() - startTime
    let errorMessage: string

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = `Timeout após ${tool.timeoutMs}ms`
      } else {
        errorMessage = error.message
      }
    } else {
      errorMessage = 'Unknown error'
    }

    await toolExecutionDb.fail(execution.id, errorMessage, durationMs)

    console.error(`Tool execution failed [${tool.name}]:`, errorMessage)

    return {
      success: false,
      error: errorMessage,
      durationMs,
      executionId: execution.id,
    }
  }
}

/**
 * Executa múltiplas ferramentas em sequência
 * 
 * @param calls - Lista de chamadas de ferramentas
 * @param agentId - ID do agente
 * @param conversationId - ID da conversa
 * @returns Resultados das execuções
 */
export async function executeToolCalls(
  calls: ToolCallRequest[],
  agentId: string,
  conversationId: string
): Promise<ToolExecutionResult[]> {
  // Buscar ferramentas do agente
  const tools = await aiToolDb.getByAgent(agentId)
  const toolsByName = new Map(tools.map(t => [t.name, t]))

  const results: ToolExecutionResult[] = []

  for (const call of calls) {
    const tool = toolsByName.get(call.name)

    if (!tool) {
      results.push({
        success: false,
        error: `Ferramenta '${call.name}' não encontrada`,
        durationMs: 0,
        executionId: '',
      })
      continue
    }

    const result = await executeTool(tool, {
      toolId: tool.id,
      conversationId,
      input: call.arguments,
      agentId,
    })

    results.push(result)
  }

  return results
}

/**
 * Formata resultados de ferramentas para inclusão no contexto da IA
 * 
 * @param results - Resultados das execuções
 * @param calls - Chamadas originais
 * @returns Texto formatado para contexto
 */
export function formatToolResultsForContext(
  results: ToolExecutionResult[],
  calls: ToolCallRequest[]
): string {
  const lines: string[] = ['## Resultados das Ferramentas']

  results.forEach((result, index) => {
    const call = calls[index]

    if (result.success && result.output) {
      lines.push(`\n### ${call.name}`)
      lines.push('**Status:** ✅ Sucesso')
      lines.push(`**Tempo:** ${result.durationMs}ms`)
      lines.push('**Resultado:**')
      lines.push('```json')
      lines.push(JSON.stringify(result.output, null, 2))
      lines.push('```')
    } else {
      lines.push(`\n### ${call.name}`)
      lines.push('**Status:** ❌ Erro')
      lines.push(`**Erro:** ${result.error}`)
    }
  })

  return lines.join('\n')
}

// =============================================================================
// TOOL VALIDATION
// =============================================================================

/**
 * Valida parâmetros de entrada contra o schema da ferramenta
 * 
 * @param tool - Configuração da ferramenta
 * @param input - Parâmetros de entrada
 * @returns Resultado da validação
 */
export function validateToolInput(
  tool: AITool,
  input: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const schema = tool.parametersSchema as Record<string, {
    type?: string
    required?: boolean
    description?: string
  }>

  // Verificar campos obrigatórios
  for (const [key, config] of Object.entries(schema)) {
    if (config.required && !(key in input)) {
      errors.push(`Campo obrigatório ausente: ${key}`)
    }

    if (key in input && config.type) {
      const actualType = typeof input[key]
      if (config.type === 'number' && actualType !== 'number') {
        errors.push(`Campo ${key} deve ser um número`)
      }
      if (config.type === 'string' && actualType !== 'string') {
        errors.push(`Campo ${key} deve ser uma string`)
      }
      if (config.type === 'boolean' && actualType !== 'boolean') {
        errors.push(`Campo ${key} deve ser um booleano`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// =============================================================================
// TOOL HISTORY
// =============================================================================

/**
 * Busca histórico de execuções de uma ferramenta
 * 
 * @param toolId - ID da ferramenta
 * @param limit - Número máximo de registros
 * @returns Lista de execuções
 */
export async function getToolExecutionHistory(
  toolId: string,
  limit: number = 20
): Promise<ToolExecution[]> {
  // Esta função seria implementada com uma query no banco
  // Por ora, retornamos array vazio
  // Em produção: return await toolExecutionDb.getByTool(toolId, limit)
  console.log(`Fetching execution history for tool ${toolId}, limit ${limit}`)
  return []
}

/**
 * Calcula estatísticas de execução de uma ferramenta
 * 
 * @param toolId - ID da ferramenta
 * @returns Estatísticas
 */
export async function getToolStats(toolId: string): Promise<{
  totalExecutions: number
  successRate: number
  avgDurationMs: number
  lastExecution?: string
}> {
  // Esta função seria implementada com queries agregadas
  // Por ora, retornamos valores default
  console.log(`Fetching stats for tool ${toolId}`)
  return {
    totalExecutions: 0,
    successRate: 0,
    avgDurationMs: 0,
  }
}
