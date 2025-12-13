# Data Model: Flow Engine

**Feature**: 003-flow-engine  
**Date**: 2025-01-03

## Overview

Modelo de dados para o Flow Engine, definindo entidades de execução, estado e persistência.

---

## Entities

### 1. Flow (Existente - Expandir)

Definição do fluxo visual criado no editor.

```
Flow
├── id: string (UUID)
├── workspace_id: string (FK)
├── name: string
├── description?: string
├── nodes: FlowNode[] (JSON)
├── edges: FlowEdge[] (JSON)
├── trigger_config: TriggerConfig (JSON)
├── is_active: boolean
├── version: number
├── created_at: timestamp
└── updated_at: timestamp
```

**Relacionamentos**:
- 1 Flow → N FlowExecutions
- 1 Workspace → N Flows

---

### 2. FlowExecution (Novo)

Instância de execução de um flow (campanha ou sessão de chat).

```
FlowExecution
├── id: string (UUID)
├── flow_id: string (FK → Flow)
├── mode: 'campaign' | 'chatbot'
├── status: 'pending' | 'running' | 'paused' | 'completed' | 'failed'
├── trigger_source: string (campaign_id ou webhook_message_id)
├── contact_count: number (para campanha)
├── sent_count: number
├── delivered_count: number
├── failed_count: number
├── started_at?: timestamp
├── completed_at?: timestamp
├── error?: string
├── metadata: JSON (variáveis globais, config)
├── created_at: timestamp
└── updated_at: timestamp
```

**Relacionamentos**:
- 1 FlowExecution → N NodeExecutions
- 1 FlowExecution → N ConversationStates (chatbot)

**Índices**:
- `flow_id` + `status` (buscar execuções ativas)
- `created_at` (ordenação)

---

### 3. NodeExecution (Novo)

Registro de execução de cada node individual.

```
NodeExecution
├── id: string (UUID)
├── execution_id: string (FK → FlowExecution)
├── node_id: string (referência ao node no JSON do flow)
├── node_type: NodeType
├── contact_phone?: string (para campanhas)
├── status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
├── input: JSON (dados de entrada)
├── output: JSON (resultado/mensagem enviada)
├── whatsapp_message_id?: string
├── error_code?: number
├── error_message?: string
├── duration_ms: number
├── started_at: timestamp
├── completed_at?: timestamp
└── created_at: timestamp
```

**Relacionamentos**:
- N NodeExecutions → 1 FlowExecution

**Índices**:
- `execution_id` + `node_id` (buscar execução específica)
- `whatsapp_message_id` (lookup por webhook)
- `status` (buscar falhas)

---

### 4. ConversationState (Redis - Efêmero)

Estado atual de uma conversa ativa (chatbot mode).

```
ConversationState (Redis Key: workflow:{flow_id}:conversation:{phone})
├── flow_id: string
├── execution_id: string (FK → FlowExecution)
├── current_node_id: string
├── previous_node_id?: string
├── variables: Record<string, string>
├── conversation_history: Message[] (últimas 20)
├── started_at: timestamp
├── last_message_at: timestamp
└── expires_at: timestamp (TTL 24h)
```

**TTL**: 24 horas (expiração automática)

---

### 5. TemplateMapping (Redis - Efêmero)

Mapeia mensagens de template enviadas para seus nodes (para processar respostas de botões).

```
TemplateMapping (Redis Key: template:response:{message_id})
├── flow_id: string
├── execution_id: string
├── node_id: string
├── sent_at: timestamp
└── expires_at: timestamp (TTL 7d)
```

**TTL**: 7 dias

---

### 6. MessageQueue (Redis - Efêmero)

Fila de mensagens pendentes para rate limiting.

```
MessageQueue (Redis Key: queue:{execution_id})
├── messages: QueuedMessage[]
│   ├── id: string
│   ├── contact_phone: string
│   ├── node_id: string
│   ├── payload: WhatsAppPayload
│   ├── priority: number
│   ├── retry_count: number
│   └── scheduled_at: timestamp
└── processing: boolean
```

**Nota**: QStash já gerencia isso, mas podemos usar para retry granular.

---

## Node Types (Enum)

```typescript
type NodeType =
  // Controle
  | 'start'
  | 'end'
  | 'delay'
  | 'condition'      // if-else
  | 'jump'           // salto para outro node
  
  // Mensagens Simples
  | 'message'        // texto
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'sticker'
  | 'location'
  | 'contacts'       // vCard
  | 'reaction'
  
  // Mensagens Interativas
  | 'buttons'        // reply buttons (até 3)
  | 'list'           // list message (até 10 itens)
  | 'cta_url'        // call-to-action URL
  | 'carousel'       // carrossel de mídia
  
  // Templates
  | 'template'       // template pré-aprovado
  
  // Input
  | 'input'          // coleta texto do usuário
  | 'menu'           // menu de opções
  
  // Avançado
  | 'ai_agent'       // futuro node de IA
  | 'handoff'        // transferir para humano
```

---

## Execution Status (Enum)

```typescript
type ExecutionStatus =
  | 'pending'    // Criado, aguardando início
  | 'running'    // Em execução
  | 'paused'     // Pausado (campanha) ou aguardando input (chatbot)
  | 'completed'  // Finalizado com sucesso
  | 'failed'     // Falhou (erro crítico)
```

---

## Message Status (Enum)

```typescript
type MessageStatus =
  | 'pending'    // Na fila
  | 'sent'       // Enviado para WhatsApp
  | 'delivered'  // Entregue ao destinatário
  | 'read'       // Lido pelo destinatário
  | 'failed'     // Falhou no envio
```

---

## Database Schema (Turso SQL)

```sql
-- Flow Executions
CREATE TABLE IF NOT EXISTS flow_executions (
  id TEXT PRIMARY KEY,
  flow_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('campaign', 'chatbot')),
  status TEXT NOT NULL DEFAULT 'pending',
  trigger_source TEXT,
  contact_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  started_at TEXT,
  completed_at TEXT,
  error TEXT,
  metadata TEXT, -- JSON
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (flow_id) REFERENCES workflows(id)
);

CREATE INDEX idx_flow_executions_flow_status ON flow_executions(flow_id, status);
CREATE INDEX idx_flow_executions_created ON flow_executions(created_at);

-- Node Executions
CREATE TABLE IF NOT EXISTS node_executions (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  node_type TEXT NOT NULL,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  input TEXT, -- JSON
  output TEXT, -- JSON
  whatsapp_message_id TEXT,
  error_code INTEGER,
  error_message TEXT,
  duration_ms INTEGER,
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (execution_id) REFERENCES flow_executions(id)
);

CREATE INDEX idx_node_executions_execution ON node_executions(execution_id);
CREATE INDEX idx_node_executions_message ON node_executions(whatsapp_message_id);
CREATE INDEX idx_node_executions_status ON node_executions(status);
```

---

## Redis Key Patterns

| Pattern | Example | TTL | Purpose |
|---------|---------|-----|---------|
| `workflow:{flow_id}:conversation:{phone}` | `workflow:abc123:conversation:5511999999999` | 24h | Estado de conversa |
| `template:response:{message_id}` | `template:response:wamid.xxx` | 7d | Mapeamento de resposta |
| `execution:lock:{execution_id}` | `execution:lock:exec123` | 5min | Lock de execução |
| `webhook:processed:{message_id}:{status}` | `webhook:processed:wamid.xxx:delivered` | 7d | Deduplicação |

---

## Validation Rules

### FlowExecution
- `flow_id` deve referenciar flow existente e ativo
- `mode` deve ser 'campaign' ou 'chatbot'
- `contact_count` ≥ 0
- `sent_count` ≤ `contact_count`

### NodeExecution
- `execution_id` deve referenciar execução existente
- `node_id` deve existir no JSON do flow
- `duration_ms` ≥ 0

### ConversationState
- `current_node_id` deve existir no flow
- `variables` keys devem ser alphanumeric + underscore
- `conversation_history` máximo 20 mensagens

---

## State Transitions

### FlowExecution State Machine

```
pending → running → completed
            ↓         ↑
          paused ─────┘
            ↓
          failed
```

- `pending → running`: Início da execução
- `running → paused`: Campanha pausada ou aguardando input
- `paused → running`: Campanha retomada ou input recebido
- `running → completed`: Todos os nodes executados
- `running → failed`: Erro crítico (auth, payment)
- `paused → failed`: Timeout ou cancelamento

### NodeExecution State Machine

```
pending → running → completed
            ↓         ↑
          skipped ────┘
            ↓
          failed
```

- `pending → running`: Node sendo executado
- `running → completed`: Sucesso
- `running → failed`: Erro no envio
- `pending → skipped`: Condição não satisfeita
