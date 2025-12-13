/**
 * AI Agent Node Handler
 * 
 * Executa um agente de IA no contexto do fluxo,
 * passando histórico de conversa e variáveis como contexto.
 * 
 * Usa o serviço unificado de IA (lib/ai) para geração.
 */

import { generateText, type ChatMessage } from '@/lib/ai'
import type { FlowNode, AIAgent, AITool } from '@/types'
import type { ExecutionResult, WhatsAppMessage } from '../executor'
import { aiAgentDb, aiToolDb, botMessageDb, toolExecutionDb } from '@/lib/supabase-db'
import { processText } from '../variables'

// =============================================================================
// TYPES
// =============================================================================

export interface AIAgentNodeData {
  agentId: string
  fallbackMessage?: string
}

export interface AIAgentNodeResult extends ExecutionResult {
  aiResponse?: string
  toolsExecuted?: string[]
}

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

/**
 * Processa um nó de agente de IA
 */
export async function handleAIAgentNode(
  node: FlowNode,
  conversationId: string,
  recipientPhone: string,
  userMessage: string,
  variables: Record<string, string>
): Promise<AIAgentNodeResult> {
  const data = node.data as AIAgentNodeData

  if (!data.agentId) {
    return {
      success: false,
      error: 'AI Agent node has no agentId configured',
    }
  }

  try {
    // 1. Buscar configuração do agente
    const agent = await aiAgentDb.getById(data.agentId)
    if (!agent) {
      return {
        success: false,
        error: `AI Agent ${data.agentId} not found`,
      }
    }

    // 2. Buscar ferramentas do agente
    const tools = await aiToolDb.getByAgent(data.agentId)

    // 3. Buscar histórico de mensagens para contexto
    const conversationHistory = await getConversationHistory(conversationId)

    // 4. Processar system prompt com variáveis
    const systemPrompt = processText(agent.systemPrompt, variables, {
      contactPhone: recipientPhone,
    })

    // 5. Executar o agente
    const result = await executeAgent(
      agent,
      tools,
      systemPrompt,
      conversationHistory,
      userMessage,
      conversationId,
      variables
    )

    if (!result.success) {
      // Usar fallback message se configurado
      if (data.fallbackMessage) {
        const fallbackText = processText(data.fallbackMessage, variables)

        const message: WhatsAppMessage = {
          type: 'text',
          payload: {
            messaging_product: 'whatsapp',
            to: recipientPhone,
            type: 'text',
            text: { body: fallbackText }
          }
        }

        return {
          success: true,
          messages: [message],
          error: result.error,
        }
      }

      return result
    }

    // 6. Criar mensagem de resposta
    const message: WhatsAppMessage = {
      type: 'text',
      payload: {
        messaging_product: 'whatsapp',
        to: recipientPhone,
        type: 'text',
        text: { body: result.response }
      }
    }

    return {
      success: true,
      messages: [message],
      aiResponse: result.response,
      toolsExecuted: result.toolsExecuted,
    }
  } catch (error) {
    console.error('AI Agent execution error:', error)

    // Fallback message
    if (data.fallbackMessage) {
      const fallbackText = processText(data.fallbackMessage, variables)

      const message: WhatsAppMessage = {
        type: 'text',
        payload: {
          messaging_product: 'whatsapp',
          to: recipientPhone,
          type: 'text',
          text: { body: fallbackText }
        }
      }

      return {
        success: true,
        messages: [message],
        error: error instanceof Error ? error.message : 'Unknown AI error',
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown AI error',
    }
  }
}

// =============================================================================
// AGENT EXECUTION
// =============================================================================

interface AgentExecutionResult {
  success: boolean
  response: string
  toolsExecuted?: string[]
  error?: string
}

/**
 * Executa o agente de IA com o serviço unificado
 */
async function executeAgent(
  agent: AIAgent,
  tools: AITool[],
  systemPrompt: string,
  conversationHistory: ConversationMessage[],
  userMessage: string,
  conversationId: string,
  _variables: Record<string, string>
): Promise<AgentExecutionResult> {
  // Construir prompt do sistema aprimorado
  const enhancedSystemPrompt = `${systemPrompt}

## Instruções
- Responda de forma natural e amigável
- Seja conciso (max 500 caracteres para WhatsApp)
- Use emojis com moderação quando apropriado`

  try {
    // Construir mensagens no formato correto
    const messages: ChatMessage[] = [
      ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: userMessage }
    ]

    // Usar serviço unificado de IA
    const result = await generateText({
      system: enhancedSystemPrompt,
      messages,
      temperature: agent.temperature,
      // O modelo do agente é um hint, mas o serviço usa o configurado globalmente
      // Em futuras versões podemos adicionar suporte a override por agente
    })

    const text = result.text

    if (!text) {
      return {
        success: false,
        response: '',
        error: 'AI returned empty response',
      }
    }

    // TODO: Implementar suporte a tools quando o serviço unificado suportar
    // Por agora, agentes não executam tools automaticamente
    const executedTools: string[] = []

    // Log tools disponíveis para debug
    if (tools.length > 0) {
      console.log(`[AI Agent] Agent has ${tools.length} tools available, but tool execution not yet implemented in unified service`)
    }

    return {
      success: true,
      response: text,
      toolsExecuted: executedTools.length > 0 ? executedTools : undefined,
    }
  } catch (error) {
    console.error('AI Service error:', error)
    return {
      success: false,
      response: '',
      error: error instanceof Error ? error.message : 'AI generation error',
    }
  }
}

// =============================================================================
// CONVERSATION HISTORY
// =============================================================================

/**
 * Busca histórico de mensagens da conversa para contexto
 */
async function getConversationHistory(
  conversationId: string,
  limit: number = 10
): Promise<ConversationMessage[]> {
  try {
    const messages = await botMessageDb.getByConversation(conversationId, limit)

    return messages.map(msg => ({
      role: (msg.direction === 'inbound' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: typeof msg.content === 'string'
        ? msg.content
        : (msg.content as { text?: string })?.text || JSON.stringify(msg.content),
    })).reverse() // Ordenar do mais antigo para o mais recente
  } catch {
    return []
  }
}

// =============================================================================
// TOOL EXECUTION
// =============================================================================

/**
 * Executa uma chamada de ferramenta via webhook
 */
async function executeToolCall(
  tool: AITool,
  input: Record<string, unknown>,
  conversationId: string
): Promise<Record<string, unknown> | null> {
  const startTime = Date.now()

  // Criar registro de execução
  const execution = await toolExecutionDb.create({
    toolId: tool.id,
    conversationId,
    input,
  })

  try {
    // Chamar webhook da ferramenta
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), tool.timeoutMs)

    const response = await fetch(tool.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        toolId: tool.id,
        executionId: execution.id,
        conversationId,
        input,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    const durationMs = Date.now() - startTime

    if (!response.ok) {
      const errorText = await response.text()
      await toolExecutionDb.fail(execution.id, `HTTP ${response.status}: ${errorText}`, durationMs)
      return null
    }

    const output = await response.json()

    await toolExecutionDb.complete(execution.id, output, durationMs)

    return output
  } catch (error) {
    const durationMs = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    await toolExecutionDb.fail(execution.id, errorMessage, durationMs)

    console.error(`Tool execution failed: ${tool.name}`, error)
    return null
  }
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Valida configuração do nó de agente de IA
 */
export function validateAIAgentNode(data: AIAgentNodeData): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!data.agentId) {
    errors.push('Agent ID é obrigatório')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Retorna informações sobre um agente configurado
 */
export async function getAIAgentInfo(agentId: string): Promise<{
  name: string
  model: string
  toolsCount: number
} | null> {
  const agent = await aiAgentDb.getById(agentId)
  if (!agent) return null

  const tools = await aiToolDb.getByAgent(agentId)

  return {
    name: agent.name,
    model: agent.model,
    toolsCount: tools.length,
  }
}
