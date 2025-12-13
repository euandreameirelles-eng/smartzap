/**
 * Input Node Executor (V3)
 * 
 * Coleta dados do usuário, valida e armazena em variáveis.
 */

import type { FlowNode, FlowEdge, InputNodeData, InputValidationType } from '@/types'
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
// VALIDATORS
// =============================================================================

interface InputValidationResult {
  valid: boolean
  value?: string
  error?: string
}

const validators: Record<InputValidationType, (value: string) => InputValidationResult> = {
  text: (value) => {
    if (!value?.trim()) {
      return { valid: false, error: 'Por favor, informe um valor' }
    }
    return { valid: true, value: value.trim() }
  },

  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const trimmed = value.trim().toLowerCase()
    if (!emailRegex.test(trimmed)) {
      return { valid: false, error: 'Por favor, informe um e-mail válido' }
    }
    return { valid: true, value: trimmed }
  },

  phone: (value) => {
    const numbersOnly = value.replace(/\D/g, '')
    if (numbersOnly.length < 10 || numbersOnly.length > 15) {
      return { valid: false, error: 'Por favor, informe um telefone válido com DDD' }
    }
    let formattedPhone = numbersOnly
    if (numbersOnly.length === 10 || numbersOnly.length === 11) {
      formattedPhone = `55${numbersOnly}`
    }
    return { valid: true, value: formattedPhone }
  },

  number: (value) => {
    const normalized = value.trim().replace(',', '.')
    const num = parseFloat(normalized)
    if (isNaN(num)) {
      return { valid: false, error: 'Por favor, informe um número válido' }
    }
    return { valid: true, value: num.toString() }
  },

  date: (value) => {
    const trimmed = value.trim()
    const datePatterns = [
      { regex: /^(\d{2})\/(\d{2})\/(\d{4})$/, parse: (m: RegExpMatchArray) => new Date(`${m[3]}-${m[2]}-${m[1]}`) },
      { regex: /^(\d{2})-(\d{2})-(\d{4})$/, parse: (m: RegExpMatchArray) => new Date(`${m[3]}-${m[2]}-${m[1]}`) },
      { regex: /^(\d{4})-(\d{2})-(\d{2})$/, parse: (m: RegExpMatchArray) => new Date(m[0]) },
    ]
    
    for (const pattern of datePatterns) {
      const match = trimmed.match(pattern.regex)
      if (match) {
        const date = pattern.parse(match)
        if (!isNaN(date.getTime())) {
          return { valid: true, value: date.toISOString().split('T')[0] }
        }
      }
    }
    return { valid: false, error: 'Por favor, informe uma data válida (ex: 25/12/2024)' }
  },

  custom: (value) => {
    return { valid: true, value: value.trim() }
  },
}

function validateInput(
  value: string,
  validationType: InputValidationType = 'text',
  customRegex?: string,
  customErrorMessage?: string
): InputValidationResult {
  if (validationType === 'custom' && customRegex) {
    try {
      const pattern = new RegExp(customRegex)
      if (!pattern.test(value.trim())) {
        return { valid: false, error: customErrorMessage || 'Formato inválido' }
      }
      return { valid: true, value: value.trim() }
    } catch {
      return { valid: true, value: value.trim() }
    }
  }
  
  return (validators[validationType] || validators.text)(value)
}

// =============================================================================
// EXECUTOR
// =============================================================================

export const inputNodeExecutor: NodeExecutor<InputNodeData> = {
  type: 'input',
  
  async execute(
    context: ExecutionContext,
    node: FlowNode & { data: InputNodeData }
  ): Promise<NodeExecutionResult> {
    const data = node.data
    
    if (!data.prompt) {
      return { success: false, error: 'Nó de input não tem prompt configurado' }
    }
    
    if (!data.variableName) {
      return { success: false, error: 'Nó de input não tem nome de variável configurado' }
    }
    
    // Se não tem input do usuário, enviar prompt
    if (!context.incomingMessage?.text) {
      const processedPrompt = processText(data.prompt, context.variables, {
        contactPhone: context.contactPhone,
      })
      
      const message: WhatsAppMessagePayload = {
        type: 'text',
        payload: {
          messaging_product: 'whatsapp',
          to: context.contactPhone,
          type: 'text',
          text: { body: processedPrompt },
        },
      }
      
      return {
        success: true,
        messages: [message],
        collectInput: {
          variableName: data.variableName,
          validationType: data.validation,
        },
      }
    }
    
    // Validar input do usuário
    const validationResult = validateInput(
      context.incomingMessage.text,
      data.validation,
      data.validationRegex,
      data.errorMessage
    )
    
    if (!validationResult.valid) {
      // Enviar erro e pedir novamente
      const errorText = validationResult.error || 'Valor inválido. Tente novamente.'
      const processedPrompt = processText(data.prompt, context.variables, {
        contactPhone: context.contactPhone,
      })
      
      const message: WhatsAppMessagePayload = {
        type: 'text',
        payload: {
          messaging_product: 'whatsapp',
          to: context.contactPhone,
          type: 'text',
          text: { body: `${errorText}\n\n${processedPrompt}` },
        },
      }
      
      return {
        success: true,
        messages: [message],
        collectInput: {
          variableName: data.variableName,
          validationType: data.validation,
        },
      }
    }
    
    // Input válido - salvar variável e continuar
    if (context.setVariable) {
      await context.setVariable(data.variableName, validationResult.value!)
    }
    
    const outgoingEdge = findOutgoingEdge(context.edges, node.id)
    
    return {
      success: true,
      nextNodeId: outgoingEdge?.target,
      output: { [data.variableName]: validationResult.value },
    }
  },
  
  validate(node: FlowNode & { data: InputNodeData }, edges: FlowEdge[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const data = node.data
    
    if (!data.prompt?.trim()) {
      errors.push('Nó de input precisa ter uma pergunta/prompt')
    }
    
    if (!data.variableName?.trim()) {
      errors.push('Nó de input precisa ter um nome de variável')
    }
    
    if (data.variableName && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(data.variableName)) {
      errors.push('Nome de variável deve começar com letra e conter apenas letras, números e _')
    }
    
    if (data.validation === 'custom' && !data.validationRegex) {
      warnings.push('Validação customizada sem regex configurado')
    }
    
    const hasOutput = edges.some(e => e.source === node.id)
    if (!hasOutput) {
      errors.push('Nó de input precisa estar conectado a outro nó')
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  },
}
