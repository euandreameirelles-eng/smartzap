/**
 * Flow Engine Resume API
 * 
 * POST /api/flow-engine/status/[id]/resume
 * 
 * Resumes a paused flow execution.
 */

import { NextRequest, NextResponse } from 'next/server'
import { flowExecutionDb } from '@/lib/supabase-db'

// =============================================================================
// TYPES
// =============================================================================

interface ResumeResponse {
  success: boolean
  executionId?: string
  status?: string
  resumedAt?: string
  remainingContacts?: number
  error?: string
}

// =============================================================================
// HANDLER
// =============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ResumeResponse>> {
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

    // Check if can be resumed
    if (execution.status !== 'paused') {
      return NextResponse.json(
        { success: false, error: `Cannot resume execution with status: ${execution.status}` },
        { status: 400 }
      )
    }

    // Update status to running
    const resumedAt = new Date().toISOString()
    await flowExecutionDb.updateStatus(id, { status: 'running' })

    // Calculate remaining contacts
    const remainingContacts = execution.contactCount - execution.sentCount - execution.failedCount

    // TODO: Re-queue the execution via QStash if using campaign worker
    // This would be: await queueCampaignResume(id, remainingContacts)

    return NextResponse.json({
      success: true,
      executionId: id,
      status: 'running',
      resumedAt,
      remainingContacts,
    })

  } catch (error) {
    console.error('[FlowEngine:Resume] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}
