/**
 * Contacts Node Executor
 * 
 * Envia um ou mais contatos (vCard) ao usuário.
 * Suporta substituição de variáveis nos dados do contato.
 */

import type { FlowNode, FlowEdge } from '@/types'
import type { NodeExecutor, ExecutionContext, NodeExecutionResult, WhatsAppMessagePayload, ValidationResult } from './base'
import { processText } from '../variables'

// Contact info type
export interface ContactInfo {
  name: {
    formatted_name: string
    first_name?: string
    last_name?: string
    prefix?: string
  }
  phones?: Array<{
    phone: string
    type?: 'CELL' | 'MAIN' | 'HOME' | 'WORK'
    wa_id?: string
  }>
  emails?: Array<{
    email: string
    type?: 'HOME' | 'WORK'
  }>
  addresses?: Array<{
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
    type?: 'HOME' | 'WORK'
  }>
  org?: {
    company?: string
    department?: string
    title?: string
  }
  urls?: Array<{
    url: string
    type?: 'HOME' | 'WORK'
  }>
}

// Contacts node data type
export interface ContactsNodeData {
  contacts: ContactInfo[]
}

export const contactsNodeExecutor: NodeExecutor<ContactsNodeData> = {
  type: 'contacts',
  
  async execute(
    context: ExecutionContext,
    node: FlowNode & { data: ContactsNodeData }
  ): Promise<NodeExecutionResult> {
    const { variables, contactPhone, edges } = context
    const data = node.data
    
    if (!data.contacts || data.contacts.length === 0) {
      return {
        success: false,
        error: 'Nó de contatos precisa ter pelo menos um contato configurado'
      }
    }
    
    // Processar variáveis em cada contato
    const processedContacts = data.contacts.map(contact => ({
      ...contact,
      name: {
        ...contact.name,
        formatted_name: processText(contact.name.formatted_name, variables, { contactPhone }),
        first_name: contact.name.first_name 
          ? processText(contact.name.first_name, variables, { contactPhone })
          : undefined,
        last_name: contact.name.last_name 
          ? processText(contact.name.last_name, variables, { contactPhone })
          : undefined,
      },
      phones: contact.phones?.map(p => ({
        ...p,
        phone: processText(p.phone, variables, { contactPhone }),
      })),
      emails: contact.emails?.map(e => ({
        ...e,
        email: processText(e.email, variables, { contactPhone }),
      })),
      org: contact.org ? {
        ...contact.org,
        company: contact.org.company 
          ? processText(contact.org.company, variables, { contactPhone })
          : undefined,
        title: contact.org.title 
          ? processText(contact.org.title, variables, { contactPhone })
          : undefined,
      } : undefined,
    }))
    
    // Construir payload WhatsApp
    const payload: WhatsAppMessagePayload = {
      type: 'contacts',
      payload: { contacts: processedContacts } as Record<string, unknown>
    }
    
    // Buscar próximo nó
    const outgoingEdge = edges.find(e => e.source === node.id)
    
    return {
      success: true,
      messages: [payload],
      nextNodeId: outgoingEdge?.target,
    }
  },
  
  validate(node: FlowNode & { data: ContactsNodeData }, edges: FlowEdge[]): ValidationResult {
    const errors: string[] = []
    const data = node.data
    
    // Verificar se tem contatos
    if (!data.contacts || data.contacts.length === 0) {
      errors.push('Nó de contatos precisa ter pelo menos um contato configurado')
    }
    
    // Validar cada contato
    data.contacts?.forEach((contact, index) => {
      if (!contact.name?.formatted_name) {
        errors.push(`Contato ${index + 1} precisa ter um nome formatado`)
      }
      
      // Verificar se tem pelo menos um meio de contato
      const hasPhone = contact.phones && contact.phones.length > 0
      const hasEmail = contact.emails && contact.emails.length > 0
      
      if (!hasPhone && !hasEmail) {
        errors.push(`Contato ${index + 1} precisa ter pelo menos um telefone ou email`)
      }
    })
    
    // Verificar se tem saída
    const hasOutput = edges.some(e => e.source === node.id)
    if (!hasOutput) {
      errors.push('Nó de contatos precisa estar conectado a outro nó')
    }
    
    return { valid: errors.length === 0, errors }
  }
}

// Legacy exports for backwards compatibility
export function handleContactsNode(
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
    setVariable: async () => {},
    log: () => {},
  }
  
  return contactsNodeExecutor.execute(context, node as FlowNode & { data: ContactsNodeData })
}

export function validateContactsNode(node: FlowNode, edges: FlowEdge[]): string[] {
  const result = contactsNodeExecutor.validate!(node as FlowNode & { data: ContactsNodeData }, edges)
  return result.errors || []
}
