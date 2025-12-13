'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Plus, Workflow, Trash2, Edit3, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

// Formata data relativa simples
function formatRelativeTime(date: string): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'agora'
  if (diffMins < 60) return `há ${diffMins} min`
  if (diffHours < 24) return `há ${diffHours}h`
  if (diffDays < 7) return `há ${diffDays} dias`
  return then.toLocaleDateString('pt-BR')
}

interface WorkflowItem {
  id: string
  name: string
  status: string
  createdAt: string
  updatedAt: string
  nodes: unknown[]
  edges: unknown[]
}

export default function WorkflowsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: workflows = [], isLoading } = useQuery<WorkflowItem[]>({
    queryKey: ['workflows'],
    queryFn: async () => {
      const res = await fetch('/api/flows')
      if (!res.ok) throw new Error('Failed to fetch workflows')
      return res.json()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/flows/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      setDeletingId(null)
    },
  })

  const handleNew = () => {
    router.push('/workflow')
  }

  const handleEdit = (id: string) => {
    // TODO: Implementar carregamento de workflow existente
    router.push(`/workflow?id=${id}`)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este workflow?')) {
      setDeletingId(id)
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Workflows</h1>
          <p className="text-gray-400 mt-1">
            Gerencie seus fluxos de automação
          </p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Workflow
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && workflows.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-zinc-700 rounded-2xl bg-zinc-900/50">
          <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mb-4">
            <Workflow className="w-8 h-8 text-primary-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Nenhum workflow ainda
          </h3>
          <p className="text-gray-400 text-center max-w-md mb-6">
            Crie seu primeiro workflow para automatizar conversas no WhatsApp com inteligência artificial.
          </p>
          <Button onClick={handleNew} className="gap-2">
            <Plus className="w-4 h-4" />
            Criar Primeiro Workflow
          </Button>
        </div>
      )}

      {/* Workflow Grid */}
      {!isLoading && workflows.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className="group relative bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all cursor-pointer"
              onClick={() => handleEdit(workflow.id)}
            >
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  workflow.status === 'published' 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-zinc-700 text-zinc-400'
                }`}>
                  {workflow.status === 'published' ? 'Publicado' : 'Rascunho'}
                </span>
              </div>

              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center mb-4">
                <Workflow className="w-6 h-6 text-primary-500" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-white mb-1 pr-16">
                {workflow.name}
              </h3>
              <p className="text-sm text-gray-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {formatRelativeTime(workflow.updatedAt)}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-zinc-800">
                <span className="text-xs text-gray-500">
                  {workflow.nodes?.length || 0} nós
                </span>
                <span className="text-xs text-gray-500">
                  {workflow.edges?.length || 0} conexões
                </span>
              </div>

              {/* Actions */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEdit(workflow.id)
                  }}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(workflow.id)
                  }}
                  disabled={deletingId === workflow.id}
                >
                  {deletingId === workflow.id ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
