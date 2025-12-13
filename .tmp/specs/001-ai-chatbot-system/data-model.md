# Data Model: Sistema de Chatbot WhatsApp

**Date**: 2025-12-03  
**Database**: Turso (SQLite)

## Entity Relationship Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Bot      │────<│    Flow     │────<│  FlowNode   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Conversation│────<│   Message   │     │ContactVariable│
└─────────────┘     └─────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  AIAgent    │────<│    Tool     │────<│ToolExecution│
└─────────────┘     └─────────────┘     └─────────────┘
```

## Tables

### bots

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK | UUID |
| name | TEXT | NOT NULL | Nome do bot |
| phone_number_id | TEXT | NOT NULL, FK | ID do número WhatsApp |
| flow_id | TEXT | FK | Fluxo ativo (nullable) |
| status | TEXT | NOT NULL | 'active' \| 'inactive' \| 'draft' |
| welcome_message | TEXT | | Mensagem de boas-vindas |
| fallback_message | TEXT | | Mensagem para input não reconhecido |
| session_timeout_minutes | INTEGER | DEFAULT 30 | Timeout de sessão |
| created_at | TEXT | NOT NULL | ISO timestamp |
| updated_at | TEXT | NOT NULL | ISO timestamp |

**Indexes**: `phone_number_id`, `status`

---

### flows

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK | UUID |
| bot_id | TEXT | NOT NULL, FK | Bot owner |
| name | TEXT | NOT NULL | Nome do fluxo |
| nodes | TEXT | NOT NULL | JSON array de nós |
| edges | TEXT | NOT NULL | JSON array de arestas |
| version | INTEGER | DEFAULT 1 | Versão do fluxo |
| status | TEXT | NOT NULL | 'draft' \| 'published' |
| created_at | TEXT | NOT NULL | ISO timestamp |
| updated_at | TEXT | NOT NULL | ISO timestamp |

**Indexes**: `bot_id`, `status`

---

### conversations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK | UUID |
| bot_id | TEXT | NOT NULL, FK | Bot da conversa |
| contact_phone | TEXT | NOT NULL | Telefone do contato (E.164) |
| contact_name | TEXT | | Nome do contato |
| current_node_id | TEXT | | Nó atual do fluxo |
| status | TEXT | NOT NULL | 'active' \| 'paused' \| 'ended' |
| assigned_operator_id | TEXT | | ID do operador (se handoff) |
| csw_started_at | TEXT | | Início da Customer Service Window |
| last_message_at | TEXT | | Última mensagem recebida |
| created_at | TEXT | NOT NULL | ISO timestamp |
| updated_at | TEXT | NOT NULL | ISO timestamp |

**Indexes**: `bot_id`, `contact_phone`, `status`, `assigned_operator_id`

---

### conversation_variables

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK | UUID |
| conversation_id | TEXT | NOT NULL, FK | Conversa |
| key | TEXT | NOT NULL | Nome da variável |
| value | TEXT | NOT NULL | Valor |
| collected_at | TEXT | NOT NULL | Quando foi coletada |

**Indexes**: `conversation_id`, `(conversation_id, key)` UNIQUE

---

### messages

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK | UUID |
| conversation_id | TEXT | NOT NULL, FK | Conversa |
| wa_message_id | TEXT | | ID da mensagem no WhatsApp |
| direction | TEXT | NOT NULL | 'inbound' \| 'outbound' |
| origin | TEXT | NOT NULL | 'client' \| 'bot' \| 'operator' \| 'ai' |
| type | TEXT | NOT NULL | 'text' \| 'interactive' \| 'template' \| 'image' \| etc |
| content | TEXT | NOT NULL | JSON do conteúdo |
| status | TEXT | NOT NULL | 'pending' \| 'sent' \| 'delivered' \| 'read' \| 'failed' |
| error | TEXT | | Mensagem de erro (se falhou) |
| created_at | TEXT | NOT NULL | ISO timestamp |
| delivered_at | TEXT | | Quando foi entregue |
| read_at | TEXT | | Quando foi lida |

**Indexes**: `conversation_id`, `wa_message_id`, `created_at`

---

### ai_agents

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK | UUID |
| name | TEXT | NOT NULL | Nome do agente |
| system_prompt | TEXT | NOT NULL | Prompt de sistema |
| model | TEXT | NOT NULL | 'gemini-1.5-flash' \| 'gemini-1.5-pro' |
| max_tokens | INTEGER | DEFAULT 500 | Limite de tokens |
| temperature | REAL | DEFAULT 0.7 | Criatividade |
| created_at | TEXT | NOT NULL | ISO timestamp |
| updated_at | TEXT | NOT NULL | ISO timestamp |

---

### ai_tools

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK | UUID |
| agent_id | TEXT | NOT NULL, FK | Agente owner |
| name | TEXT | NOT NULL | Nome da tool |
| description | TEXT | NOT NULL | Descrição para IA |
| parameters_schema | TEXT | NOT NULL | JSON Schema dos parâmetros |
| webhook_url | TEXT | NOT NULL | URL do webhook |
| timeout_ms | INTEGER | DEFAULT 10000 | Timeout |
| created_at | TEXT | NOT NULL | ISO timestamp |

**Indexes**: `agent_id`

---

### tool_executions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK | UUID |
| tool_id | TEXT | NOT NULL, FK | Tool executada |
| conversation_id | TEXT | NOT NULL, FK | Conversa |
| input | TEXT | NOT NULL | JSON dos parâmetros |
| output | TEXT | | JSON do resultado |
| duration_ms | INTEGER | | Duração |
| status | TEXT | NOT NULL | 'pending' \| 'success' \| 'failed' |
| error | TEXT | | Erro se falhou |
| created_at | TEXT | NOT NULL | ISO timestamp |

**Indexes**: `tool_id`, `conversation_id`, `created_at`

---

## Redis Keys (Cache Hot)

| Key Pattern | TTL | Description |
|-------------|-----|-------------|
| `conv:${conversationId}` | 1h | Estado da conversa ativa |
| `conv:${conversationId}:vars` | 1h | Variáveis da conversa |
| `rate:${phoneId}:${recipientPhone}` | 6s | Rate limit por par |
| `csw:${phoneId}:${recipientPhone}` | 24h | Customer Service Window |
| `flow:${flowId}` | 10m | Cache do fluxo (evita DB hit) |

---

## State Sync Strategy

```
1. Mensagem chega
2. Redis: GET conv:${id}
   - Se existe: usar
   - Se não existe: buscar do Turso, SET no Redis
3. Processar nó
4. Redis: SET conv:${id} (novo estado)
5. Se mudou de nó: Turso UPDATE conversations
6. Sempre: Turso INSERT messages
```

---

## Migration SQL

```sql
-- Bots
CREATE TABLE IF NOT EXISTS bots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone_number_id TEXT NOT NULL,
  flow_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  welcome_message TEXT,
  fallback_message TEXT,
  session_timeout_minutes INTEGER DEFAULT 30,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_bots_phone ON bots(phone_number_id);
CREATE INDEX idx_bots_status ON bots(status);

-- Flows
CREATE TABLE IF NOT EXISTS flows (
  id TEXT PRIMARY KEY,
  bot_id TEXT NOT NULL,
  name TEXT NOT NULL,
  nodes TEXT NOT NULL DEFAULT '[]',
  edges TEXT NOT NULL DEFAULT '[]',
  version INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (bot_id) REFERENCES bots(id)
);

CREATE INDEX idx_flows_bot ON flows(bot_id);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  bot_id TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_name TEXT,
  current_node_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  assigned_operator_id TEXT,
  csw_started_at TEXT,
  last_message_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (bot_id) REFERENCES bots(id)
);

CREATE INDEX idx_conv_bot ON conversations(bot_id);
CREATE INDEX idx_conv_phone ON conversations(contact_phone);
CREATE INDEX idx_conv_status ON conversations(status);

-- Conversation Variables
CREATE TABLE IF NOT EXISTS conversation_variables (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  collected_at TEXT NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  UNIQUE(conversation_id, key)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  wa_message_id TEXT,
  direction TEXT NOT NULL,
  origin TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  created_at TEXT NOT NULL,
  delivered_at TEXT,
  read_at TEXT,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

CREATE INDEX idx_msg_conv ON messages(conversation_id);
CREATE INDEX idx_msg_wa ON messages(wa_message_id);

-- AI Agents
CREATE TABLE IF NOT EXISTS ai_agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
  max_tokens INTEGER DEFAULT 500,
  temperature REAL DEFAULT 0.7,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- AI Tools
CREATE TABLE IF NOT EXISTS ai_tools (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  parameters_schema TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  timeout_ms INTEGER DEFAULT 10000,
  created_at TEXT NOT NULL,
  FOREIGN KEY (agent_id) REFERENCES ai_agents(id)
);

-- Tool Executions
CREATE TABLE IF NOT EXISTS tool_executions (
  id TEXT PRIMARY KEY,
  tool_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  input TEXT NOT NULL,
  output TEXT,
  duration_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (tool_id) REFERENCES ai_tools(id),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

CREATE INDEX idx_exec_tool ON tool_executions(tool_id);
CREATE INDEX idx_exec_conv ON tool_executions(conversation_id);
```
