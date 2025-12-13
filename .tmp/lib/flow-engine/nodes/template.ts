/**
 * Template Node Executor
 * 
 * Executes WhatsApp template message nodes.
 * Templates are pre-approved message formats required for initiating
 * business-to-customer conversations.
 */

import type { FlowNode, FlowEdge } from '@/types'
import type { 
  NodeExecutor, 
  ExecutionContext, 
  NodeExecutionResult,
  WhatsAppMessagePayload,
  ValidationResult 
} from './base'
import { processText } from '../variables'
import { findOutgoingEdge } from './base'

// =============================================================================
// TYPES
// =============================================================================

export interface TemplateNodeData {
  templateName: string
  language?: string
  headerVariables?: { value: string }[]
  bodyVariables?: { value: string }[]
  buttonVariables?: { value: string }[]
  buttons?: { id?: string; type: string; text?: string }[]
}

// =============================================================================
// EXECUTOR
// =============================================================================

export const templateNodeExecutor: NodeExecutor<TemplateNodeData> = {
  type: 'template',
  
  async execute(
    context: ExecutionContext,
    node: FlowNode & { data: TemplateNodeData }
  ): Promise<NodeExecutionResult> {
    const data = node.data
    const templateName = data.templateName
    const language = data.language || 'pt_BR'

    if (!templateName) {
      return {
        success: false,
        error: 'Template name is required',
      }
    }

    // Build template components
    const components: Record<string, unknown>[] = []

    // Header variables
    const headerVars = data.headerVariables || []
    if (headerVars.length > 0) {
      components.push({
        type: 'header',
        parameters: headerVars.map(v => ({
          type: 'text',
          text: processText(v.value || '', context.variables),
        })),
      })
    }

    // Body variables
    const bodyVars = data.bodyVariables || []
    if (bodyVars.length > 0) {
      components.push({
        type: 'body',
        parameters: bodyVars.map(v => ({
          type: 'text',
          text: processText(v.value || '', context.variables),
        })),
      })
    }

    // Button variables (for URL buttons with variables)
    const buttonVars = data.buttonVariables || []
    if (buttonVars.length > 0) {
      buttonVars.forEach((v, index) => {
        components.push({
          type: 'button',
          sub_type: 'url',
          index,
          parameters: [
            {
              type: 'text',
              text: processText(v.value || '', context.variables),
            },
          ],
        })
      })
    }

    // QUICK_REPLY button payloads - Define custom payloads for button identification
    // This allows us to identify which button was clicked by its unique payload
    const buttons = data.buttons || []
    const quickReplyButtons = buttons.filter(b => 
      b.type === 'QUICK_REPLY' || b.type === 'quick_reply'
    )
    
    quickReplyButtons.forEach((btn, index) => {
      // Use button ID if available, otherwise generate one
      const payload = btn.id || `button-${index}`
      components.push({
        type: 'button',
        sub_type: 'quick_reply',
        index,
        parameters: [
          {
            type: 'payload',
            payload: payload,
          },
        ],
      })
    })

    console.log(`📋 [V3] Template ${templateName} with ${components.length} components`)

    // Build WhatsApp template message payload
    const message: WhatsAppMessagePayload = {
      type: 'template',
      payload: {
        messaging_product: 'whatsapp',
        to: context.contactPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: language },
          components: components.length > 0 ? components : undefined,
        },
      },
    }

    // Check if template has QUICK_REPLY buttons (expects response)
    const hasQuickReply = quickReplyButtons.length > 0

    if (hasQuickReply) {
      // Wait for user response - pause execution
      return {
        success: true,
        messages: [message],
        pauseExecution: true,  // Wait for button click response
      }
    }

    // Find next node
    const outgoingEdge = findOutgoingEdge(context.edges, node.id)

    return {
      success: true,
      messages: [message],
      nextNodeId: outgoingEdge?.target,
    }
  },
  
  /**
   * Processa resposta do usuário para templates com QUICK_REPLY
   */
  async processResponse(
    context: ExecutionContext,
    node: FlowNode & { data: TemplateNodeData }
  ): Promise<string | undefined> {
    const { incomingMessage, edges } = context
    const data = node.data
    const buttons = data.buttons || []
    
    if (!incomingMessage) return undefined
    
    // Filtrar apenas botões QUICK_REPLY
    const quickReplyButtons = buttons.filter(b => 
      b.type === 'QUICK_REPLY' || b.type === 'quick_reply'
    )
    
    if (quickReplyButtons.length === 0) {
      // Template sem botões de resposta, seguir para próximo nó
      const edge = findOutgoingEdge(edges, node.id)
      return edge?.target
    }
    
    // Input do usuário - pode ser:
    // 1. O payload que enviamos (ex: "button-0" ou ID customizado)
    // 2. O texto do botão (fallback)
    const userInput = incomingMessage.buttonId || incomingMessage.text || ''
    
    console.log(`[V3] Template processResponse: input="${userInput}"`)
    console.log(`[V3] Template buttons: ${JSON.stringify(quickReplyButtons)}`)
    
    // Tentar match pelo payload/ID do botão
    const matchedButton = quickReplyButtons.find((btn, index) => {
      // O payload que enviamos: btn.id ou "button-{index}"
      const sentPayload = btn.id || `button-${index}`
      
      // Match exato pelo payload
      if (userInput === sentPayload) return true
      if (userInput.toLowerCase() === sentPayload.toLowerCase()) return true
      
      // Match pelo texto do botão (fallback se o payload não bater)
      const btnText = (btn.text || '').toLowerCase()
      if (userInput.toLowerCase() === btnText) return true
      
      return false
    })
    
    if (matchedButton) {
      const buttonIndex = quickReplyButtons.indexOf(matchedButton)
      // O handle é o ID do botão ou "button-{index}"
      const handleId = matchedButton.id || `button-${buttonIndex}`
      
      console.log(`[V3] Template matched button: ${handleId}`)
      
      // Buscar edge pelo handle do botão
      const edge = edges.find(e => 
        e.source === node.id && 
        (e.sourceHandle === handleId || 
         e.sourceHandle === `button-${buttonIndex}` ||
         e.sourceHandle === `button_${buttonIndex}`)
      )
      
      if (edge) {
        console.log(`[V3] Template found edge to: ${edge.target}`)
        return edge.target
      }
    }
    
    // Fallback: tentar edge padrão
    const fallbackEdge = edges.find(e => 
      e.source === node.id && 
      e.sourceHandle === 'fallback'
    )
    
    if (fallbackEdge) {
      console.log(`[V3] Template using fallback edge`)
      return fallbackEdge.target
    }
    
    // Último recurso: edge de saída padrão
    const defaultEdge = findOutgoingEdge(edges, node.id)
    if (defaultEdge) {
      console.log(`[V3] Template using default edge to: ${defaultEdge.target}`)
      return defaultEdge.target
    }
    
    console.log(`[V3] Template: no matching edge found`)
    return undefined
  },
  
  validate(node: FlowNode & { data: TemplateNodeData }, edges: FlowEdge[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    
    if (!node.data.templateName) {
      errors.push('Template name is required')
    }
    
    // Check if node has an outgoing edge (unless it has QUICK_REPLY buttons)
    const buttons = node.data.buttons || []
    const hasQuickReply = buttons.some(b => b.type === 'QUICK_REPLY')
    
    if (!hasQuickReply) {
      const hasOutgoing = edges.some(e => e.source === node.id)
      if (!hasOutgoing) {
        warnings.push('Template node has no outgoing connection')
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  },
}
