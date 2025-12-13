/**
 * Flow Engine Node Executions API
 * 
 * GET /api/flow-engine/executions/[id]/nodes
 * 
 * Lists node executions for a specific flow execution.
 */

import { NextRequest, NextResponse } from 'next/server'
import { nodeExecutionDb, flowExecutionDb } from '@/lib/supabase-db'
import type { NodeExecution } from '@/types'

// =============================================================================
// TYPES
// =============================================================================

interface NodeExecutionsResponse {
  success: boolean
  nodes?: Array<{
    id: string
    nodeId: string
    nodeType: string
    contactPhone?: string
    status: string
    input?: Record<string, unknown>
    output?: Record<string, unknown>
    errorCode?: number
    errorMessage?: string
    durationMs?: number
    createdAt: string
    completedAt?: string
  }>
  pagination?: {
    total: number
    limit: number
    offset: number
  }
  error?: string
}

// =============================================================================
// HANDLER
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<NodeExecutionsResponse>> {
  try {
    const { id } = await params

    // Verify execution exists
    const execution = await flowExecutionDb.getById(id)
    if (!execution) {
      return NextResponse.json(
        { success: false, error: 'Execution not found' },
        { status: 404 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || undefined
    const nodeType = searchParams.get('nodeType') || undefined
    const contactPhone = searchParams.get('contactPhone') || undefined
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Get node executions
    const nodes = await nodeExecutionDb.getByExecutionId(id, {
      status: status as any,
      nodeType,
      contactPhone,
      limit,
      offset,
    })

    // Count total for pagination
    const allNodes = await nodeExecutionDb.getByExecutionId(id, {
      status: status as any,
      nodeType,
      contactPhone,
    })
    const total = allNodes.length

    return NextResponse.json({
      success: true,
      nodes: nodes.map((node: NodeExecution) => ({
        id: node.id,
        nodeId: node.nodeId,
        nodeType: node.nodeType,
        contactPhone: node.contactPhone,
        status: node.status,
        input: node.input,
        output: node.output,
        errorCode: node.errorCode,
        errorMessage: node.errorMessage,
        durationMs: node.durationMs,
        createdAt: node.createdAt,
        completedAt: node.completedAt,
      })),
      pagination: {
        total,
        limit,
        offset,
      },
    })

  } catch (error) {
    console.error('[FlowEngine:NodeExecutions] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}
