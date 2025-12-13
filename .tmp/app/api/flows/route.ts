import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const generateId = () => `wf_${Math.random().toString(36).substr(2, 9)}`

/**
 * GET /api/flows
 * Lista todos os workflows
 */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) throw error

    const workflows = (data || []).map(row => ({
      id: row.id,
      name: row.name,
      nodes: typeof row.nodes === 'string' ? JSON.parse(row.nodes) : row.nodes || [],
      edges: typeof row.edges === 'string' ? JSON.parse(row.edges) : row.edges || [],
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))

    return NextResponse.json(workflows, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30'
      }
    })
  } catch (error) {
    console.error('[GET /api/flows] Error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar workflows' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/flows
 * Cria um novo workflow
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, nodes, edges } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    const id = generateId()
    const now = new Date().toISOString()

    const { error } = await supabase
      .from('workflows')
      .insert({
        id,
        name,
        nodes: JSON.stringify(nodes || []),
        edges: JSON.stringify(edges || []),
        status: 'draft',
        created_at: now,
        updated_at: now,
      })

    if (error) throw error

    return NextResponse.json({
      id,
      name,
      nodes: nodes || [],
      edges: edges || [],
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/flows] Error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar workflow' },
      { status: 500 }
    )
  }
}
