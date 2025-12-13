# Data Model: Supabase Realtime Integration

**Feature**: 001-supabase-realtime
**Date**: 2025-12-06

## Entities

### RealtimeSubscription

| Field | Type | Description |
|-------|------|-------------|
| table | string | Nome da tabela (campaigns, contacts, etc.) |
| event | 'INSERT' \| 'UPDATE' \| 'DELETE' \| '*' | Tipo de evento a escutar |
| filter? | string | Filtro opcional (ex: `id=eq.${campaignId}`) |
| callback | (payload) => void | Handler para o evento |

### RealtimeEvent

| Field | Type | Description |
|-------|------|-------------|
| eventType | 'INSERT' \| 'UPDATE' \| 'DELETE' | Tipo do evento ocorrido |
| table | string | Tabela que originou o evento |
| schema | string | Schema (sempre 'public') |
| old | Record \| null | Dados antigos (UPDATE/DELETE) |
| new | Record \| null | Dados novos (INSERT/UPDATE) |
| commit_timestamp | string | Timestamp do commit |

### ChannelStatus

| Value | Description |
|-------|-------------|
| SUBSCRIBED | Conexão ativa e recebendo eventos |
| TIMED_OUT | Timeout na conexão |
| CLOSED | Canal fechado |
| CHANNEL_ERROR | Erro no canal |

## Tables with Realtime Enabled

As seguintes tabelas existentes precisam ter Realtime habilitado:

| Table | Events to Subscribe | Use Case |
|-------|---------------------|----------|
| campaigns | UPDATE | Status, contadores |
| campaign_contacts | INSERT, UPDATE | Progresso de envio |
| contacts | INSERT, UPDATE, DELETE | Lista de contatos |
| conversations | INSERT, UPDATE | Novas conversas |
| messages | INSERT | Novas mensagens |
| workflows | UPDATE | Status publicação |
| executions | INSERT, UPDATE | Progresso workflow |

## State Transitions

### Channel Lifecycle

```
INITIAL → subscribe() → SUBSCRIBED ↔ CHANNEL_ERROR
                           ↓
                        CLOSED (on unmount)
```

### Event Flow

```
Database Change → Supabase Realtime → WebSocket → Client Handler → React Query Cache → UI Re-render
```

## Validation Rules

- Channel name deve ser único por página/feature
- Filter deve usar sintaxe PostgREST válida
- Callback não deve fazer operações síncronas pesadas
- Cleanup obrigatório no unmount para evitar memory leaks
