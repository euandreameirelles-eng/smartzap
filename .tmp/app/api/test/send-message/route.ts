import { NextRequest, NextResponse } from 'next/server'
import { getWhatsAppCredentials } from '@/lib/whatsapp-credentials'

/**
 * POST /api/test/send-message
 * Send a single test message to verify WhatsApp integration
 * 
 * Body: { phone: string, templateName: string, name?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, templateName, name = 'Teste' } = body

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
    }

    if (!templateName) {
      return NextResponse.json({ error: 'Template name required' }, { status: 400 })
    }

    // Get credentials from Redis
    const credentials = await getWhatsAppCredentials()
    
    if (!credentials?.phoneNumberId || !credentials?.accessToken) {
      return NextResponse.json(
        { error: 'Credenciais WhatsApp não configuradas' }, 
        { status: 401 }
      )
    }

    // Normalize phone number (remove + and spaces)
    const normalizedPhone = phone.replace(/[^0-9]/g, '')

    console.log(`📤 Sending test message to ${normalizedPhone} using template ${templateName}`)

    // Send message via WhatsApp Cloud API
    const response = await fetch(
      `https://graph.facebook.com/v24.0/${credentials.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: normalizedPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'pt_BR' },
            components: [
              {
                type: 'body',
                parameters: [{ type: 'text', text: name }],
              },
            ],
          },
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Meta API error:', data)
      return NextResponse.json({
        success: false,
        error: data.error?.message || 'Failed to send message',
        details: data.error,
        meta: {
          phone: normalizedPhone,
          templateName,
          statusCode: response.status,
        }
      }, { status: response.status })
    }

    const messageId = data.messages?.[0]?.id

    console.log(`✅ Message sent! ID: ${messageId}`)

    return NextResponse.json({
      success: true,
      messageId,
      phone: normalizedPhone,
      templateName,
      contacts: data.contacts,
    })

  } catch (error) {
    console.error('Error sending test message:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' }, 
      { status: 500 }
    )
  }
}
