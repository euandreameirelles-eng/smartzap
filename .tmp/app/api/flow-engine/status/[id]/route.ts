/**
 * Flow Engine Execution Status API
 * 
 * GET /api/flow-engine/status/[id]
 * Returns the current status of a flow execution.
 * 
 * DELETE /api/flow-engine/status/[id]
 * Cancels a running or paused flow execution.
 */

import { NextRequest, NextResponse } from 'next/server'
import { flowExecutionDb, nodeExecutionDb } from '@/lib/supabase-db'

// =============================================================================
// TYPES
// =============================================================================

interface StatusResponse {
  success: boolean
  execution?: {
    id: string
    flowId: string
    mode: string
    status: string
    contactCount: number
    sentCount: number
    deliveredCount: number
    readCount: number
    failedCount: number
    startedAt?: string
    completedAt?: string
    errorMessage?: string
    progress: number
  }
  nodes?: Array<{
    id: string
    nodeId: string
    nodeType: string
    status: string
    contactPhone?: string
    error?: string
    createdAt: string
  }>
  error?: string
}

interface CancelResponse {
  success: boolean
  executionId?: string
  status?: string
  cancelledAt?: string
  sentBeforeCancel?: number
  error?: string
}

// =============================================================================
// GET HANDLER
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<StatusResponse>> {
  try {
    const { id } = await params

    // Get execution
    const execution = await flowExecutionDb.getById(id)

    if (!execution) {
      return NextResponse.json(
        { success: false, error: 'Execution not found' },
        { status: 404 }
      )
    }

    // Calculate progress
    const progress = execution.contactCount > 0
      ? Math.round(((execution.sentCount + execution.failedCount) / execution.contactCount) * 100)
      : 0

    // Get recent node executions (optional, controlled by query param)
    const includeNodes = request.nextUrl.searchParams.get('includeNodes') === 'true'
    let nodes: StatusResponse['nodes'] = undefined

    if (includeNodes) {
      const nodeExecs = await nodeExecutionDb.getByExecutionId(id, { limit: 50 })
      nodes = nodeExecs.map(ne => ({
        id: ne.id,
        nodeId: ne.nodeId,
        nodeType: ne.nodeType,
        status: ne.status,
        contactPhone: ne.contactPhone,
        error: ne.errorMessage,
        createdAt: ne.createdAt,
      }))
    }

    return NextResponse.json({
      success: true,
      execution: {
        id: execution.id,
        flowId: execution.flowId,
        mode: execution.mode,
        status: execution.status,
        contactCount: execution.contactCount,
        sentCount: execution.sentCount,
        deliveredCount: execution.deliveredCount,
        readCount: execution.readCount,
        failedCount: execution.failedCount,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
        errorMessage: execution.errorMessage,
        progress,
      },
      nodes,
    })

  } catch (error) {
    console.error('[FlowEngine:Status] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// =============================================================================
// DELETE HANDLER (Cancel)
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<CancelResponse>> {
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

    // Check if can be cancelled
    const cancellableStatuses = ['pending', 'running', 'paused']
    if (!cancellableStatuses.includes(execution.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot cancel execution with status: ${execution.status}` },
        { status: 400 }
      )
    }

    // Update status to failed (cancelled)
    const cancelledAt = new Date().toISOString()
    await flowExecutionDb.updateStatus(id, {
      status: 'failed',
      errorMessage: 'Cancelled by user',
    })

    // TODO: Cancel any pending QStash jobs for this execution
    // This would be: await cancelQStashJobs(id)

    return NextResponse.json({
      success: true,
      executionId: id,
      status: 'cancelled',
      cancelledAt,
      sentBeforeCancel: execution.sentCount,
    })

  } catch (error) {
    console.error('[FlowEngine:Cancel] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}
