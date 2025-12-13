# Quickstart: Flow Engine

**Feature**: 003-flow-engine  
**Date**: 2025-01-03  
**Status**: ✅ Implementado

## Overview

Guia rápido para desenvolvedores trabalharem com o Flow Engine.

---

## 1. Arquitetura Básica

```
┌─────────────────────────────────────────────────────────────┐
│                      Flow Engine                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────────┐        ┌──────────────┐                  │
│   │   Campaign   │        │   Chatbot    │                  │
│   │    Mode      │        │    Mode      │                  │
│   └──────┬───────┘        └──────┬───────┘                  │
│          │                       │                          │
│          └───────────┬───────────┘                          │
│                      ▼                                       │
│              ┌───────────────┐                              │
│              │    Executor   │                              │
│              └───────┬───────┘                              │
│                      │                                       │
│     ┌────────────────┼────────────────┐                     │
│     ▼                ▼                ▼                     │
│ ┌────────┐    ┌────────────┐    ┌──────────┐              │
│ │ State  │    │    Node    │    │ WhatsApp │              │
│ │Manager │    │  Executors │    │   API    │              │
│ └────────┘    └────────────┘    └──────────┘              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Estrutura de Diretórios

```
lib/flow-engine/
├── index.ts              # Exports públicos
├── executor.ts           # Motor principal
├── state.ts              # Gerenciamento de estado (Redis)
├── variables.ts          # Substituição de variáveis
├── validator.ts          # Validação de flows
├── error-handler.ts      # Tratamento de erros
├── sender.ts             # Envio de mensagens WhatsApp
├── nodes/
│   ├── index.ts          # Registry de nodes
│   ├── base.ts           # Interface NodeExecutor
│   ├── README.md         # Documentação de extensão
│   ├── message.ts        # Mensagem de texto
│   ├── image.ts          # Imagem
│   ├── video.ts          # Vídeo
│   ├── audio.ts          # Áudio
│   ├── document.ts       # Documento
│   ├── sticker.ts        # Figurinha
│   ├── location.ts       # Localização
│   ├── contacts.ts       # vCard
│   ├── reaction.ts       # Reação (emoji)
│   ├── template.ts       # Template aprovado
│   ├── buttons.ts        # Botões de resposta
│   ├── list.ts           # Lista de opções
│   ├── carousel.ts       # Carrossel
│   ├── cta-url.ts        # Call-to-action URL
│   ├── menu-executor.ts  # Menu automático
│   ├── input-executor.ts # Coleta de input
│   ├── delay-executor.ts # Delay
│   ├── condition-executor.ts # Condição if/else
│   ├── jump.ts           # Salto para nó
│   ├── handoff-executor.ts # Transferência para humano
│   ├── start-executor.ts # Início do fluxo
│   ├── end-executor.ts   # Fim do fluxo
│   └── ai-agent.ts       # Agente de IA (Gemini)
└── modes/
    ├── campaign.ts       # Modo campanha
    └── chatbot.ts        # Modo chatbot
```

---

## 3. API Endpoints

### Executar Flow

```bash
# POST /api/flow-engine/execute
curl -X POST http://localhost:3000/api/flow-engine/execute \
  -H "Content-Type: application/json" \
  -d '{
    "flowId": "flow-123",
    "mode": "campaign",
    "contacts": [
      { "phone": "+5511999999999", "name": "João" }
    ]
  }'

# Response (202 Accepted)
{
  "success": true,
  "executionId": "exec-abc123",
  "status": "pending",
  "contactCount": 1
}
```

### Verificar Status

```bash
# GET /api/flow-engine/status/{executionId}
curl http://localhost:3000/api/flow-engine/status/exec-abc123

# Response
{
  "success": true,
  "execution": {
    "id": "exec-abc123",
    "flowId": "flow-123",
    "mode": "campaign",
    "status": "completed",
    "contactCount": 1,
    "sentCount": 1,
    "deliveredCount": 1,
    "failedCount": 0,
    "progress": 100
  }
}
```

### Listar Execuções

```bash
# GET /api/flow-engine/executions
curl "http://localhost:3000/api/flow-engine/executions?mode=campaign&limit=10"

# Response
{
  "success": true,
  "executions": [...],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

### Ver Nodes Executados

```bash
# GET /api/flow-engine/executions/{id}/nodes
curl http://localhost:3000/api/flow-engine/executions/exec-abc123/nodes

# Response
{
  "success": true,
  "nodes": [
    {
      "id": "ne-123",
      "nodeId": "start-1",
      "nodeType": "start",
      "status": "completed",
      "createdAt": "2025-01-03T10:00:00Z"
    }
  ]
}
```

### Pausar Execução

```bash
# POST /api/flow-engine/status/{id}/pause
curl -X POST http://localhost:3000/api/flow-engine/status/exec-abc123/pause

# Response
{
  "success": true,
  "executionId": "exec-abc123",
  "status": "paused",
  "pausedAt": "2025-01-03T10:05:00Z",
  "pendingContacts": 50
}
```

### Retomar Execução

```bash
# POST /api/flow-engine/status/{id}/resume
curl -X POST http://localhost:3000/api/flow-engine/status/exec-abc123/resume

# Response
{
  "success": true,
  "executionId": "exec-abc123",
  "status": "running",
  "resumedAt": "2025-01-03T10:10:00Z",
  "remainingContacts": 50
}
```

### Cancelar Execução

```bash
# DELETE /api/flow-engine/status/{id}
curl -X DELETE http://localhost:3000/api/flow-engine/status/exec-abc123

# Response
{
  "success": true,
  "executionId": "exec-abc123",
  "status": "cancelled",
  "cancelledAt": "2025-01-03T10:15:00Z",
  "sentBeforeCancel": 25
}
```

---

## 4. Criando um Novo Node

Veja a documentação completa em `lib/flow-engine/nodes/README.md`.

### Exemplo Rápido

```typescript
// lib/flow-engine/nodes/my-node.ts
import type { FlowNode, FlowEdge } from '@/types'
import type { 
  NodeExecutor, 
  ExecutionContext, 
  NodeExecutionResult,
  WhatsAppMessagePayload 
} from './base'
import { findOutgoingEdge } from './base'

export interface MyNodeData {
  customField: string
}

export const myNodeExecutor: NodeExecutor<MyNodeData> = {
  type: 'my_node',
  
  async execute(
    context: ExecutionContext,
    node: FlowNode & { data: MyNodeData }
  ): Promise<NodeExecutionResult> {
    const message: WhatsAppMessagePayload = {
      type: 'text',
      payload: {
        messaging_product: 'whatsapp',
        to: context.contactPhone,
        type: 'text',
        text: { body: node.data.customField },
      },
    }
    
    const nextEdge = findOutgoingEdge(context.edges, node.id)
    
    return {
      success: true,
      messages: [message],
      nextNodeId: nextEdge?.target,
    }
  },
}

// Registrar em nodes/index.ts:
// registerNodeExecutor(myNodeExecutor)
```

---

## 5. Variáveis Disponíveis

```typescript
// Variáveis built-in
{{contact_phone}}  // Telefone do contato (E.164)
{{contact_name}}   // Nome do contato
{{last_message}}   // Última mensagem recebida
{{current_date}}   // Data atual (DD/MM/YYYY)
{{current_time}}   // Hora atual (HH:MM)

// Variáveis customizadas (coletadas via input node)
{{nome}}           // Variável definida pelo fluxo
{{email}}          // Variável definida pelo fluxo
```

---

## 6. Debugging

### Ativar Logs

```bash
# .env.local
FLOW_ENGINE_DEBUG=true
```

### Logs Produzidos

```
[FlowEngine:Debug] Processing chatbot message from +5511999999999
[V3] Found 2 flows (1 from flows table, 1 from workflows table)
[V3] Checking flow "Boas Vindas" (flow-123), trigger: {"type":"keyword","value":"oi"}
[V3] ✅ Flow "Boas Vindas" matched!
[V3] Executing node: message (node-456)
📱 [V3] Sending text message to +5511999999999
```

---

## 7. Nodes Suportados

| Categoria | Nodes | Espera Resposta |
|-----------|-------|-----------------|
| **Mensagens** | message, template | ❌ / Depende |
| **Mídia** | image, video, audio, document, sticker, location, contacts, reaction | ❌ |
| **Interativos** | buttons, list, menu, input, cta_url, carousel | ✅ (maioria) |
| **Controle** | start, end, condition, delay, jump, handoff | ❌ |
| **Avançados** | ai_agent | ❌ |

---

## 8. Recursos

- [Spec: Flow Engine](./spec.md)
- [Data Model](./data-model.md)
- [API Contracts](./contracts/api-contracts.md)
- [Node Executors README](../../lib/flow-engine/nodes/README.md)
- [WhatsApp Cloud API Reference](../../docs/WHATSAPP-TEMPLATE-API-REFERENCE.md)
