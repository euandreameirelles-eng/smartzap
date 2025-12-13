/**
 * Buttons Node Executor
 * 
 * Envia uma mensagem com até 3 botões de resposta rápida.
 * WhatsApp limita a 3 botões para Reply Buttons.
 */

import type { FlowNode, FlowEdge } from '@/types'
import type { NodeExecutor, ExecutionContext, NodeExecutionResult, WhatsAppMessagePayload, ValidationResult } from './base'
import { processText } from '../variables'

// Button option type (suporta ambos formatos: workflow builder e Flow Engine)
export interface ButtonOption {
  id: string
  label?: string  // Flow Engine format
  title?: string  // Workflow Builder format
}

// Buttons node data type (suporta ambos formatos)
export interface ButtonsNodeData {
  text?: string    // Flow Engine format
  body?: string    // Workflow Builder format
  header?: string
  footer?: string
  buttons: ButtonOption[]
}

export const buttonsNodeExecutor: NodeExecutor<ButtonsNodeData> = {
  type: 'buttons',

  async execute(
    context: ExecutionContext,
    node: FlowNode & { data: ButtonsNodeData }
  ): Promise<NodeExecutionResult> {
    const { variables, contactPhone, edges } = context
    const data = node.data

    // Suportar tanto 'text' (Flow Engine) quanto 'body' (Workflow Builder)
    const bodyText = data.text || data.body

    if (!bodyText) {
      return {
        success: false,
        error: 'Nó de botões não tem texto configurado'
      }
    }

    if (!data.buttons || data.buttons.length === 0) {
      return {
        success: false,
        error: 'Nó de botões não tem botões configurados'
      }
    }

    if (data.buttons.length > 3) {
      return {
        success: false,
        error: 'Nó de botões pode ter no máximo 3 botões (use List para mais opções)'
      }
    }

    // Substituir variáveis
    const processedText = processText(bodyText, variables, { contactPhone })
    const processedHeader = data.header ? processText(data.header, variables, { contactPhone }) : undefined
    const processedFooter = data.footer ? processText(data.footer, variables, { contactPhone }) : undefined

    // Construir payload WhatsApp - formato correto para API: type='interactive' com objeto 'interactive'
    const payload: WhatsAppMessagePayload = {
      type: 'interactive',
      payload: {
        type: 'interactive',
        interactive: {
          type: 'button',
          header: processedHeader ? { type: 'text', text: processedHeader } : undefined,
          body: { text: processedText },
          footer: processedFooter ? { text: processedFooter } : undefined,
          action: {
            buttons: data.buttons.map(btn => ({
              type: 'reply',
              reply: {
                id: btn.id,
                title: (btn.label || btn.title || '').substring(0, 20), // Max 20 chars
              }
            }))
          }
        }
      }
    }

    // Não avança automaticamente - espera resposta do usuário
    return {
      success: true,
      messages: [payload],
      collectInput: {
        variableName: `button_${node.id}`,
      },
    }
  },

  async processResponse(
    context: ExecutionContext,
    node: FlowNode & { data: ButtonsNodeData }
  ): Promise<string | undefined> {
    const { incomingMessage, edges } = context

    if (!incomingMessage) return undefined

    const data = node.data
    const buttons = data.buttons || []

    // Input do usuário
    const input = (incomingMessage.buttonId || incomingMessage.text || '').toLowerCase()

    // Tentar match por ID, label ou title (suportar ambos formatos)
    const matchedButton = buttons.find(btn => {
      const buttonLabel = (btn.label || btn.title || '').toLowerCase()
      return btn.id.toLowerCase() === input || buttonLabel === input
    })

    if (matchedButton) {
      // Buscar edge que sai com o handle do button ID
      const edge = edges.find(e =>
        e.source === node.id &&
        e.sourceHandle === matchedButton.id
      )

      if (edge) return edge.target
    }

    // Buscar fallback edge
    const fallbackEdge = edges.find(e =>
      e.source === node.id &&
      e.sourceHandle === 'fallback'
    )

    return fallbackEdge?.target
  },

  validate(node: FlowNode & { data: ButtonsNodeData }, edges: FlowEdge[]): ValidationResult {
    const errors: string[] = []
    const data = node.data

    // Suportar tanto 'text' quanto 'body'
    const bodyText = data.text || data.body
    if (!bodyText || bodyText.trim() === '') {
      errors.push('Nó de botões precisa ter um texto configurado')
    }

    if (!data.buttons || data.buttons.length === 0) {
      errors.push('Nó de botões precisa ter pelo menos um botão')
    } else if (data.buttons.length > 3) {
      errors.push('Nó de botões pode ter no máximo 3 botões')
    }

    // Verificar cada botão (suportar tanto 'label' quanto 'title')
    data.buttons?.forEach((btn, index) => {
      if (!btn.id) {
        errors.push(`Botão ${index + 1}: precisa ter um ID`)
      }
      const buttonLabel = btn.label || btn.title
      if (!buttonLabel || buttonLabel.trim() === '') {
        errors.push(`Botão ${index + 1}: precisa ter um texto`)
      }
      if (buttonLabel && buttonLabel.length > 20) {
        errors.push(`Botão ${index + 1}: texto excede 20 caracteres`)
      }

      // Verificar se botão tem edge - tentar também formato 'button_' do workflow builder
      const hasEdge = edges.some(e =>
        e.source === node.id &&
        (e.sourceHandle === btn.id || e.sourceHandle === `button_${btn.id}`)
      )

      if (!hasEdge) {
        errors.push(`Botão "${buttonLabel}" não está conectado a nenhum nó`)
      }
    })

    return { valid: errors.length === 0, errors }
  }
}

// Legacy exports for backwards compatibility
export function handleButtonsNode(
  node: FlowNode,
  variables: Record<string, string>,
  recipientPhone: string
) {
  // Build minimal context for legacy usage
  const context: ExecutionContext = {
    executionId: '',
    flowId: '',
    mode: 'chatbot',
    contactPhone: recipientPhone,
    nodes: [],
    edges: [],
    currentNodeId: node.id,
    variables,
    phoneNumberId: '',
    accessToken: '',
    sendMessage: async () => ({ success: true }),
    setVariable: async () => { },
    log: () => { },
  }

  return buttonsNodeExecutor.execute(context, node as FlowNode & { data: ButtonsNodeData })
}

export function validateButtonsNode(node: FlowNode, edges: FlowEdge[]): string[] {
  const result = buttonsNodeExecutor.validate!(node as FlowNode & { data: ButtonsNodeData }, edges)
  return result.errors || []
}
