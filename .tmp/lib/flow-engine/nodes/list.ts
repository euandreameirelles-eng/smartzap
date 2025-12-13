/**
 * List Node Executor
 * 
 * Envia uma mensagem com lista de opções organizadas em seções.
 * WhatsApp permite até 10 seções com até 10 itens cada.
 */

import type { FlowNode, FlowEdge } from '@/types'
import type { NodeExecutor, ExecutionContext, NodeExecutionResult, WhatsAppMessagePayload, ValidationResult } from './base'
import { processText } from '../variables'

// List item type
export interface ListItem {
  id: string
  title: string
  description?: string
}

// List section type
export interface ListSection {
  title?: string
  items: ListItem[]
}

// List node data type (suporta ambos formatos: Flow Engine e Workflow Builder)
export interface ListNodeData {
  // Flow Engine format
  text?: string
  sections?: ListSection[]
  // Workflow Builder format
  body?: string
  items?: ListItem[]
  // Common fields
  header?: string
  footer?: string
  buttonText?: string
}

export const listNodeExecutor: NodeExecutor<ListNodeData> = {
  type: 'list',

  async execute(
    context: ExecutionContext,
    node: FlowNode & { data: ListNodeData }
  ): Promise<NodeExecutionResult> {
    const { variables, contactPhone, edges } = context
    const data = node.data

    // Aceitar ambos formatos: text (Flow Engine) ou body (Workflow Builder)
    const rawText = data.text || data.body
    if (!rawText) {
      return {
        success: false,
        error: 'Nó de lista não tem texto configurado'
      }
    }

    // Aceitar ambos formatos: sections (Flow Engine) ou items (Workflow Builder)
    // Workflow Builder salva "items" diretamente, Flow Engine usa "sections[].items"
    let sections: ListSection[]

    if (data.sections && data.sections.length > 0) {
      // Flow Engine format
      sections = data.sections
    } else if (data.items && data.items.length > 0) {
      // Workflow Builder format - converter para uma seção única
      sections = [{
        title: 'Opções',
        items: data.items
      }]
    } else {
      return {
        success: false,
        error: 'Nó de lista não tem itens configurados'
      }
    }

    if (sections.length > 10) {
      return {
        success: false,
        error: 'Nó de lista pode ter no máximo 10 seções'
      }
    }

    // Validar quantidade de itens por seção
    for (const section of sections) {
      if (section.items && section.items.length > 10) {
        return {
          success: false,
          error: `Seção "${section.title}" tem mais de 10 itens`
        }
      }
    }

    // Substituir variáveis
    const processedText = processText(rawText, variables, { contactPhone })
    const processedHeader = data.header ? processText(data.header, variables, { contactPhone }) : undefined
    const processedFooter = data.footer ? processText(data.footer, variables, { contactPhone }) : undefined
    const processedButtonText = data.buttonText ? processText(data.buttonText, variables, { contactPhone }) : 'Ver opções'

    // Construir payload WhatsApp - formato correto conforme documentação
    const payload: WhatsAppMessagePayload = {
      type: 'interactive',
      payload: {
        type: 'interactive',
        interactive: {
          type: 'list',
          header: processedHeader ? { type: 'text', text: processedHeader } : undefined,
          body: { text: processedText },
          footer: processedFooter ? { text: processedFooter } : undefined,
          action: {
            button: processedButtonText.substring(0, 20), // Max 20 chars
            sections: sections.map(section => ({
              title: (section.title || 'Opções').substring(0, 24), // Max 24 chars
              rows: section.items.map(item => ({
                id: item.id,
                title: item.title.substring(0, 24), // Max 24 chars
                description: item.description?.substring(0, 72), // Max 72 chars
              }))
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
        variableName: `list_${node.id}`,
      },
    }
  },

  async processResponse(
    context: ExecutionContext,
    node: FlowNode & { data: ListNodeData }
  ): Promise<string | undefined> {
    const { incomingMessage, edges } = context

    if (!incomingMessage) return undefined

    const data = node.data

    // Aceitar ambos formatos: sections ou items
    let allItems: ListItem[]
    if (data.sections && data.sections.length > 0) {
      allItems = data.sections.flatMap(s => s.items || [])
    } else if (data.items && data.items.length > 0) {
      allItems = data.items
    } else {
      return undefined
    }

    // Input do usuário
    const input = (incomingMessage.listId || incomingMessage.text || '').toLowerCase()

    // Tentar match por ID ou title
    const matchedItem = allItems.find(item =>
      item.id.toLowerCase() === input ||
      item.title.toLowerCase() === input
    )

    if (matchedItem) {
      // Tentar buscar edge pelo ID direto
      let edge = edges.find(e =>
        e.source === node.id &&
        e.sourceHandle === matchedItem.id
      )

      // Fallback: tentar com prefixo 'item_' (formato do workflow builder)
      if (!edge) {
        edge = edges.find(e =>
          e.source === node.id &&
          e.sourceHandle === `item_${matchedItem.id}`
        )
      }

      if (edge) return edge.target
    }

    // Buscar fallback edge
    const fallbackEdge = edges.find(e =>
      e.source === node.id &&
      e.sourceHandle === 'fallback'
    )

    return fallbackEdge?.target
  },

  validate(node: FlowNode & { data: ListNodeData }, edges: FlowEdge[]): ValidationResult {
    const errors: string[] = []
    const data = node.data

    if (!data.text || data.text.trim() === '') {
      errors.push('Nó de lista precisa ter um texto configurado')
    }

    if (!data.buttonText || data.buttonText.trim() === '') {
      errors.push('Nó de lista precisa ter texto do botão configurado')
    } else if (data.buttonText.length > 20) {
      errors.push('Texto do botão da lista excede 20 caracteres')
    }

    if (!data.sections || data.sections.length === 0) {
      errors.push('Nó de lista precisa ter pelo menos uma seção')
    } else if (data.sections.length > 10) {
      errors.push('Nó de lista pode ter no máximo 10 seções')
    }

    // Verificar cada seção
    data.sections?.forEach((section, sectionIndex) => {
      if (!section.title || section.title.trim() === '') {
        errors.push(`Seção ${sectionIndex + 1}: precisa ter um título`)
      } else if (section.title.length > 24) {
        errors.push(`Seção ${sectionIndex + 1}: título excede 24 caracteres`)
      }

      if (!section.items || section.items.length === 0) {
        errors.push(`Seção "${section.title}": precisa ter pelo menos um item`)
      } else if (section.items.length > 10) {
        errors.push(`Seção "${section.title}": pode ter no máximo 10 itens`)
      }

      // Verificar cada item
      section.items?.forEach((item, itemIndex) => {
        if (!item.id) {
          errors.push(`Item ${itemIndex + 1} da seção "${section.title}": precisa ter um ID`)
        }
        if (!item.title || item.title.trim() === '') {
          errors.push(`Item ${itemIndex + 1} da seção "${section.title}": precisa ter um título`)
        }
        if (item.title && item.title.length > 24) {
          errors.push(`Item "${item.title}": título excede 24 caracteres`)
        }
        if (item.description && item.description.length > 72) {
          errors.push(`Item "${item.title}": descrição excede 72 caracteres`)
        }

        // Verificar se item tem edge
        const hasEdge = edges.some(e =>
          e.source === node.id &&
          e.sourceHandle === item.id
        )

        if (!hasEdge) {
          errors.push(`Item "${item.title}" não está conectado a nenhum nó`)
        }
      })
    })

    return { valid: errors.length === 0, errors }
  }
}

// Legacy exports for backwards compatibility
export function handleListNode(
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

  return listNodeExecutor.execute(context, node as FlowNode & { data: ListNodeData })
}

export function validateListNode(node: FlowNode, edges: FlowEdge[]): string[] {
  const result = listNodeExecutor.validate!(node as FlowNode & { data: ListNodeData }, edges)
  return result.errors || []
}
