# SmartZap - Arquitetura Frontend

## Visão Geral

Este projeto segue o **Padrão Ouro** de arquitetura React, separando estritamente lógica de negócio da UI.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Page (Thin)                               │
│  app/(dashboard)/campaigns/page.tsx                             │
│  - Apenas conecta Controller à View                             │
│  - Nenhuma lógica de negócio                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┴───────────────────┐
          ▼                                       ▼
┌─────────────────────────┐         ┌─────────────────────────────┐
│   Controller (Hook)     │         │      View (Component)       │
│   hooks/useCampaigns.ts │         │  CampaignListView.tsx       │
│                         │         │                             │
│ • React Query           │         │ • Props only                │
│ • Mutations             │  ────►  │ • Event callbacks           │
│ • UI State              │         │ • Zero business logic       │
│ • Business Logic        │         │ • Pure presentational       │
│ • Derived State         │         │                             │
└─────────────────────────┘         └─────────────────────────────┘
          │
          ▼
┌─────────────────────────┐
│      Service Layer      │
│  services/campaign*.ts  │
│                         │
│ • API calls (fetch)     │
│ • Data transformation   │
└─────────────────────────┘
          │
          ▼
┌─────────────────────────┐
│      API Routes         │
│  app/api/campaigns/*    │
│                         │
│ • Next.js API handlers  │
│ • Database operations   │
│ • Turso/Redis           │
└─────────────────────────┘
```

---

## Estrutura de Pastas

```
smartzapv2/
├── app/
│   ├── (dashboard)/              # Rotas autenticadas
│   │   ├── campaigns/
│   │   │   └── page.tsx          # Page: cola controller + view
│   │   ├── contacts/
│   │   └── settings/
│   ├── api/                      # API Routes (Backend)
│   │   ├── campaigns/
│   │   ├── contacts/
│   │   └── webhook/
│   └── providers.tsx             # React Query + Contexts
│
├── hooks/                        # Controllers (Smart)
│   ├── useCampaigns.ts           # Lógica de campanhas
│   ├── useContacts.ts            # Lógica de contatos
│   ├── useDashboard.ts           # Lógica do dashboard
│   └── useTemplates.ts           # Lógica de templates
│
├── components/
│   ├── features/                 # Views por domínio (Dumb)
│   │   ├── campaigns/
│   │   │   ├── CampaignListView.tsx
│   │   │   ├── CampaignDetailsView.tsx
│   │   │   └── CampaignWizardView.tsx
│   │   ├── contacts/
│   │   │   └── ContactListView.tsx
│   │   └── dashboard/
│   │       └── DashboardView.tsx
│   └── ui/                       # Componentes reutilizáveis
│       └── PrefetchLink.tsx
│
├── services/                     # API Client Layer
│   ├── campaignService.turso.ts
│   ├── contactService.turso.ts
│   └── templateService.ts
│
├── lib/                          # Utilities & Clients
│   ├── turso.ts                  # Database client
│   ├── redis.ts                  # Cache client
│   └── phone-formatter.ts        # Helpers
│
└── types.ts                      # TypeScript types
```

---

## Padrões Implementados

### 1. Smart vs Dumb Components

#### Controller Hook (Smart)
```typescript
// hooks/useCampaigns.ts
export const useCampaignsController = () => {
  // React Query para dados do servidor
  const { data: campaigns = [], isLoading } = useCampaignsQuery();
  
  // Estado de UI local
  const [filter, setFilter] = useState<string>('All');
  
  // Lógica de negócio (derived state)
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => filter === 'All' || c.status === filter);
  }, [campaigns, filter]);
  
  // Handlers
  const handleDelete = (id: string) => deleteCampaign(id);
  
  return {
    campaigns: filteredCampaigns,
    isLoading,
    filter,
    setFilter,
    onDelete: handleDelete,
  };
};
```

#### View Component (Dumb)
```typescript
// components/features/campaigns/CampaignListView.tsx
interface CampaignListViewProps {
  campaigns: Campaign[];      // Dados via props
  isLoading: boolean;
  filter: string;
  onFilterChange: (v: string) => void;  // Eventos como callbacks
  onDelete: (id: string) => void;
}

export const CampaignListView: React.FC<CampaignListViewProps> = ({
  campaigns,
  onDelete,
  // ...
}) => {
  // ZERO lógica de negócio aqui
  // Apenas renderização e eventos
  return (
    <table>
      {campaigns.map(c => (
        <tr key={c.id}>
          <td>{c.name}</td>
          <button onClick={() => onDelete(c.id)}>Delete</button>
        </tr>
      ))}
    </table>
  );
};
```

#### Page (Thin Connector)
```typescript
// app/(dashboard)/campaigns/page.tsx
export default function CampaignsPage() {
  const controller = useCampaignsController();
  
  return (
    <CampaignListView
      campaigns={controller.campaigns}
      isLoading={controller.isLoading}
      onDelete={controller.onDelete}
      // ...spread all props
    />
  );
}
```

---

### 2. State Management

| Tipo de Estado | Solução | Exemplo |
|----------------|---------|---------|
| **Servidor/Dados** | React Query | Campanhas, Contatos, Templates |
| **UI Local** | useState | Filtros, modais, searchTerm |
| **UI Global** | Context API | Theme, Auth |
| **Derived** | useMemo | filteredCampaigns |

```typescript
// providers.tsx - React Query configurado
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,      // 30s dados frescos
      gcTime: 5 * 60 * 1000,     // 5min no cache
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
```

---

### 3. Mutations com Optimistic Updates

```typescript
const deleteMutation = useMutation({
  mutationFn: campaignService.delete,
  
  // 1. Antes da API: atualiza UI imediatamente
  onMutate: async (id) => {
    await queryClient.cancelQueries({ queryKey: ['campaigns'] });
    const previousData = queryClient.getQueryData(['campaigns']);
    
    // Remove otimisticamente
    queryClient.setQueryData(['campaigns'], (old) => 
      old?.filter(c => c.id !== id)
    );
    
    return { previousData };
  },
  
  // 2. Erro: rollback
  onError: (err, id, context) => {
    queryClient.setQueryData(['campaigns'], context.previousData);
  },
  
  // 3. Sucesso: sincroniza com servidor
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['campaigns'] });
  },
});
```

---

### 4. Service Layer

```typescript
// services/campaignService.turso.ts
export const campaignService = {
  getAll: async (): Promise<Campaign[]> => {
    const response = await fetch('/api/campaigns', { 
      cache: 'no-store' 
    });
    if (!response.ok) throw new Error('Failed to fetch');
    return response.json();
  },
  
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`/api/campaigns/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete');
  },
  
  duplicate: async (id: string): Promise<Campaign> => {
    const response = await fetch(`/api/campaigns/${id}/duplicate`, {
      method: 'POST',
    });
    return response.json();
  },
};
```

---

## Fluxo de Dados

```
User Action
    │
    ▼
┌─────────────────┐
│  View Component │  onClick={() => onDelete(id)}
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Controller Hook │  handleDelete → deleteMutation.mutate(id)
└────────┬────────┘
         │
         ├──► Optimistic Update (UI imediata)
         │
         ▼
┌─────────────────┐
│  Service Layer  │  fetch('/api/campaigns/123', { method: 'DELETE' })
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Route     │  DELETE /api/campaigns/[id]
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Turso DB    │  DELETE FROM campaigns WHERE id = ?
└─────────────────┘
```

---

## Performance

### Evitar Re-renders

1. **Contextos por Domínio** - Não usar contexto monolítico
2. **useMemo para Derived State** - Filtros, buscas, cálculos
3. **React Query Cache** - Evita refetch desnecessário
4. **Optimistic Updates** - UI responsiva sem esperar API

### Configurações Atuais

```typescript
// staleTime: dados considerados frescos por 15-30s
// gcTime: cache mantido por 5 minutos
// refetchOnWindowFocus: false
// retry: 1 tentativa em falhas
```

---

## Checklist para Novos Recursos

- [ ] Criar **Service** em `services/` com chamadas API
- [ ] Criar **Controller Hook** em `hooks/use[Feature].ts`
- [ ] Criar **View Component** em `components/features/[feature]/`
- [ ] Criar **Page** em `app/(dashboard)/[feature]/page.tsx`
- [ ] View recebe apenas **props** e emite **callbacks**
- [ ] Lógica de negócio **apenas** no Controller Hook
- [ ] Usar **React Query** para dados do servidor
- [ ] Usar **useState** para estado de UI local
