/**
 * Flow Engine Executor
 * 
 * Responsável por executar o fluxo do bot, navegando entre nós
 * e processando as respostas dos usuários.
 * 
 * Suporta dois modos de execução:
 * - campaign: Disparo em lote para lista de contatos (via QStash)
 * - chatbot: Resposta em tempo real para mensagens incoming
 */

import type { Flow, FlowNode, FlowEdge, FlowExecutionMode, FlowExecution, NodeExecution } from '@/types'
import type { ConversationState } from '@/lib/redis'
import * as stateManager from './state'
import { processText } from './variables'
import { handleAIAgentNode } from './nodes/ai-agent'
import { sendWhatsAppMessage, sendTextMessage } from './sender'
import { handleSendError, logDebug } from './error-handler'
import { flowExecutionDb, nodeExecutionDb, settingsDb } from '@/lib/supabase-db'

// =============================================================================
// TYPES
// =============================================================================

export interface ExecutionContext {
  state: ConversationState
  flow: Flow
  phoneNumberId: string
  accessToken: string
  recipientPhone: string
  incomingMessage?: {
    type: 'text' | 'button_reply' | 'list_reply' | 'interactive'
    text?: string
    buttonId?: string
    listId?: string
  }
  /** Execution mode: campaign (batch) or chatbot (realtime) */
  mode?: FlowExecutionMode
  /** Flow execution record ID for tracking */
  executionId?: string
  /** Rate limiting config for campaign mode (ms) */
  rateLimitMs?: number
}

export interface ExecutionResult {
  success: boolean
  nextNodeId?: string
  messages?: WhatsAppMessage[]
  error?: string
  endConversation?: boolean
  collectInput?: {
    variableName: string
    validationType: string
  }
  /** Node execution tracking */
  nodeExecutionId?: string
  /** Delay required before next node (ms) */
  delayMs?: number
}

export interface WhatsAppMessage {
  type: 'text' | 'interactive' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'template' | 'contacts' | 'sticker' | 'reaction'
  payload: Record<string, unknown>
}

/** Mode-specific executor interface */
export interface ModeExecutor {
  execute(context: ExecutionContext): Promise<ExecutionResult>
  shouldContinue(result: ExecutionResult): boolean
  onNodeComplete(context: ExecutionContext, nodeId: string, result: ExecutionResult): Promise<void>
}

// =============================================================================
// MODE DISPATCH
// =============================================================================

/**
 * Get the appropriate executor for the given mode
 */
function getModeExecutor(mode: FlowExecutionMode): ModeExecutor {
  switch (mode) {
    case 'campaign':
      return new CampaignModeExecutor()
    case 'chatbot':
    default:
      return new ChatbotModeExecutor()
  }
}

/**
 * Campaign Mode Executor
 * - Sends messages without waiting for responses
 * - Respects rate limiting (6s between messages to same recipient)
 * - Tracks progress in database
 */
class CampaignModeExecutor implements ModeExecutor {
  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const result = await executeStep(context)

    // In campaign mode, send messages immediately
    if (result.success && result.messages?.length) {
      for (const message of result.messages) {
        const sendResult = await sendWhatsAppMessage({
          phoneNumberId: context.phoneNumberId,
          accessToken: context.accessToken,
          to: context.recipientPhone,
          payload: {
            type: message.type as 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'location' | 'contacts' | 'interactive' | 'template' | 'reaction',
            payload: message.payload,
          },
        })

        if (!sendResult.success) {
          const errorContext = {
            executionId: context.executionId || '',
            nodeId: context.state.currentNodeId || '',
            contactPhone: context.recipientPhone,
            retryCount: 0,
            maxRetries: 3,
          }

          const handled = handleSendError(sendResult, errorContext)

          if (!handled.shouldRetry || handled.shouldAbort) {
            return {
              ...result,
              success: false,
              error: sendResult.errorMessage || 'Message send failed',
            }
          }

          // If retryable, log and continue (QStash will handle retry)
          logDebug(`Campaign: Retryable error for ${context.recipientPhone}: ${sendResult.errorMessage}`)
        } else {
          logDebug(`Campaign: Message sent to ${context.recipientPhone}`)
        }

        // Apply rate limiting delay for campaign mode
        if (context.rateLimitMs) {
          await new Promise(resolve => setTimeout(resolve, context.rateLimitMs))
        }
      }
    }

    return result
  }

  shouldContinue(result: ExecutionResult): boolean {
    // Campaign mode continues until end node or error
    // Does NOT wait for user input
    return result.success &&
      !!result.nextNodeId &&
      !result.endConversation
  }

  async onNodeComplete(context: ExecutionContext, nodeId: string, result: ExecutionResult): Promise<void> {
    // Track node completion in database
    if (context.executionId) {
      try {
        const nodeExec = await nodeExecutionDb.create({
          executionId: context.executionId,
          nodeId,
          nodeType: 'message', // Will be updated by actual node type
          contactPhone: context.recipientPhone,
        })

        // Update status using appropriate method
        if (!result.success) {
          await nodeExecutionDb.fail(nodeExec.id, {
            errorMessage: result.error || 'Unknown error'
          })
        } else {
          await nodeExecutionDb.complete(nodeExec.id, {})
        }
      } catch (error) {
        logDebug(`Failed to track node execution: ${error}`)
      }
    }
  }
}

/**
 * Chatbot Mode Executor
 * - Waits for user responses when needed
 * - Maintains conversation state
 * - Handles interactive message responses
 */
class ChatbotModeExecutor implements ModeExecutor {
  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    return executeStep(context)
  }

  shouldContinue(result: ExecutionResult): boolean {
    // Chatbot mode stops when:
    // - Needs user input (menu, input nodes)
    // - End of conversation
    // - Error occurred
    return result.success &&
      !!result.nextNodeId &&
      !result.collectInput &&
      !result.endConversation
  }

  async onNodeComplete(_context: ExecutionContext, _nodeId: string, _result: ExecutionResult): Promise<void> {
    // Chatbot mode updates conversation state (already handled by state manager)
  }
}

// =============================================================================
// CORE EXECUTOR
// =============================================================================

/**
 * Execute flow with mode-specific behavior
 */
export async function executeFlowWithMode(
  context: ExecutionContext,
  mode: FlowExecutionMode = 'chatbot'
): Promise<ExecutionResult> {
  const executor = getModeExecutor(mode)
  const contextWithMode = { ...context, mode }

  // Create execution record for tracking (campaign mode only)
  let executionId = context.executionId
  if (!executionId && mode === 'campaign') {
    const execution = await flowExecutionDb.create({
      flowId: context.flow.id,
      mode,
      triggerSource: 'api',
      contactCount: 1,
    })
    executionId = execution.id

    // Update status to running
    await flowExecutionDb.updateStatus(executionId, { status: 'running' })
  }

  let result = await executor.execute({
    ...contextWithMode,
    executionId,
  })

  // Continue executing while mode allows
  while (executor.shouldContinue(result)) {
    // Track node completion
    await executor.onNodeComplete(
      contextWithMode,
      context.state.currentNodeId || '',
      result
    )

    // Update state for next node
    if (result.nextNodeId) {
      await stateManager.updateCurrentNode(
        context.state.conversationId,
        result.nextNodeId
      )

      // Update context with new node
      const updatedState = { ...context.state, currentNodeId: result.nextNodeId }
      const newContext: ExecutionContext = {
        ...contextWithMode,
        state: updatedState,
        executionId,
        incomingMessage: undefined, // Clear for auto-execution
      }

      const nextResult = await executor.execute(newContext)

      // Accumulate messages
      if (result.messages && nextResult.messages) {
        result.messages = [...result.messages, ...nextResult.messages]
      } else if (nextResult.messages) {
        result.messages = nextResult.messages
      }

      // Update result
      result = {
        ...result,
        nextNodeId: nextResult.nextNodeId,
        collectInput: nextResult.collectInput,
        endConversation: nextResult.endConversation,
        error: nextResult.error,
        delayMs: nextResult.delayMs,
      }

      if (!nextResult.success) {
        result.success = false
        break
      }

      // Handle delay nodes in campaign mode
      if (result.delayMs && mode === 'campaign') {
        // Return with delay info - caller should schedule via QStash
        break
      }
    }
  }

  // Update execution record
  if (executionId && mode === 'campaign') {
    await flowExecutionDb.updateStatus(
      executionId,
      {
        status: result.success ? 'completed' : 'failed',
        errorMessage: result.error
      }
    )
  }

  return result
}

// =============================================================================
// EXECUTOR
// =============================================================================

/**
 * Executa um passo do fluxo baseado no estado atual e mensagem recebida
 */
export async function executeStep(context: ExecutionContext): Promise<ExecutionResult> {
  const { state, flow, incomingMessage } = context

  // 1. Se não tem currentNodeId, começar pelo nó de início
  if (!state.currentNodeId) {
    const startNode = findStartNode(flow.nodes)
    if (!startNode) {
      return { success: false, error: 'Flow does not have a start node' }
    }

    // Atualizar estado para o nó de início
    await stateManager.updateCurrentNode(state.conversationId, startNode.id)

    // Executar o nó de início (geralmente só segue para o próximo)
    return executeNode(startNode, context)
  }

  // 2. Buscar nó atual
  const currentNode = flow.nodes.find(n => n.id === state.currentNodeId)
  if (!currentNode) {
    return { success: false, error: `Node ${state.currentNodeId} not found in flow` }
  }

  // 3. Processar resposta do usuário se houver
  if (incomingMessage) {
    const transitionResult = await processUserResponse(currentNode, context)
    if (transitionResult.nextNodeId) {
      // Navegar para o próximo nó e executá-lo
      await stateManager.updateCurrentNode(state.conversationId, transitionResult.nextNodeId)

      const nextNode = flow.nodes.find(n => n.id === transitionResult.nextNodeId)
      if (nextNode) {
        return executeNode(nextNode, context)
      }
    }
    return transitionResult
  }

  // 4. Executar nó atual (sem mensagem do usuário)
  return executeNode(currentNode, context)
}

/**
 * Executa um nó específico e retorna o resultado
 */
async function executeNode(node: FlowNode, context: ExecutionContext): Promise<ExecutionResult> {
  const { state, flow } = context
  const variables = await stateManager.getAllVariables(state.conversationId)

  switch (node.type) {
    case 'start':
      return handleStartNode(node, flow, context)

    case 'message':
      return handleMessageNode(node, variables, flow, context)

    case 'menu':
      return handleMenuNode(node, variables)

    case 'input':
      return handleInputNode(node, variables)

    case 'condition':
      return handleConditionNode(node, variables, flow)

    case 'delay':
      return handleDelayNode(node, flow)

    case 'handoff':
      return handleHandoffNode(node, state.conversationId)

    case 'ai_agent': {
      // AI Agent requer a mensagem do usuário e mais contexto
      const userMessage = context.incomingMessage?.text || ''
      return handleAIAgentNode(node, state.conversationId, context.recipientPhone, userMessage, variables)
    }

    case 'end':
      return handleEndNode(node, state.conversationId)

    case 'template':
      return handleTemplateNode(node, variables, flow, context)

    default:
      return { success: false, error: `Unknown node type: ${node.type}` }
  }
}

/**
 * Processa a resposta do usuário e determina a transição
 */
async function processUserResponse(currentNode: FlowNode, context: ExecutionContext): Promise<ExecutionResult> {
  const { state, flow, incomingMessage } = context

  if (!incomingMessage) {
    return { success: false, error: 'No incoming message to process' }
  }

  switch (currentNode.type) {
    case 'template': {
      // Para templates com botões de resposta rápida
      const templateData = currentNode.data as {
        buttons?: Array<{ id: string; type: string; text: string }>
      }
      const buttons = templateData.buttons || []

      // Tentar match por button_id ou texto
      const userInput = incomingMessage.buttonId || incomingMessage.text?.toLowerCase()

      // Buscar botão correspondente
      const matchedButton = buttons.find(btn => {
        if (btn.type !== 'QUICK_REPLY' && btn.type !== 'quick_reply') return false
        return btn.id === userInput ||
          btn.text.toLowerCase() === userInput ||
          btn.id.toLowerCase() === userInput
      })

      if (matchedButton) {
        // Buscar edge que sai deste nó com este handle (button id)
        const edge = findEdgeBySourceHandle(flow.edges, currentNode.id, matchedButton.id)
        if (edge) {
          return { success: true, nextNodeId: edge.target }
        }

        // Tentar buscar edge pelo texto do botão também
        const edgeByText = findEdgeBySourceHandle(flow.edges, currentNode.id, `button_${matchedButton.id}`)
        if (edgeByText) {
          return { success: true, nextNodeId: edgeByText.target }
        }
      }

      // Se não encontrou botão válido, buscar fallback edge ou edge padrão
      const fallbackEdge = findEdgeBySourceHandle(flow.edges, currentNode.id, 'fallback')
      if (fallbackEdge) {
        return { success: true, nextNodeId: fallbackEdge.target }
      }

      // Tentar edge de saída padrão
      const defaultEdge = findOutgoingEdge(flow.edges, currentNode.id)
      if (defaultEdge) {
        return { success: true, nextNodeId: defaultEdge.target }
      }

      // Nenhuma transição encontrada - ficar no mesmo nó
      return { success: true }
    }

    case 'menu': {
      // Para menus, verificar se a resposta corresponde a uma opção
      const menuData = currentNode.data as { options?: Array<{ id: string; value: string }> }
      const options = menuData.options || []

      // Tentar match por button_id, list_id ou texto
      const userInput = incomingMessage.buttonId ||
        incomingMessage.listId ||
        incomingMessage.text?.toLowerCase()

      const matchedOption = options.find(opt =>
        opt.id === userInput ||
        opt.value.toLowerCase() === userInput ||
        opt.id.toLowerCase() === userInput
      )

      if (matchedOption) {
        // Buscar edge que sai deste nó com este handle
        const edge = findEdgeBySourceHandle(flow.edges, currentNode.id, matchedOption.id)
        if (edge) {
          return { success: true, nextNodeId: edge.target }
        }
      }

      // Se não encontrou opção válida, buscar fallback edge
      const fallbackEdge = findEdgeBySourceHandle(flow.edges, currentNode.id, 'fallback')
      if (fallbackEdge) {
        return { success: true, nextNodeId: fallbackEdge.target }
      }

      // Nenhuma transição encontrada - ficar no mesmo nó
      return { success: true }
    }

    case 'input': {
      // Para input, salvar o valor e seguir para próximo nó
      const inputData = currentNode.data as { variableName?: string }

      if (inputData.variableName && incomingMessage.text) {
        await stateManager.setVariable(
          state.conversationId,
          inputData.variableName,
          incomingMessage.text
        )
      }

      // Buscar próximo nó
      const edge = findOutgoingEdge(flow.edges, currentNode.id)
      if (edge) {
        return { success: true, nextNodeId: edge.target }
      }

      return { success: true }
    }

    default:
      // Para outros tipos, buscar transição padrão
      const edge = findOutgoingEdge(flow.edges, currentNode.id)
      if (edge) {
        return { success: true, nextNodeId: edge.target }
      }
      return { success: true }
  }
}

// =============================================================================
// NODE HANDLERS
// =============================================================================

function handleStartNode(node: FlowNode, flow: Flow, context: ExecutionContext): ExecutionResult {
  // Start node apenas segue para o próximo nó
  const edge = findOutgoingEdge(flow.edges, node.id)

  if (edge) {
    return { success: true, nextNodeId: edge.target }
  }

  return { success: true }
}

function handleMessageNode(node: FlowNode, variables: Record<string, string>, flow: Flow, context: ExecutionContext): ExecutionResult {
  const data = node.data as { text?: string }

  if (!data.text) {
    return { success: false, error: 'Message node has no text' }
  }

  // Substituir variáveis no texto
  const processedText = processText(data.text, variables, {
    contactPhone: context.recipientPhone,
  })

  // Criar mensagem para enviar
  const message: WhatsAppMessage = {
    type: 'text',
    payload: {
      messaging_product: 'whatsapp',
      to: context.recipientPhone,
      type: 'text',
      text: { body: processedText }
    }
  }

  // Buscar próximo nó
  const edge = findOutgoingEdge(flow.edges, node.id)

  return {
    success: true,
    messages: [message],
    nextNodeId: edge?.target,
  }
}

function handleMenuNode(node: FlowNode, variables: Record<string, string>): ExecutionResult {
  const data = node.data as {
    text?: string
    header?: string
    footer?: string
    options?: Array<{ id: string; label: string; value: string; description?: string }>
  }

  if (!data.text || !data.options?.length) {
    return { success: false, error: 'Menu node has no text or options' }
  }

  // Substituir variáveis
  const processedText = processText(data.text, variables)

  // Determinar tipo de menu (botões se <= 3 opções, lista se > 3)
  const useButtons = data.options.length <= 3

  let message: WhatsAppMessage

  if (useButtons) {
    message = {
      type: 'interactive',
      payload: {
        messaging_product: 'whatsapp',
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: processedText },
          action: {
            buttons: data.options.map(opt => ({
              type: 'reply',
              reply: {
                id: opt.id,
                title: opt.label.substring(0, 20), // Max 20 chars
              }
            }))
          }
        }
      }
    }
  } else {
    message = {
      type: 'interactive',
      payload: {
        messaging_product: 'whatsapp',
        type: 'interactive',
        interactive: {
          type: 'list',
          body: { text: processedText },
          action: {
            button: 'Ver opções',
            sections: [{
              title: 'Opções',
              rows: data.options.map(opt => ({
                id: opt.id,
                title: opt.label.substring(0, 24), // Max 24 chars
                description: opt.description?.substring(0, 72), // Max 72 chars
              }))
            }]
          }
        }
      }
    }
  }

  // Menu não tem próximo nó automático - espera resposta do usuário
  return {
    success: true,
    messages: [message],
  }
}

function handleInputNode(node: FlowNode, variables: Record<string, string>): ExecutionResult {
  const data = node.data as {
    prompt?: string
    variableName?: string
    validationType?: string
  }

  if (!data.prompt) {
    return { success: false, error: 'Input node has no prompt' }
  }

  // Substituir variáveis no prompt
  const processedPrompt = processText(data.prompt, variables)

  const message: WhatsAppMessage = {
    type: 'text',
    payload: {
      messaging_product: 'whatsapp',
      type: 'text',
      text: { body: processedPrompt }
    }
  }

  // Input espera resposta do usuário
  return {
    success: true,
    messages: [message],
    collectInput: {
      variableName: data.variableName || 'input',
      validationType: data.validationType || 'text',
    }
  }
}

function handleConditionNode(node: FlowNode, variables: Record<string, string>, flow: Flow): ExecutionResult {
  const data = node.data as {
    conditions?: Array<{
      id: string
      variable: string
      operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte'
      value: string
    }>
  }

  if (!data.conditions?.length) {
    // Se não tem condições, seguir para fallback/else
    const elseEdge = findEdgeBySourceHandle(flow.edges, node.id, 'else')
    return { success: true, nextNodeId: elseEdge?.target }
  }

  // Avaliar condições em ordem
  for (const condition of data.conditions) {
    const varValue = variables[condition.variable] || ''
    const conditionValue = condition.value

    let matches = false

    switch (condition.operator) {
      case 'equals':
        matches = varValue.toLowerCase() === conditionValue.toLowerCase()
        break
      case 'contains':
        matches = varValue.toLowerCase().includes(conditionValue.toLowerCase())
        break
      case 'startsWith':
        matches = varValue.toLowerCase().startsWith(conditionValue.toLowerCase())
        break
      case 'endsWith':
        matches = varValue.toLowerCase().endsWith(conditionValue.toLowerCase())
        break
      case 'gt': {
        const numA = parseFloat(varValue)
        const numB = parseFloat(conditionValue)
        matches = !isNaN(numA) && !isNaN(numB) && numA > numB
        break
      }
      case 'lt': {
        const numA = parseFloat(varValue)
        const numB = parseFloat(conditionValue)
        matches = !isNaN(numA) && !isNaN(numB) && numA < numB
        break
      }
      case 'gte': {
        const numA = parseFloat(varValue)
        const numB = parseFloat(conditionValue)
        matches = !isNaN(numA) && !isNaN(numB) && numA >= numB
        break
      }
      case 'lte': {
        const numA = parseFloat(varValue)
        const numB = parseFloat(conditionValue)
        matches = !isNaN(numA) && !isNaN(numB) && numA <= numB
        break
      }
    }

    if (matches) {
      const edge = findEdgeBySourceHandle(flow.edges, node.id, condition.id)
      if (edge) {
        return { success: true, nextNodeId: edge.target }
      }
    }
  }

  // Nenhuma condição foi satisfeita - ir para else
  const elseEdge = findEdgeBySourceHandle(flow.edges, node.id, 'else')
  return { success: true, nextNodeId: elseEdge?.target }
}

function handleDelayNode(node: FlowNode, flow: Flow): ExecutionResult {
  const data = node.data as { delaySeconds?: number }

  // Para delay, retornamos informação mas não bloqueamos
  // O caller deve agendar via QStash

  const edge = findOutgoingEdge(flow.edges, node.id)

  return {
    success: true,
    nextNodeId: edge?.target,
    // Nota: delaySeconds seria usado pelo caller para agendar
  }
}

function handleTemplateNode(
  node: FlowNode,
  variables: Record<string, string>,
  flow: Flow,
  context: ExecutionContext
): ExecutionResult {
  const data = node.data as {
    templateName?: string
    templateId?: string
    language?: string
    category?: string
    headerVariables?: Array<{ name: string; value: string; type: string }>
    bodyVariables?: Array<{ name: string; value: string; type: string }>
    buttonVariables?: Array<{ name: string; value: string; type: string }>
    buttons?: Array<{ id: string; type: string; text: string }>
  }

  if (!data.templateName) {
    return { success: false, error: 'Template node has no template selected' }
  }

  // Construir componentes do template
  const components: Array<{
    type: string
    parameters?: Array<{ type: string; text?: string; image?: { id?: string; link?: string } }>
    sub_type?: string
    index?: string
  }> = []

  // Header variables
  if (data.headerVariables && data.headerVariables.length > 0) {
    const headerParams = data.headerVariables.map(v => {
      const value = v.type === 'variable'
        ? (variables[v.value] || v.value)
        : processText(v.value, variables, { contactPhone: context.recipientPhone })
      return { type: 'text', text: value }
    })
    components.push({ type: 'header', parameters: headerParams })
  }

  // Body variables
  if (data.bodyVariables && data.bodyVariables.length > 0) {
    const bodyParams = data.bodyVariables.map(v => {
      const value = v.type === 'variable'
        ? (variables[v.value] || v.value)
        : processText(v.value, variables, { contactPhone: context.recipientPhone })
      return { type: 'text', text: value }
    })
    components.push({ type: 'body', parameters: bodyParams })
  }

  // Criar payload do template WhatsApp
  const message: WhatsAppMessage = {
    type: 'template',
    payload: {
      messaging_product: 'whatsapp',
      to: context.recipientPhone,
      type: 'template',
      template: {
        name: data.templateName,
        language: { code: data.language || 'pt_BR' },
        components: components.length > 0 ? components : undefined,
      }
    }
  }

  // Verificar se template tem botões de resposta (QUICK_REPLY)
  // Se tiver, deve PARAR e esperar a resposta do usuário (como menu)
  const hasQuickReplyButtons = data.buttons?.some(b =>
    b.type === 'QUICK_REPLY' || b.type === 'quick_reply'
  )

  if (hasQuickReplyButtons) {
    // Template com botões de resposta rápida: parar e esperar resposta
    // Similar ao comportamento do menu
    return {
      success: true,
      messages: [message],
      // NÃO definir nextNodeId - esperar resposta do usuário
    }
  }

  // Template sem botões de resposta: seguir para próximo nó automaticamente
  const edge = findOutgoingEdge(flow.edges, node.id)

  return {
    success: true,
    messages: [message],
    nextNodeId: edge?.target,
  }
}

async function handleHandoffNode(node: FlowNode, conversationId: string): Promise<ExecutionResult> {
  // Transferir conversa para atendente humano
  await stateManager.updateStatus(conversationId, 'paused')

  const data = node.data as { message?: string }
  const messages: WhatsAppMessage[] = []

  if (data.message) {
    messages.push({
      type: 'text',
      payload: {
        messaging_product: 'whatsapp',
        type: 'text',
        text: { body: data.message }
      }
    })
  }

  return {
    success: true,
    messages,
    // Não tem próximo nó - conversa foi transferida
  }
}

async function handleEndNode(node: FlowNode, conversationId: string): Promise<ExecutionResult> {
  // Encerrar conversa
  await stateManager.endConversation(conversationId)

  const data = node.data as { message?: string }
  const messages: WhatsAppMessage[] = []

  if (data.message) {
    messages.push({
      type: 'text',
      payload: {
        messaging_product: 'whatsapp',
        type: 'text',
        text: { body: data.message }
      }
    })
  }

  return {
    success: true,
    messages,
    endConversation: true,
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function findStartNode(nodes: FlowNode[]): FlowNode | undefined {
  return nodes.find(n => n.type === 'start')
}

function findOutgoingEdge(edges: FlowEdge[], sourceId: string): FlowEdge | undefined {
  return edges.find(e => e.source === sourceId)
}

function findEdgeBySourceHandle(edges: FlowEdge[], sourceId: string, handle: string): FlowEdge | undefined {
  return edges.find(e => e.source === sourceId && e.sourceHandle === handle)
}

/**
 * Executa o fluxo completo desde o início para uma nova mensagem
 */
export async function processIncomingMessage(
  botId: string,
  phoneNumberId: string,
  accessToken: string,
  recipientPhone: string,
  message: {
    type: 'text' | 'button_reply' | 'list_reply' | 'interactive'
    text?: string
    buttonId?: string
    listId?: string
  }
): Promise<ExecutionResult> {
  // 1. Obter ou criar estado da conversa
  const state = await stateManager.getOrCreateState(botId, phoneNumberId, recipientPhone)

  // 2. Verificar se conversa está pausada (takeover humano)
  if (state.status === 'paused') {
    return { success: true } // Não processar - está com humano
  }

  // 3. Buscar fluxo principal do bot
  const flow = await stateManager.getMainFlow(botId)
  if (!flow) {
    return { success: false, error: 'Bot does not have a published flow' }
  }

  // 4. Executar passo do fluxo
  const context: ExecutionContext = {
    state,
    flow,
    phoneNumberId,
    accessToken,
    recipientPhone,
    incomingMessage: message,
  }

  let result = await executeStep(context)

  // 5. Continuar executando enquanto houver próximo nó sem esperar input
  while (result.success && result.nextNodeId && !result.collectInput && !result.endConversation) {
    // Atualizar estado
    await stateManager.updateCurrentNode(state.conversationId, result.nextNodeId)

    // Atualizar contexto com novo nó
    const updatedState = { ...state, currentNodeId: result.nextNodeId }
    const newContext: ExecutionContext = {
      ...context,
      state: updatedState,
      incomingMessage: undefined, // Limpar para execução automática
    }

    const nextResult = await executeStep(newContext)

    // Acumular mensagens
    if (result.messages && nextResult.messages) {
      result.messages = [...result.messages, ...nextResult.messages]
    } else if (nextResult.messages) {
      result.messages = nextResult.messages
    }

    // Atualizar resultado
    result = {
      ...result,
      nextNodeId: nextResult.nextNodeId,
      collectInput: nextResult.collectInput,
      endConversation: nextResult.endConversation,
      error: nextResult.error,
    }

    // Se não teve sucesso, parar
    if (!nextResult.success) {
      result.success = false
      break
    }
  }

  return result
}

// =============================================================================
// FLOW EXECUTOR CLASS
// =============================================================================

interface IncomingMessage {
  content: string
  buttonId?: string
  listId?: string
  from: string
  messageId: string
}

/**
 * Classe wrapper para executar fluxos de bot
 * Usada pelo webhook para processar mensagens incoming
 */
export class FlowExecutor {
  private flow: Flow
  private conversationId: string
  private botId: string
  private phoneNumberId: string

  constructor(
    flow: Flow,
    conversationId: string,
    botId: string,
    phoneNumberId: string
  ) {
    this.flow = flow
    this.conversationId = conversationId
    this.botId = botId
    this.phoneNumberId = phoneNumberId
  }

  /**
   * Processa uma mensagem incoming e executa o fluxo
   */
  async processMessage(message: IncomingMessage): Promise<void> {
    // Buscar access token das configurações
    const accessToken = await this.getAccessToken()

    // Determinar tipo de mensagem
    let messageType: 'text' | 'button_reply' | 'list_reply' | 'interactive' = 'text'
    if (message.buttonId) {
      messageType = 'button_reply'
    } else if (message.listId) {
      messageType = 'list_reply'
    }

    // Executar fluxo
    const result = await processIncomingMessage(
      this.botId,
      this.phoneNumberId,
      accessToken,
      message.from,
      {
        type: messageType,
        text: message.content,
        buttonId: message.buttonId,
        listId: message.listId,
      }
    )

    // Enviar mensagens resultantes
    if (result.messages && result.messages.length > 0) {
      await this.sendMessages(result.messages, message.from, accessToken)
    }

    if (!result.success && result.error) {
      console.error(`Flow execution error: ${result.error}`)
    }
  }

  /**
   * Busca o access token do WhatsApp Business
   */
  /**
   * Busca o access token do WhatsApp Business
   */
  private async getAccessToken(): Promise<string> {
    try {
      // Use the settingsDb from supabase-db
      const setting = await settingsDb.get('whatsapp_access_token')

      if (setting) {
        return setting
      }

      // Fallback para variável de ambiente
      return process.env.WHATSAPP_ACCESS_TOKEN || ''
    } catch {
      return process.env.WHATSAPP_ACCESS_TOKEN || ''
    }
  }

  /**
   * Envia mensagens via WhatsApp API
   */
  private async sendMessages(
    messages: WhatsAppMessage[],
    to: string,
    accessToken: string
  ): Promise<void> {
    const baseUrl = `https://graph.facebook.com/v24.0/${this.phoneNumberId}/messages`

    for (const message of messages) {
      try {
        // Adicionar destinatário ao payload
        const payload = {
          ...message.payload,
          to,
        }

        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const error = await response.json()
          console.error('WhatsApp API error:', error)
        } else {
          console.log(`✅ Message sent to ${to}`)
        }
      } catch (error) {
        console.error('Failed to send message:', error)
      }
    }
  }
}
