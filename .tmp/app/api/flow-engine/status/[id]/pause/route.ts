/**
 * Flow Engine Pause API
 * 
 * POST /api/flow-engine/status/[id]/pause
 * 
 * Pauses a running flow execution (campaign mode only).
 */

import { NextRequest, NextResponse } from 'next/server'
import { flowExecutionDb } from '@/lib/supabase-db'

// =============================================================================
// TYPES
// =============================================================================

interface PauseResponse {
  success: boolean
  executionId?: string
  status?: string
  pausedAt?: string
  pendingContacts?: number
  error?: string
}

// =============================================================================
// HANDLER
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<PauseResponse>> {
  try {
    const { id } = await params

    // Get current execution
    const execution = await flowExecutionDb.getById(id)

    if (!execution) {
      return NextResponse.json(
        { success: false, error: 'Execution not found' },
        { status: 404 }
      )
    }

    // Check if can be paused
    if (execution.mode !== 'campaign') {
      return NextResponse.json(
        { success: false, error: 'Only campaign executions can be paused' },
        { status: 400 }
      )
    }

    if (execution.status !== 'running') {
      return NextResponse.json(
        { success: false, error: `Cannot pause execution with status: ${execution.status}` },
        { status: 400 }
      )
    }

    // Update status to paused
    const pausedAt = new Date().toISOString()
    await flowExecutionDb.updateStatus(id, { status: 'paused', pausedAt })

    // Calculate pending contacts
    const pendingContacts = execution.contactCount - execution.sentCount - execution.failedCount

    return NextResponse.json({
      success: true,
      executionId: id,
      status: 'paused',
      pausedAt,
      pendingContacts,
    })

  } catch (error) {
    console.error('[FlowEngine:Pause] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}
