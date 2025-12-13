/**
 * Flow Engine Batch Worker API
 * 
 * POST /api/flow-engine/worker/batch
 * 
 * Called by QStash to process a batch of contacts.
 * This endpoint handles the actual message sending.
 */

import { NextRequest, NextResponse } from 'next/server'
import { processCampaignBatch, type BatchJob } from '@/lib/flow-engine/modes/campaign'

// =============================================================================
// HANDLER
// =============================================================================

async function handler(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as BatchJob
    
    // Validate required fields
    if (!body.executionId || !body.flow || !body.contacts) {
      return NextResponse.json(
        { success: false, error: 'Invalid batch job data' },
        { status: 400 }
      )
    }
    
    // Process the batch
    await processCampaignBatch(body)
    
    return NextResponse.json({
      success: true,
      batchIndex: body.batchIndex,
      contactsProcessed: body.contacts.length,
    })
    
  } catch (error) {
    console.error('[FlowEngine:Worker:Batch] Error:', error)
    
    // Return 500 to trigger QStash retry
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Batch processing failed' 
      },
      { status: 500 }
    )
  }
}

// Export POST with optional QStash signature verification
// Only verify in production if keys are configured
export async function POST(request: NextRequest): Promise<Response> {
  // In development or if QStash keys not configured, skip verification
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY
  
  if (!currentSigningKey || !nextSigningKey) {
    console.log('[FlowEngine:Worker:Batch] QStash keys not configured, skipping verification')
    return handler(request)
  }
  
  // Dynamically import and use verifySignatureAppRouter only when keys exist
  try {
    const { verifySignatureAppRouter } = await import('@upstash/qstash/nextjs')
    const wrappedHandler = verifySignatureAppRouter(handler)
    return wrappedHandler(request)
  } catch (error) {
    console.error('[FlowEngine:Worker:Batch] QStash verification error:', error)
    // Fallback to unverified handler
    return handler(request)
  }
}

// Configure for longer execution
export const maxDuration = 60 // 60 seconds max
export const dynamic = 'force-dynamic'
