# Research: Supabase Realtime Integration

**Feature**: 001-supabase-realtime
**Date**: 2025-12-06

## Research Tasks Completed

### 1. Supabase Realtime Best Practices

**Decision**: Usar RealtimeChannel com Postgres Changes listener

**Rationale**: 
- Supabase Realtime v2 oferece três tipos de eventos: Broadcast, Presence, e Postgres Changes
- Postgres Changes é ideal para sincronizar UI com mudanças no banco
- Suporta filtros por tabela, schema, e até row-level (usando filter)

**Alternatives Considered**:
- Polling: Rejeitado - maior latência, mais requests
- Server-Sent Events: Rejeitado - não nativo ao Supabase
- WebSocket custom: Rejeitado - Supabase já provê abstração

**Best Practices**:
```typescript
// Criar channel uma vez, reutilizar
const channel = supabase.channel('db-changes')

// Subscrever a múltiplas tabelas no mesmo channel
channel
  .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, handler)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'contacts' }, handler)
  .subscribe()

// Cleanup obrigatório
return () => { supabase.removeChannel(channel) }
```

---

### 2. React Query + Realtime Integration

**Decision**: Atualizar cache do React Query via `queryClient.setQueryData()`

**Rationale**:
- Evita duplicação de estado (React Query já gerencia cache)
- Mantém consistência entre refresh manual e updates realtime
- Optimistic updates já funcionam normalmente

**Alternatives Considered**:
- Estado separado para Realtime: Rejeitado - duplicação, inconsistência
- Invalidar query: Parcialmente aceito - para updates complexos (DELETE)
- Substituir React Query: Rejeitado - já está em uso no projeto

**Best Practices**:
```typescript
// Para INSERT: adicionar ao cache
queryClient.setQueryData(['campaigns'], (old) => [...old, newCampaign])

// Para UPDATE: atualizar item específico
queryClient.setQueryData(['campaigns'], (old) => 
  old.map(c => c.id === updated.id ? updated : c)
)

// Para DELETE: invalidar para refetch limpo
queryClient.invalidateQueries({ queryKey: ['campaigns'] })
```

---

### 3. Connection Management

**Decision**: Um único channel por feature/página, gerenciado por Provider

**Rationale**:
- Supabase Free: limite de 200 conexões simultâneas
- Cada channel é uma conexão WebSocket separada
- Provider evita múltiplas conexões da mesma página

**Alternatives Considered**:
- Channel por tabela: Rejeitado - muitas conexões
- Channel global único: Parcialmente aceito - difícil gerenciar lifecycle
- Channel por componente: Rejeitado - memory leaks, duplicação

**Best Practices**:
- Máximo 5 channels por usuário
- Unsubscribe quando componente desmonta
- Reconnect automático com exponential backoff (nativo do Supabase)

---

### 4. Enabling Realtime on Tables

**Decision**: Habilitar Realtime via ALTER PUBLICATION

**Rationale**:
- Supabase requer que tabelas sejam adicionadas à publication `supabase_realtime`
- Pode ser feito via Dashboard ou SQL migration

**SQL Required**:
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

---

### 5. Debouncing Updates

**Decision**: Debounce de 200ms para updates frequentes

**Rationale**:
- Campanhas podem gerar dezenas de updates por segundo
- UI não precisa atualizar mais que 5x/segundo
- Previne flickering e sobrecarga de re-renders

**Implementation**:
```typescript
const debouncedSetData = useMemo(
  () => debounce((data) => queryClient.setQueryData(key, data), 200),
  [queryClient, key]
)
```

---

### 6. Graceful Degradation

**Decision**: Sistema funciona normalmente se Realtime falhar

**Rationale**:
- Realtime é enhancement, não requisito
- Usuário sempre pode dar refresh manual
- Logs de erro para debugging

**Implementation**:
```typescript
channel.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    setIsRealtimeConnected(true)
  } else if (status === 'CHANNEL_ERROR') {
    console.error('Realtime failed, falling back to manual refresh')
    setIsRealtimeConnected(false)
  }
})
```

## Unknowns Resolved

| Unknown | Resolution |
|---------|------------|
| Como habilitar Realtime? | ALTER PUBLICATION supabase_realtime ADD TABLE |
| Quantas conexões usar? | Máximo 5 por usuário, 1 por feature |
| Como integrar com React Query? | setQueryData() para INSERT/UPDATE, invalidate para DELETE |
| Como lidar com falhas? | Graceful degradation + indicador visual |
