/**
 * Menu Node Handler
 * 
 * Apresenta opções ao usuário usando:
 * - Reply Buttons (até 3 opções)
 * - List Message (4+ opções)
 * 
 * Escolha automática baseada na quantidade de opções.
 */

import type { FlowNode, FlowEdge, MenuNodeData } from '@/types'
import { processText } from '../variables'
import { buildReplyButtons, buildListMessage, buildMenu, type MenuOption as WhatsAppMenuOption } from '@/lib/whatsapp/interactive'

export interface MenuNodeResult {
  success: boolean
  message?: ReturnType<typeof buildReplyButtons> | ReturnType<typeof buildListMessage>
  waitingForInput: boolean
  error?: string
}

/**
 * Executa o nó de menu
 * 
 * @param node - Nó de menu
 * @param variables - Variáveis disponíveis para substituição
 * @param recipientPhone - Telefone do destinatário
 * @returns Resultado com mensagem a ser enviada
 */
export function handleMenuNode(
  node: FlowNode,
  variables: Record<string, string>,
  recipientPhone: string
): MenuNodeResult {
  const data = node.data as MenuNodeData
  
  if (!data.text) {
    return {
      success: false,
      waitingForInput: false,
      error: 'Nó de menu não tem texto configurado'
    }
  }
  
  if (!data.options || data.options.length === 0) {
    return {
      success: false,
      waitingForInput: false,
      error: 'Nó de menu não tem opções configuradas'
    }
  }
  
  // Substituir variáveis no texto e header/footer
  const processedText = processText(data.text, variables)
  const processedHeader = data.header ? processText(data.header, variables) : undefined
  const processedFooter = data.footer ? processText(data.footer, variables) : undefined
  
  // Mapear opções do nó para o formato do WhatsApp
  const whatsappOptions: WhatsAppMenuOption[] = data.options.map(opt => ({
    id: opt.id,
    label: opt.label,
    description: opt.description,
  }))
  
  // Usar buildMenu que escolhe automaticamente entre buttons e list
  const message = buildMenu({
    to: recipientPhone,
    body: processedText,
    header: processedHeader ? { type: 'text', text: processedHeader } : undefined,
    footer: processedFooter,
    options: whatsappOptions,
    listButtonText: 'Ver opções', // Para lista
  })
  
  return {
    success: true,
    message,
    waitingForInput: true, // Menu sempre espera resposta
  }
}

/**
 * Processa a resposta do usuário para um nó de menu
 * 
 * @param node - Nó de menu
 * @param edges - Edges do fluxo
 * @param userResponse - Resposta do usuário (button_id, list_id ou texto)
 * @returns ID do próximo nó ou null se não encontrou match
 */
export function processMenuResponse(
  node: FlowNode,
  edges: FlowEdge[],
  userResponse: {
    buttonId?: string
    listId?: string
    text?: string
  }
): string | null {
  const data = node.data as MenuNodeData
  const options = data.options || []
  
  // Input do usuário (normalizado)
  const input = (userResponse.buttonId || userResponse.listId || userResponse.text || '').toLowerCase()
  
  // Tentar match por ID, value ou label
  const matchedOption = options.find(opt => 
    opt.id.toLowerCase() === input ||
    opt.value.toLowerCase() === input ||
    opt.label.toLowerCase() === input
  )
  
  if (matchedOption) {
    // Buscar edge que sai com o handle do option ID
    const edge = edges.find(e => 
      e.source === node.id && 
      (e.sourceHandle === matchedOption.id || e.sourceHandle === matchedOption.value)
    )
    
    if (edge) {
      return edge.target
    }
  }
  
  // Tentar match por número (1, 2, 3, etc.)
  const numericInput = parseInt(input, 10)
  if (!isNaN(numericInput) && numericInput > 0 && numericInput <= options.length) {
    const optionByNumber = options[numericInput - 1]
    const edge = edges.find(e => 
      e.source === node.id && 
      (e.sourceHandle === optionByNumber.id || e.sourceHandle === optionByNumber.value)
    )
    
    if (edge) {
      return edge.target
    }
  }
  
  // Buscar fallback edge
  const fallbackEdge = edges.find(e => 
    e.source === node.id && 
    e.sourceHandle === 'fallback'
  )
  
  if (fallbackEdge) {
    return fallbackEdge.target
  }
  
  // Não encontrou transição válida
  return null
}

/**
 * Valida se o nó de menu está configurado corretamente
 */
export function validateMenuNode(node: FlowNode, edges: FlowEdge[]): string[] {
  const errors: string[] = []
  const data = node.data as MenuNodeData
  
  // Verificar texto
  if (!data.text || data.text.trim() === '') {
    errors.push('Nó de menu precisa ter um texto configurado')
  }
  
  // Verificar opções
  if (!data.options || data.options.length === 0) {
    errors.push('Nó de menu precisa ter pelo menos uma opção')
  }
  
  // Verificar limite de opções
  if (data.options && data.options.length > 10) {
    errors.push('Nó de menu pode ter no máximo 10 opções')
  }
  
  // Verificar se cada opção tem saída
  if (data.options) {
    for (const opt of data.options) {
      const hasEdge = edges.some(e => 
        e.source === node.id && 
        (e.sourceHandle === opt.id || e.sourceHandle === opt.value)
      )
      
      if (!hasEdge) {
        errors.push(`Opção "${opt.label}" não está conectada a nenhum nó`)
      }
      
      // Verificar limites de caracteres
      if (opt.label.length > 24) {
        errors.push(`Título da opção "${opt.label}" excede 24 caracteres`)
      }
      
      if (opt.description && opt.description.length > 72) {
        errors.push(`Descrição da opção "${opt.label}" excede 72 caracteres`)
      }
    }
  }
  
  return errors
}
