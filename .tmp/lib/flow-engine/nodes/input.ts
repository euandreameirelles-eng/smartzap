/**
 * Input Node Handler
 * 
 * Coleta dados do usuário, valida e armazena em variáveis.
 * Suporta validação de tipos: text, email, phone, number, date, custom.
 */

import type { FlowNode, FlowEdge, InputNodeData, InputValidationType } from '@/types'
import { processText } from '../variables'
import { buildTextMessage } from '@/lib/whatsapp/text'

export interface InputNodeResult {
  success: boolean
  nextNodeId?: string
  message?: ReturnType<typeof buildTextMessage>
  variableToSet?: {
    name: string
    value: string
  }
  waitForInput?: boolean
  error?: string
}

export interface InputValidationResult {
  valid: boolean
  value?: string
  error?: string
}

/**
 * Validadores de input por tipo
 */
const validators: Record<InputValidationType, (value: string) => InputValidationResult> = {
  text: (value) => {
    if (!value || value.trim() === '') {
      return { valid: false, error: 'Por favor, informe um valor' }
    }
    return { valid: true, value: value.trim() }
  },

  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const trimmed = value.trim().toLowerCase()
    
    if (!emailRegex.test(trimmed)) {
      return { valid: false, error: 'Por favor, informe um e-mail válido (ex: nome@email.com)' }
    }
    return { valid: true, value: trimmed }
  },

  phone: (value) => {
    // Remove tudo que não é número
    const numbersOnly = value.replace(/\D/g, '')
    
    // Telefone brasileiro: 10-11 dígitos (com DDD)
    // Internacional: 11-15 dígitos (com código do país)
    if (numbersOnly.length < 10 || numbersOnly.length > 15) {
      return { valid: false, error: 'Por favor, informe um telefone válido com DDD (ex: 11999999999)' }
    }
    
    // Formatar para E.164 se parece brasileiro
    let formattedPhone = numbersOnly
    if (numbersOnly.length === 10 || numbersOnly.length === 11) {
      formattedPhone = `55${numbersOnly}`
    }
    
    return { valid: true, value: formattedPhone }
  },

  number: (value) => {
    const trimmed = value.trim()
    // Aceita números com vírgula ou ponto decimal
    const normalized = trimmed.replace(',', '.')
    const num = parseFloat(normalized)
    
    if (isNaN(num)) {
      return { valid: false, error: 'Por favor, informe um número válido' }
    }
    
    return { valid: true, value: num.toString() }
  },

  date: (value) => {
    const trimmed = value.trim()
    
    // Aceita formatos: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
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
    // Custom validation é feita externamente
    return { valid: true, value: value.trim() }
  },
}

/**
 * Valida input do usuário com regex customizado
 */
function validateCustom(value: string, regex: string, errorMessage?: string): InputValidationResult {
  const trimmed = value.trim()
  
  try {
    const pattern = new RegExp(regex)
    if (!pattern.test(trimmed)) {
      return { 
        valid: false, 
        error: errorMessage || 'Valor informado não está no formato esperado' 
      }
    }
    return { valid: true, value: trimmed }
  } catch {
    // Regex inválido - aceitar o valor
    return { valid: true, value: trimmed }
  }
}

/**
 * Valida input do usuário
 */
export function validateInput(
  value: string,
  validationType: InputValidationType = 'text',
  customRegex?: string,
  customErrorMessage?: string
): InputValidationResult {
  // Se é validação custom com regex
  if (validationType === 'custom' && customRegex) {
    return validateCustom(value, customRegex, customErrorMessage)
  }
  
  // Validação por tipo
  const validator = validators[validationType]
  if (!validator) {
    return validators.text(value)
  }
  
  return validator(value)
}

/**
 * Executa o nó de input - envia prompt e aguarda resposta
 * 
 * @param node - Nó de input
 * @param edges - Edges do fluxo
 * @param variables - Variáveis disponíveis para substituição
 * @param recipientPhone - Telefone do destinatário
 * @param userInput - Input do usuário (se já recebido)
 * @returns Resultado com mensagem a ser enviada ou variável a ser setada
 */
export function handleInputNode(
  node: FlowNode,
  edges: FlowEdge[],
  variables: Record<string, string>,
  recipientPhone: string,
  userInput?: string
): InputNodeResult {
  const data = node.data as InputNodeData
  
  if (!data.prompt) {
    return {
      success: false,
      error: 'Nó de input não tem prompt configurado'
    }
  }
  
  if (!data.variableName) {
    return {
      success: false,
      error: 'Nó de input não tem nome de variável configurado'
    }
  }
  
  // Se não temos input do usuário ainda, enviar o prompt
  if (!userInput) {
    const processedPrompt = processText(data.prompt, variables, {
      contactPhone: recipientPhone,
    })
    
    const message = buildTextMessage({
      to: recipientPhone,
      text: processedPrompt,
    })
    
    return {
      success: true,
      message,
      waitForInput: true,
    }
  }
  
  // Temos input do usuário - validar
  const validationResult = validateInput(
    userInput,
    data.validation,
    data.validationRegex,
    data.errorMessage
  )
  
  if (!validationResult.valid) {
    // Input inválido - enviar mensagem de erro e aguardar novamente
    const errorText = validationResult.error || data.errorMessage || 'Valor inválido. Por favor, tente novamente.'
    
    // Concatenar prompt com erro para o usuário tentar novamente
    const retryMessage = `${errorText}\n\n${processText(data.prompt, variables, { contactPhone: recipientPhone })}`
    
    const message = buildTextMessage({
      to: recipientPhone,
      text: retryMessage,
    })
    
    return {
      success: true,
      message,
      waitForInput: true, // Aguardar input novamente
    }
  }
  
  // Input válido - definir variável e prosseguir
  const outgoingEdge = edges.find(e => e.source === node.id)
  
  return {
    success: true,
    variableToSet: {
      name: data.variableName,
      value: validationResult.value!,
    },
    nextNodeId: outgoingEdge?.target,
  }
}

/**
 * Valida se o nó de input está configurado corretamente
 */
export function validateInputNode(node: FlowNode, edges: FlowEdge[]): string[] {
  const errors: string[] = []
  const data = node.data as InputNodeData
  
  // Verificar se tem prompt
  if (!data.prompt || data.prompt.trim() === '') {
    errors.push('Nó de input precisa ter uma pergunta/prompt configurado')
  }
  
  // Verificar se tem nome de variável
  if (!data.variableName || data.variableName.trim() === '') {
    errors.push('Nó de input precisa ter um nome de variável')
  }
  
  // Validar nome de variável (sem espaços, caracteres especiais)
  if (data.variableName && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(data.variableName)) {
    errors.push('Nome de variável deve começar com letra ou _ e conter apenas letras, números e _')
  }
  
  // Se tipo é custom, verificar se tem regex
  if (data.validation === 'custom' && !data.validationRegex) {
    errors.push('Validação customizada precisa ter um regex configurado')
  }
  
  // Verificar se tem saída
  const hasOutput = edges.some(e => e.source === node.id)
  if (!hasOutput) {
    errors.push('Nó de input precisa estar conectado a outro nó')
  }
  
  return errors
}
