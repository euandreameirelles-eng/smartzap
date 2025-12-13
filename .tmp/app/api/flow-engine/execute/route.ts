/**
 * Flow Engine Execute API
 * 
 * POST /api/flow-engine/execute
 * 
 * Starts a flow execution for a list of contacts.
 * Used by campaigns to dispatch messages.
 */

import { NextRequest, NextResponse } from 'next/server'
import { flowDb, contactDb, settingsDb } from '@/lib/supabase-db'
import { startCampaignExecution } from '@/lib/flow-engine/modes/campaign'
import type { Contact } from '@/types'
import { ContactStatus } from '@/types'

// =============================================================================
// TYPES
// =============================================================================

interface ExecuteRequestBody {
  flowId: string
  contactIds?: string[]
  contacts?: Array<{
    id: string
    phone: string
    name?: string
  }>
  mode?: 'campaign' | 'test'
  options?: {
    batchSize?: number
    rateLimitMs?: number
    webhookUrl?: string
  }
}

interface ExecuteResponse {
  success: boolean
  executionId?: string
  status?: string
  totalContacts?: number
  batchCount?: number
  error?: string
}

// =============================================================================
// HANDLER
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<ExecuteResponse>> {
  try {
    const body = await request.json() as ExecuteRequestBody

    // Validate required fields
    if (!body.flowId) {
      return NextResponse.json(
        { success: false, error: 'flowId is required' },
        { status: 400 }
      )
    }

    if (!body.contacts && !body.contactIds) {
      return NextResponse.json(
        { success: false, error: 'contacts or contactIds is required' },
        { status: 400 }
      )
    }

    // Load flow
    const flow = await flowDb.getById(body.flowId)
    if (!flow) {
      return NextResponse.json(
        { success: false, error: 'Flow not found' },
        { status: 404 }
      )
    }

    // Validate flow is published
    if (flow.status !== 'published') {
      return NextResponse.json(
        { success: false, error: 'Flow must be published before execution' },
        { status: 400 }
      )
    }

    // Get contacts
    let contacts: Contact[]

    if (body.contacts) {
      // Direct contact list provided
      contacts = body.contacts.map(c => ({
        id: c.id,
        phone: c.phone,
        name: c.name,
        status: ContactStatus.OPT_IN,
        tags: [],
        lastActive: new Date().toISOString(),
      }))
    } else if (body.contactIds) {
      // Load contacts by ID
      const loadedContacts = await Promise.all(
        body.contactIds.map(id => contactDb.getById(id))
      )
      contacts = loadedContacts.filter((c): c is Contact => c !== undefined && c !== null)

      if (contacts.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No valid contacts found' },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'contacts or contactIds is required' },
        { status: 400 }
      )
    }

    // Get WhatsApp credentials
    const phoneNumberId = await settingsDb.get('whatsapp_phone_number_id')
    const accessToken = await settingsDb.get('whatsapp_access_token')

    if (!phoneNumberId || !accessToken) {
      return NextResponse.json(
        { success: false, error: 'WhatsApp credentials not configured' },
        { status: 400 }
      )
    }

    // Start campaign execution
    const result = await startCampaignExecution({
      flowId: body.flowId,
      flow,
      contacts,
      phoneNumberId,
      accessToken,
      batchSize: body.options?.batchSize,
      rateLimitMs: body.options?.rateLimitMs,
      webhookUrl: body.options?.webhookUrl,
    })

    if (result.status === 'failed') {
      return NextResponse.json(
        {
          success: false,
          executionId: result.executionId,
          error: result.error
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      executionId: result.executionId,
      status: result.status,
      totalContacts: result.totalContacts,
      batchCount: result.batchCount,
    })

  } catch (error) {
    console.error('[FlowEngine:Execute] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}
