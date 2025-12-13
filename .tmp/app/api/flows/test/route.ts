import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsAppMessage } from '@/lib/flow-engine/sender'
import { processText } from '@/lib/flow-engine/variables'
import { redis, isRedisAvailable } from '@/lib/redis'

const CREDENTIALS_KEY = 'settings:whatsapp:credentials'

interface WhatsAppCredentials {
  phoneNumberId: string
  businessAccountId: string
  accessToken: string
}

interface FlowNode {
  id: string
  type: string
  data: Record<string, unknown>
}

interface FlowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
}

async function getWhatsAppCredentials(): Promise<WhatsAppCredentials | null> {
  // 1. Try Redis first
  if (isRedisAvailable() && redis) {
    const stored = await redis.get(CREDENTIALS_KEY)
    if (stored) {
      const credentials = typeof stored === 'string' ? JSON.parse(stored) : stored
      if (credentials.accessToken && credentials.phoneNumberId) {
        return credentials
      }
    }
  }
  
  // 2. Fallback to env vars
  const phoneNumberId = process.env.WHATSAPP_PHONE_ID || process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || ''
  
  if (phoneNumberId && accessToken) {
    return { phoneNumberId, accessToken, businessAccountId }
  }
  
  return null
}

export async function POST(request: NextRequest) {
  try {
    const { nodes, edges } = await request.json() as { nodes: FlowNode[], edges: FlowEdge[] }

    // Buscar configurações do localStorage via header (enviado pelo frontend)
    const settingsHeader = request.headers.get('x-settings')
    let testContact: { phone?: string; name?: string } | null = null

    if (settingsHeader) {
      try {
        const settings = JSON.parse(settingsHeader)
        testContact = settings.testContact
      } catch (e) {
        console.error('[Flow Test] Failed to parse settings:', e)
      }
    }

    // Buscar credenciais do Redis ou env
    const credentials = await getWhatsAppCredentials()
    
    console.log('[Flow Test] Credentials found:', credentials ? 'yes' : 'no')

    if (!credentials?.accessToken) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Access Token do WhatsApp não configurado. Configure em Configurações.' 
        },
        { status: 400 }
      )
    }
    
    if (!credentials?.phoneNumberId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Phone Number ID do WhatsApp não configurado. Configure em Configurações.' 
        },
        { status: 400 }
      )
    }

    if (!testContact?.phone) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Nenhum contato de teste configurado. Configure em Configurações > Contato de Teste.' 
        },
        { status: 400 }
      )
    }

    const { accessToken, phoneNumberId } = credentials

    // Validar que temos nós e edges
    if (!nodes || nodes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'O fluxo está vazio. Adicione nós antes de testar.' },
        { status: 400 }
      )
    }

    // Encontrar o nó start
    const startNode = nodes.find((n) => n.type === 'start')
    if (!startNode) {
      return NextResponse.json(
        { success: false, error: 'O fluxo precisa de um nó Start.' },
        { status: 400 }
      )
    }

    const recipientPhone = testContact.phone.replace(/\D/g, '')
    
    // Variáveis do contexto
    const variables: Record<string, string> = {
      contactName: testContact.name || 'Contato de Teste',
      contactPhone: recipientPhone,
    }

    // Executar fluxo simplificado - percorrer nós conectados ao start
    let messagesSent = 0
    let nodesExecuted = 0
    const errors: string[] = []
    
    // Encontrar nós conectados ao start e executar em sequência
    const nodesToExecute: FlowNode[] = []
    let currentNodeId: string | null = startNode.id
    const visited = new Set<string>()
    
    // Percorrer o grafo a partir do start
    while (currentNodeId && !visited.has(currentNodeId)) {
      visited.add(currentNodeId)
      
      // Buscar próximo nó via edge
      const edge = edges.find(e => e.source === currentNodeId)
      if (!edge) break
      
      const nextNode = nodes.find(n => n.id === edge.target)
      if (!nextNode || nextNode.type === 'start') break
      
      // Adicionar nó à lista de execução
      nodesToExecute.push(nextNode)
      
      // Verificar se este nó espera resposta do usuário - se sim, parar aqui
      
      // Menu sempre espera resposta
      if (nextNode.type === 'menu') {
        console.log('[Flow Test] Parando em menu - espera resposta do usuário')
        break
      }
      
      // Buttons node espera resposta
      if (nextNode.type === 'buttons') {
        console.log('[Flow Test] Parando em buttons - espera resposta do usuário')
        break
      }
      
      // List node espera resposta
      if (nextNode.type === 'list') {
        console.log('[Flow Test] Parando em list - espera resposta do usuário')
        break
      }
      
      // Input node espera resposta
      if (nextNode.type === 'input') {
        console.log('[Flow Test] Parando em input - espera resposta do usuário')
        break
      }
      
      // Template com botões QUICK_REPLY espera resposta
      if (nextNode.type === 'template') {
        const templateData = nextNode.data as { 
          buttons?: Array<{ id: string; type: string; text: string }> 
        }
        const hasQuickReplyButtons = templateData.buttons?.some(b => 
          b.type === 'QUICK_REPLY' || b.type === 'quick_reply'
        )
        
        if (hasQuickReplyButtons) {
          console.log('[Flow Test] Parando em template com botões - espera resposta do usuário')
          break
        }
      }
      
      // End node termina o fluxo
      if (nextNode.type === 'end') {
        console.log('[Flow Test] Chegou ao fim do fluxo')
        break
      }
      
      // Continuar para o próximo nó
      currentNodeId = nextNode.id
    }
    
    console.log('[Flow Test] Nós a executar:', nodesToExecute.map(n => `${n.type}:${n.id}`).join(' -> '))

    // Executar cada nó
    for (const node of nodesToExecute) {
      nodesExecuted++
      
      try {
        if (node.type === 'template') {
          const data = node.data as {
            templateName?: string
            language?: string
            bodyVariables?: Array<{ name: string; value: string; type: string }>
            headerVariables?: Array<{ name: string; value: string; type: string }>
          }
          
          if (!data.templateName) {
            errors.push(`Nó ${node.id}: Template não selecionado`)
            continue
          }

          // Construir componentes
          const components: Array<{
            type: string
            parameters: Array<{ type: string; text: string }>
          }> = []

          if (data.headerVariables && data.headerVariables.length > 0) {
            components.push({
              type: 'header',
              parameters: data.headerVariables.map(v => ({
                type: 'text',
                text: v.type === 'variable' ? (variables[v.value] || v.value) : v.value
              }))
            })
          }

          if (data.bodyVariables && data.bodyVariables.length > 0) {
            components.push({
              type: 'body',
              parameters: data.bodyVariables.map(v => ({
                type: 'text',
                text: v.type === 'variable' ? (variables[v.value] || v.value) : v.value
              }))
            })
          }

          // Enviar template
          const result = await sendWhatsAppMessage({
            phoneNumberId,
            accessToken,
            to: recipientPhone,
            payload: {
              type: 'template',
              payload: {
                messaging_product: 'whatsapp',
                to: recipientPhone,
                type: 'template',
                template: {
                  name: data.templateName,
                  language: { code: data.language || 'pt_BR' },
                  components: components.length > 0 ? components : undefined,
                }
              }
            }
          })

          if (result.success) {
            messagesSent++
          } else {
            errors.push(`Template ${data.templateName}: ${result.errorMessage || 'Erro ao enviar'}`)
          }
          
        } else if (node.type === 'message') {
          const data = node.data as { text?: string }
          
          if (!data.text) {
            errors.push(`Nó ${node.id}: Mensagem sem texto`)
            continue
          }

          const processedText = processText(data.text, variables, { contactPhone: recipientPhone })

          const result = await sendWhatsAppMessage({
            phoneNumberId,
            accessToken,
            to: recipientPhone,
            payload: {
              type: 'text',
              payload: {
                messaging_product: 'whatsapp',
                to: recipientPhone,
                type: 'text',
                text: { body: processedText }
              }
            }
          })

          if (result.success) {
            messagesSent++
          } else {
            errors.push(`Mensagem: ${result.errorMessage || 'Erro ao enviar'}`)
          }
        }
        // Outros tipos de nós podem ser adicionados aqui
        
      } catch (nodeError) {
        errors.push(`Nó ${node.id}: ${nodeError instanceof Error ? nodeError.message : 'Erro desconhecido'}`)
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      executionId: `test-${Date.now()}`,
      status: errors.length === 0 ? 'completed' : 'completed_with_errors',
      nodesExecuted,
      messagesSent,
      errors: errors.length > 0 ? errors : undefined,
      testContact: {
        name: testContact.name,
        phone: testContact.phone,
      },
    })
  } catch (error) {
    console.error('[Flow Test] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao executar teste' 
      },
      { status: 500 }
    )
  }
}
