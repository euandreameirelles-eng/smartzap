# Quickstart: Supabase Realtime Integration

**Feature**: 001-supabase-realtime
**Date**: 2025-12-06

## Pré-requisitos

1. Supabase project com Realtime habilitado (padrão em projetos novos)
2. Tabelas adicionadas à publication `supabase_realtime`

## Setup Inicial

### 1. Habilitar Realtime nas Tabelas

Execute no Supabase SQL Editor ou via migration:

```sql
-- Habilitar Realtime nas tabelas necessárias
ALTER PUBLICATION supabase_realtime ADD TABLE campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE campaign_contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE contacts;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE workflows;
ALTER PUBLICATION supabase_realtime ADD TABLE executions;
```

### 2. Adicionar RealtimeProvider

Em `app/providers.tsx`:

```tsx
import { RealtimeProvider } from '@/components/providers/RealtimeProvider'

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeProvider>
        {children}
      </RealtimeProvider>
    </QueryClientProvider>
  )
}
```

## Uso Básico

### Subscribir a uma Tabela

```tsx
import { useRealtimeQuery } from '@/hooks/useRealtimeQuery'

function CampaignDetailPage({ id }) {
  const { data: campaign } = useRealtimeQuery({
    queryKey: ['campaign', id],
    queryFn: () => fetchCampaign(id),
    table: 'campaigns',
    filter: `id=eq.${id}`,
  })
  
  // campaign atualiza automaticamente quando muda no banco
  return <div>{campaign.sent} / {campaign.total}</div>
}
```

### Subscribir a Múltiplas Tabelas

```tsx
const { data: contacts } = useRealtimeQuery({
  queryKey: ['contacts'],
  queryFn: fetchContacts,
  table: 'contacts',
  events: ['INSERT', 'UPDATE', 'DELETE'],
})
```

### Indicador de Conexão

```tsx
import { useRealtime } from '@/hooks/useRealtime'

function Header() {
  const { isConnected } = useRealtime()
  
  return (
    <div>
      {isConnected ? '🟢 Live' : '⚪ Offline'}
    </div>
  )
}
```

## Arquivos Criados

| Arquivo | Propósito |
|---------|-----------|
| `lib/supabase-realtime.ts` | Gerenciador de channels |
| `hooks/useRealtime.ts` | Context hook para status |
| `hooks/useRealtimeQuery.ts` | React Query + Realtime |
| `components/providers/RealtimeProvider.tsx` | Provider global |
| `components/ui/RealtimeIndicator.tsx` | Badge de status |

## Troubleshooting

### Eventos não chegam

1. Verifique se tabela está na publication:
   ```sql
   SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
   ```

2. Verifique RLS (Row Level Security):
   - Realtime respeita RLS
   - Usuário precisa ter SELECT permission

### Muitas conexões

- Limite: 200 conexões (Free tier)
- Solução: Usar 1 channel por feature, não por componente

### Memory Leaks

- Sempre cleanup no useEffect return
- Usar `supabase.removeChannel(channel)` no unmount
