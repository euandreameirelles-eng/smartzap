/**
 * Flow Engine Executions API
 * 
 * GET /api/flow-engine/executions
 * 
 * Lists flow executions with filtering and pagination.
 */

import { NextRequest, NextResponse } from 'next/server'
import { flowExecutionDb } from '@/lib/supabase-db'
import type { FlowExecution } from '@/types'

// =============================================================================
// TYPES
// =============================================================================

interface ExecutionsListResponse {
  success: boolean
  executions?: Array<{
    id: string
    flowId: string
    mode: string
    status: string
    contactCount: number
    sentCount: number
    deliveredCount: number
    failedCount: number
    createdAt: string
    completedAt?: string
  }>
  pagination?: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  error?: string
}

// =============================================================================
// HANDLER
// =============================================================================

export async function GET(
  request: NextRequest
): Promise<NextResponse<ExecutionsListResponse>> {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const flowId = searchParams.get('flowId') || undefined
    const mode = searchParams.get('mode') as 'campaign' | 'chatbot' | undefined
    const status = searchParams.get('status') || undefined
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Get executions with filters
    const { executions, total } = await flowExecutionDb.getAll({
      mode,
      status: status as any,
      limit,
      offset,
    })

    // Filter by flowId if provided (not supported directly by getAll)
    const filteredExecutions = flowId
      ? executions.filter((exec: FlowExecution) => exec.flowId === flowId)
      : executions

    return NextResponse.json({
      success: true,
      executions: filteredExecutions.map((exec: FlowExecution) => ({
        id: exec.id,
        flowId: exec.flowId,
        mode: exec.mode,
        status: exec.status,
        contactCount: exec.contactCount,
        sentCount: exec.sentCount,
        deliveredCount: exec.deliveredCount,
        failedCount: exec.failedCount,
        createdAt: exec.createdAt,
        completedAt: exec.completedAt,
      })),
      pagination: {
        total: flowId ? filteredExecutions.length : total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })

  } catch (error) {
    console.error('[FlowEngine:Executions] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}
