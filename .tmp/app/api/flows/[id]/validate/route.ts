import { NextRequest, NextResponse } from 'next/server'
import { flowDb } from '@/lib/supabase-db'
import { validateFlow, canPublish } from '@/lib/flow-engine/validator'

/**
 * POST /api/flows/[id]/validate
 * 
 * Valida um fluxo e retorna erros/warnings
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Buscar fluxo
    const flow = await flowDb.getById(id)

    if (!flow) {
      return NextResponse.json(
        { error: 'Fluxo não encontrado' },
        { status: 404 }
      )
    }

    // Validar fluxo
    const validation = validateFlow(flow)
    const publishStatus = canPublish(flow)

    return NextResponse.json({
      valid: validation.valid,
      canPublish: publishStatus.canPublish,
      errors: validation.errors,
      warnings: validation.warnings,
    })

  } catch (error) {
    console.error('[POST /api/flows/[id]/validate] Error:', error)
    return NextResponse.json(
      { error: 'Erro ao validar fluxo' },
      { status: 500 }
    )
  }
}
