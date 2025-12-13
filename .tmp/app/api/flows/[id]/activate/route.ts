import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * POST /api/flows/[id]/activate
 * Ativa um workflow para receber mensagens
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { phoneNumberId } = body

    // Verificar se workflow existe
    const { data: existing, error: checkError } = await supabase
      .from('workflows')
      .select('id')
      .eq('id', id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Workflow não encontrado' },
        { status: 404 }
      )
    }

    const now = new Date().toISOString()

    // Se phoneNumberId foi fornecido, desativar outros workflows para esse número
    if (phoneNumberId) {
      await supabase
        .from('workflows')
        .update({ is_active: false })
        .eq('phone_number_id', phoneNumberId)
        .neq('id', id)
    }

    // Ativar este workflow
    const { error } = await supabase
      .from('workflows')
      .update({
        is_active: true,
        phone_number_id: phoneNumberId || null,
        status: 'published',
        updated_at: now,
      })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Workflow ativado com sucesso',
      id,
      isActive: true,
      phoneNumberId,
    })
  } catch (error) {
    console.error('[POST /api/flows/[id]/activate] Error:', error)
    return NextResponse.json(
      { error: 'Erro ao ativar workflow' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/flows/[id]/activate
 * Desativa um workflow
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const now = new Date().toISOString()

    const { error } = await supabase
      .from('workflows')
      .update({
        is_active: false,
        status: 'draft',
        updated_at: now,
      })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Workflow desativado',
      id,
      isActive: false,
    })
  } catch (error) {
    console.error('[DELETE /api/flows/[id]/activate] Error:', error)
    return NextResponse.json(
      { error: 'Erro ao desativar workflow' },
      { status: 500 }
    )
  }
}
