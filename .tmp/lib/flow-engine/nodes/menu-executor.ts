/**
 * Menu Node Executor (V3)
 * 
 * Apresenta opções ao usuário usando Reply Buttons ou List Message.
 * Aguarda resposta do usuário para determinar próximo nó.
 */

import type { FlowNode, FlowEdge, MenuNodeData } from '@/types'
import type {
  NodeExecutor,
  ExecutionContext,
  NodeExecutionResult,
  WhatsAppMessagePayload,
  ValidationResult
} from './base'
import { processText } from '../variables'
import { findEdgeByHandle } from './base'

// =============================================================================
// EXECUTOR
// =============================================================================

export const menuNodeExecutor: NodeExecutor<MenuNodeData> = {
  type: 'menu',

  async execute(
    context: ExecutionContext,
    node: FlowNode & { data: MenuNodeData }
  ): Promise<NodeExecutionResult> {
    const data = node.data

    if (!data.text) {
      return {
        success: false,
        error: 'Nó de menu não tem texto configurado',
      }
    }

    if (!data.options || data.options.length === 0) {
      return {
        success: false,
        error: 'Nó de menu não tem opções configuradas',
      }
    }

    // Processar variáveis
    const processedText = processText(data.text, context.variables)
    const processedHeader = data.header ? processText(data.header, context.variables) : undefined
    const processedFooter = data.footer ? processText(data.footer, context.variables) : undefined

    // Decidir entre buttons (até 3) ou list (4+)
    const useButtons = data.options.length <= 3

    let message: WhatsAppMessagePayload

    if (useButtons) {
      // Reply Buttons
      message = {
        type: 'interactive',
        payload: {
          messaging_product: 'whatsapp',
          to: context.contactPhone,
          type: 'interactive',
          interactive: {
            type: 'button',
            header: processedHeader ? { type: 'text', text: processedHeader } : undefined,
            body: { text: processedText },
            footer: processedFooter ? { text: processedFooter } : undefined,
            action: {
              buttons: data.options.slice(0, 3).map(opt => ({
                type: 'reply',
                reply: {
                  id: opt.id || opt.value,
                  title: opt.label.slice(0, 20),
                },
              })),
            },
          },
        },
      }
    } else {
      // List Message
      message = {
        type: 'interactive',
        payload: {
          messaging_product: 'whatsapp',
          to: context.contactPhone,
          type: 'interactive',
          interactive: {
            type: 'list',
            header: processedHeader ? { type: 'text', text: processedHeader } : undefined,
            body: { text: processedText },
            footer: processedFooter ? { text: processedFooter } : undefined,
            action: {
              button: 'Ver opções',
              sections: [{
                title: 'Opções',
                rows: data.options.slice(0, 10).map(opt => ({
                  id: opt.id || opt.value,
                  title: opt.label.slice(0, 24),
                  description: opt.description?.slice(0, 72),
                })),
              }],
            },
          },
        },
      }
    }

    // Menu sempre espera resposta do usuário
    return {
      success: true,
      messages: [message],
      pauseExecution: true, // Aguarda resposta
    }
  },

  /**
   * Processa resposta do usuário para determinar próximo nó
   */
  async processResponse(
    context: ExecutionContext,
    node: FlowNode & { data: MenuNodeData }
  ): Promise<string | undefined> {
    const { incomingMessage, edges } = context
    const data = node.data
    const options = data.options || []

    if (!incomingMessage) return undefined

    // Input do usuário (normalizado)
    const input = (
      incomingMessage.buttonId ||
      incomingMessage.listId ||
      incomingMessage.text || ''
    ).toLowerCase()

    // Match por ID ou label
    const matchedOption = options.find(opt =>
      (opt.id || opt.value).toLowerCase() === input ||
      opt.value?.toLowerCase() === input ||
      opt.label.toLowerCase() === input
    )

    if (matchedOption) {
      const optionId = matchedOption.id || matchedOption.value
      // Tentar buscar edge pelo ID direto
      let edge = findEdgeByHandle(edges, node.id, optionId)

      // Fallback: tentar com prefixo 'option_' (formato do workflow builder)
      if (!edge) {
        edge = findEdgeByHandle(edges, node.id, `option_${optionId}`)
      }

      if (edge) return edge.target
    }

    // Match por número (1, 2, 3...)
    const numericInput = parseInt(input, 10)
    if (!isNaN(numericInput) && numericInput > 0 && numericInput <= options.length) {
      const optionByNumber = options[numericInput - 1]
      const optionId = optionByNumber.id || optionByNumber.value

      // Tentar buscar edge pelo ID direto
      let edge = findEdgeByHandle(edges, node.id, optionId)

      // Fallback: tentar com prefixo 'option_'
      if (!edge) {
        edge = findEdgeByHandle(edges, node.id, `option_${optionId}`)
      }

      if (edge) return edge.target
    }

    // Fallback
    const fallbackEdge = findEdgeByHandle(edges, node.id, 'fallback')
    return fallbackEdge?.target
  },

  validate(node: FlowNode & { data: MenuNodeData }, edges: FlowEdge[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const data = node.data

    if (!data.text?.trim()) {
      errors.push('Nó de menu precisa ter um texto configurado')
    }

    if (!data.options || data.options.length === 0) {
      errors.push('Nó de menu precisa ter pelo menos uma opção')
    }

    if (data.options && data.options.length > 10) {
      errors.push('Nó de menu pode ter no máximo 10 opções')
    }

    // Verificar conexões das opções
    if (data.options) {
      for (const opt of data.options) {
        const hasEdge = edges.some(e =>
          e.source === node.id &&
          (e.sourceHandle === opt.id || e.sourceHandle === opt.value)
        )
        if (!hasEdge) {
          warnings.push(`Opção "${opt.label}" não está conectada`)
        }

        if (opt.label.length > 24) {
          errors.push(`Título da opção "${opt.label}" excede 24 caracteres`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  },
}
