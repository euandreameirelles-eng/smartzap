/**
 * CTA URL Node Executor
 * 
 * Envia uma mensagem com botão CTA que abre uma URL
 */

import type { FlowNode, FlowEdge } from '@/types'
import type { NodeExecutor, ExecutionContext, NodeExecutionResult, WhatsAppMessagePayload, ValidationResult } from './base'
import { processText } from '../variables'

// CTA URL node data type
export interface CtaUrlNodeData {
  text: string
  buttonText: string
  url: string
  header?: string
  footer?: string
}

export interface CtaUrlNodeResult {
  success: boolean
  messages?: WhatsAppMessagePayload[]
  error?: string
}

export const ctaUrlNodeExecutor: NodeExecutor<CtaUrlNodeData> = {
  type: 'cta_url',

  async execute(
    context: ExecutionContext,
    node: FlowNode & { data: CtaUrlNodeData }
  ): Promise<NodeExecutionResult> {
    const { variables, contactPhone, edges } = context
    const data = node.data

    if (!data.text) {
      return {
        success: false,
        error: 'Nó CTA URL não tem texto configurado'
      }
    }

    if (!data.buttonText) {
      return {
        success: false,
        error: 'Nó CTA URL não tem texto do botão configurado'
      }
    }

    if (!data.url) {
      return {
        success: false,
        error: 'Nó CTA URL não tem URL configurada'
      }
    }

    // Substituir variáveis no texto, botão e URL
    const processedText = processText(data.text, variables, { contactPhone })
    const processedButtonText = processText(data.buttonText, variables, { contactPhone })
    const processedUrl = processText(data.url, variables, { contactPhone })

    // Validar URL
    try {
      new URL(processedUrl)
    } catch {
      return {
        success: false,
        error: `URL inválida: ${processedUrl}`
      }
    }

    // Header opcional
    let header: { type: 'text'; text: string } | undefined
    if (data.header) {
      header = {
        type: 'text',
        text: processText(data.header, variables, { contactPhone })
      }
    }

    // Footer opcional
    const footer = data.footer ? processText(data.footer, variables, { contactPhone }) : undefined

    // Construir payload WhatsApp - formato correto conforme documentação
    const payload: WhatsAppMessagePayload = {
      type: 'interactive',
      payload: {
        type: 'interactive',
        interactive: {
          type: 'cta_url',
          header,
          body: { text: processedText },
          footer: footer ? { text: footer } : undefined,
          action: {
            name: 'cta_url',
            parameters: {
              display_text: processedButtonText.substring(0, 20), // Max 20 chars
              url: processedUrl,
            }
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

  validate(node: FlowNode & { data: CtaUrlNodeData }, edges: FlowEdge[]): ValidationResult {
    const errors: string[] = []
    const data = node.data

    if (!data.text || data.text.trim() === '') {
      errors.push('Nó CTA URL precisa ter um texto configurado')
    }

    if (!data.buttonText || data.buttonText.trim() === '') {
      errors.push('Nó CTA URL precisa ter texto do botão configurado')
    } else if (data.buttonText.length > 20) {
      errors.push('Texto do botão CTA não pode exceder 20 caracteres')
    }

    if (!data.url || data.url.trim() === '') {
      errors.push('Nó CTA URL precisa ter uma URL configurada')
    } else {
      try {
        new URL(data.url)
      } catch {
        // Pode ser uma URL com variáveis, ignorar validação estática
        if (!data.url.includes('{{')) {
          errors.push('URL configurada é inválida')
        }
      }
    }

    // Verificar conexão de saída
    const hasOutput = edges.some(e => e.source === node.id)
    if (!hasOutput) {
      errors.push('Nó CTA URL deve estar conectado a outro nó')
    }

    return { valid: errors.length === 0, errors }
  }
}

// Legacy exports for backwards compatibility
export function handleCtaUrlNode(
  node: FlowNode,
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
    edges: [],
    currentNodeId: node.id,
    variables,
    phoneNumberId: '',
    accessToken: '',
    sendMessage: async () => ({ success: true }),
    setVariable: async () => { },
    log: () => { },
  }

  return ctaUrlNodeExecutor.execute(context, node as FlowNode & { data: CtaUrlNodeData })
}

/**
 * Busca o próximo nó após CTA URL
 */
export function getNextNode(
  node: FlowNode,
  edges: FlowEdge[]
): string | null {
  const edge = edges.find(e => e.source === node.id)
  return edge?.target || null
}

export function validateCtaUrlNode(node: FlowNode, edges: FlowEdge[]): string[] {
  const result = ctaUrlNodeExecutor.validate!(node as FlowNode & { data: CtaUrlNodeData }, edges)
  return result.errors || []
}
