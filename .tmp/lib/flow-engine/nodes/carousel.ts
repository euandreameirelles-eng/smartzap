/**
 * Carousel Node Executor
 * 
 * Envia um carrossel de mídia ao usuário.
 * Suporta substituição de variáveis nos textos.
 */

import type { FlowNode, FlowEdge } from '@/types'
import type { NodeExecutor, ExecutionContext, NodeExecutionResult, WhatsAppMessagePayload, ValidationResult } from './base'
import { processText } from '../variables'

// Carousel node data type (suporta ambos formatos: Flow Engine e Workflow Builder)
export interface CarouselNodeData {
  bodyText?: string  // Texto opcional antes do carrossel
  cards: Array<{
    // Flow Engine format
    headerType?: 'image' | 'video'
    mediaId?: string
    mediaUrl?: string
    bodyText?: string
    buttonText?: string
    buttonUrl?: string
    // Workflow Builder format
    id?: string
    imageUrl?: string
    title?: string
    description?: string
  }>
}

export interface CarouselNodeResult {
  success: boolean
  nextNodeId?: string
  messages?: WhatsAppMessagePayload[]
  error?: string
}

export const carouselNodeExecutor: NodeExecutor<CarouselNodeData> = {
  type: 'carousel',

  async execute(
    context: ExecutionContext,
    node: FlowNode & { data: CarouselNodeData }
  ): Promise<NodeExecutionResult> {
    const { variables, contactPhone, edges } = context
    const data = node.data

    if (!data.cards || data.cards.length < 2) {
      return {
        success: false,
        error: 'Carrossel precisa ter pelo menos 2 cards'
      }
    }

    if (data.cards.length > 10) {
      return {
        success: false,
        error: 'Carrossel não pode ter mais de 10 cards'
      }
    }

    // Determinar tipo de header (image é padrão para workflow builder)
    const firstCard = data.cards[0]
    const headerType = firstCard.headerType || (firstCard.imageUrl ? 'image' : 'video')

    // Processar cards com substituição de variáveis
    // Suporta ambos formatos: Flow Engine (mediaUrl, bodyText) e Workflow Builder (imageUrl, title+description)
    const processedCards = data.cards
      .filter(card => {
        // Filtrar cards sem mídia (obrigatório)
        const hasMedia = card.mediaUrl || card.imageUrl || card.mediaId
        return hasMedia
      })
      .map((card, index) => {
        // Determinar URL da mídia (aceitar ambos formatos)
        const rawMediaUrl = card.mediaUrl || card.imageUrl || ''
        const processedUrl = rawMediaUrl
          ? processText(rawMediaUrl, variables, { contactPhone })
          : undefined

        // Determinar texto do body (aceitar ambos formatos)
        // Workflow builder pode usar title + description, Flow Engine usa bodyText
        const rawBodyText = card.bodyText ||
          (card.title && card.description ? `*${card.title}*\n${card.description}` :
            card.title || card.description || 'Ver detalhes')

        // Determinar texto e URL do botão
        // URL vazia usa '#' como fallback (válido para API WhatsApp)
        const rawButtonText = card.buttonText || 'Ver mais'
        const rawButtonUrl = card.buttonUrl || '#'

        return {
          card_index: index,
          type: 'cta_url' as const,
          header: {
            type: (card.headerType || headerType) as 'image' | 'video',
            [card.headerType || headerType]: card.mediaId
              ? { id: card.mediaId }
              : { link: processedUrl }
          },
          body: {
            text: processText(rawBodyText, variables, { contactPhone })
          },
          action: {
            name: 'cta_url' as const,
            parameters: {
              display_text: processText(rawButtonText, variables, { contactPhone }),
              url: processText(rawButtonUrl, variables, { contactPhone })
            }
          },
        }
      })

    // Texto do body principal do carrossel
    const mainBodyText = data.bodyText
      ? processText(data.bodyText, variables, { contactPhone })
      : 'Confira as opções:'

    // Construir payload WhatsApp - formato correto conforme documentação
    const payload: WhatsAppMessagePayload = {
      type: 'interactive',
      payload: {
        type: 'interactive',
        interactive: {
          type: 'carousel',
          body: {
            text: mainBodyText
          },
          action: {
            cards: processedCards
          }
        }
      }
    }

    // Buscar próximo nó
    const outgoingEdge = edges.find(e => e.source === node.id)

    return {
      success: true,
      messages: [payload],
      nextNodeId: outgoingEdge?.target,
    }
  },

  validate(node: FlowNode & { data: CarouselNodeData }, edges: FlowEdge[]): ValidationResult {
    const errors: string[] = []
    const data = node.data

    // Verificar quantidade de cards
    if (!data.cards || data.cards.length < 2) {
      errors.push('Carrossel precisa ter pelo menos 2 cards')
    } else if (data.cards.length > 10) {
      errors.push('Carrossel não pode ter mais de 10 cards')
    }

    if (data.cards && data.cards.length >= 2) {
      // Verificar se todos têm o mesmo tipo
      const headerType = data.cards[0].headerType
      const allSameType = data.cards.every(card => card.headerType === headerType)
      if (!allSameType) {
        errors.push('Todos os cards devem ter o mesmo tipo de header')
      }

      // Verificar cada card
      data.cards.forEach((card, index) => {
        if (!card.mediaId && !card.mediaUrl) {
          errors.push(`Card ${index + 1}: precisa ter mídia configurada`)
        }
        if (!card.bodyText || card.bodyText.trim() === '') {
          errors.push(`Card ${index + 1}: precisa ter texto do body`)
        }
        if (!card.buttonText || card.buttonText.trim() === '') {
          errors.push(`Card ${index + 1}: precisa ter texto do botão`)
        }
        if (!card.buttonUrl || card.buttonUrl.trim() === '') {
          errors.push(`Card ${index + 1}: precisa ter URL do botão`)
        }
      })
    }

    // Verificar se tem saída
    const hasOutput = edges.some(e => e.source === node.id)
    if (!hasOutput) {
      errors.push('Nó de carrossel precisa estar conectado a outro nó')
    }

    return { valid: errors.length === 0, errors }
  }
}

// Legacy exports for backwards compatibility
export function handleCarouselNode(
  node: FlowNode,
  edges: FlowEdge[],
  variables: Record<string, string>,
  recipientPhone: string
) {
  // Build minimal context for legacy usage
  const context: ExecutionContext = {
    executionId: '',
    flowId: '',
    mode: 'campaign',
    contactPhone: recipientPhone,
    nodes: [],
    edges,
    currentNodeId: node.id,
    variables,
    phoneNumberId: '',
    accessToken: '',
    sendMessage: async () => ({ success: true }),
    setVariable: async () => { },
    log: () => { },
  }

  return carouselNodeExecutor.execute(context, node as FlowNode & { data: CarouselNodeData })
}

export function validateCarouselNode(node: FlowNode, edges: FlowEdge[]): string[] {
  const result = carouselNodeExecutor.validate!(node as FlowNode & { data: CarouselNodeData }, edges)
  return result.errors || []
}
