import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/flows/[id]
 * Busca um workflow específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Workflow não encontrado' },
        { status: 404 }
      )
    }

    const workflow = {
      id: data.id,
      name: data.name,
      nodes: typeof data.nodes === 'string' ? JSON.parse(data.nodes) : data.nodes || [],
      edges: typeof data.edges === 'string' ? JSON.parse(data.edges) : data.edges || [],
      status: data.status,
      isActive: data.is_active,
      phoneNumberId: data.phone_number_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    return NextResponse.json(workflow)
  } catch (error) {
    console.error('[GET /api/flows/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar workflow' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/flows/[id]
 * Atualiza um workflow existente
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const { name, nodes, edges } = body
    const now = new Date().toISOString()

    const { error } = await supabase
      .from('workflows')
      .update({
        name,
        nodes: JSON.stringify(nodes || []),
        edges: JSON.stringify(edges || []),
        updated_at: now,
      })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      id,
      name,
      nodes,
      edges,
      updatedAt: now
    })
  } catch (error) {
    console.error('[PUT /api/flows/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar workflow' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/flows/[id]
 * Deleta um workflow
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { error } = await supabase
      .from('workflows')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/flows/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar workflow' },
      { status: 500 }
    )
  }
}
