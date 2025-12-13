# Flow Engine API Contracts

**Feature**: 003-flow-engine  
**Date**: 2025-01-03

## Overview

Contratos de API para o Flow Engine, definindo endpoints, payloads e respostas.

---

## 1. Execute Flow

### POST /api/flow-engine/execute

Inicia a execução de um flow.

**Request**:
```typescript
interface ExecuteFlowRequest {
  flowId: string
  mode: 'campaign' | 'chatbot'
  
  // Para modo campanha
  contacts?: Array<{
    phone: string      // E.164 format
    name?: string
    variables?: Record<string, string>
  }>
  
  // Para modo chatbot
  webhookMessage?: {
    from: string       // Phone do remetente
    content: string
    type: 'text' | 'button_reply' | 'list_reply'
    buttonId?: string
    listId?: string
    messageId: string
    contextMessageId?: string  // ID da mensagem original (para respostas)
  }
  
  // Opções de execução
  options?: {
    delayBetweenMessages?: number  // ms, default 6000
    maxRetries?: number            // default 3
    dryRun?: boolean               // simula sem enviar
  }
}
```

**Response (202 Accepted)**:
```typescript
interface ExecuteFlowResponse {
  executionId: string
  status: 'pending' | 'running'
  mode: 'campaign' | 'chatbot'
  contactCount?: number
  estimatedDuration?: string  // "15 minutes"
  statusUrl: string          // "/api/flow-engine/status/{executionId}"
}
```

**Errors**:
- `400`: Invalid request (flow not found, invalid contacts)
- `401`: WhatsApp credentials not configured
- `503`: QStash not available

---

## 2. Get Execution Status

### GET /api/flow-engine/status/{executionId}

Retorna status atual de uma execução.

**Response (200 OK)**:
```typescript
interface ExecutionStatusResponse {
  id: string
  flowId: string
  flowName: string
  mode: 'campaign' | 'chatbot'
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed'
  
  // Métricas
  metrics: {
    total: number
    sent: number
    delivered: number
    read: number
    failed: number
    pending: number
  }
  
  // Progress
  progress: {
    percentage: number
    currentNode?: string
    estimatedCompletion?: string
  }
  
  // Timestamps
  startedAt?: string
  completedAt?: string
  
  // Erro (se falhou)
  error?: {
    code: number
    message: string
    category: string
    action: string
  }
  
  // Últimos node executions (para debug)
  recentNodes?: Array<{
    nodeId: string
    nodeType: string
    status: string
    duration: number
    error?: string
  }>
}
```

**Errors**:
- `404`: Execution not found

---

## 3. Pause/Resume Execution

### POST /api/flow-engine/status/{executionId}/pause

Pausa uma execução em andamento (apenas modo campanha).

**Response (200 OK)**:
```typescript
interface PauseResponse {
  executionId: string
  status: 'paused'
  pausedAt: string
  pendingContacts: number
}
```

### POST /api/flow-engine/status/{executionId}/resume

Retoma uma execução pausada.

**Response (200 OK)**:
```typescript
interface ResumeResponse {
  executionId: string
  status: 'running'
  resumedAt: string
  remainingContacts: number
}
```

---

## 4. Cancel Execution

### DELETE /api/flow-engine/status/{executionId}

Cancela uma execução.

**Response (200 OK)**:
```typescript
interface CancelResponse {
  executionId: string
  status: 'cancelled'
  cancelledAt: string
  sentBeforeCancel: number
}
```

---

## 5. List Executions

### GET /api/flow-engine/executions

Lista execuções com filtros.

**Query Parameters**:
```
flowId?: string
mode?: 'campaign' | 'chatbot'
status?: string
limit?: number (default 20, max 100)
offset?: number (default 0)
orderBy?: 'created_at' | 'updated_at' (default created_at)
order?: 'asc' | 'desc' (default desc)
```

**Response (200 OK)**:
```typescript
interface ListExecutionsResponse {
  executions: Array<{
    id: string
    flowId: string
    flowName: string
    mode: string
    status: string
    metrics: { total: number; sent: number; failed: number }
    createdAt: string
    completedAt?: string
  }>
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}
```

---

## 6. Webhook Handler (Unified)

### POST /api/flow-engine/webhook

Handler unificado para webhooks do WhatsApp.

**Request (Meta Webhook Format)**:
```typescript
interface WhatsAppWebhook {
  object: 'whatsapp_business_account'
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product: 'whatsapp'
        metadata: {
          display_phone_number: string
          phone_number_id: string
        }
        
        // Status updates (delivery, read, failed)
        statuses?: Array<{
          id: string
          status: 'sent' | 'delivered' | 'read' | 'failed'
          timestamp: string
          recipient_id: string
          errors?: Array<{
            code: number
            title: string
            message: string
          }>
        }>
        
        // Incoming messages
        messages?: Array<{
          from: string
          id: string
          timestamp: string
          type: 'text' | 'interactive' | 'button' | 'image' | 'audio' | 'video' | 'document'
          text?: { body: string }
          interactive?: {
            type: 'button_reply' | 'list_reply'
            button_reply?: { id: string; title: string }
            list_reply?: { id: string; title: string }
          }
          button?: { text: string; payload: string }
          context?: { id: string }  // ID da mensagem sendo respondida
        }>
        
        contacts?: Array<{
          profile: { name: string }
          wa_id: string
        }>
      }
    }>
  }>
}
```

**Response (200 OK)**:
```typescript
interface WebhookResponse {
  status: 'ok'
}
```

**Note**: Sempre retorna 200 para acknowledgar recebimento (requisito Meta).

---

## 7. Node Execution Details

### GET /api/flow-engine/executions/{executionId}/nodes

Lista execuções de nodes de uma execução.

**Query Parameters**:
```
status?: 'completed' | 'failed' | 'pending'
nodeType?: string
contactPhone?: string
limit?: number
offset?: number
```

**Response (200 OK)**:
```typescript
interface NodeExecutionsResponse {
  nodes: Array<{
    id: string
    nodeId: string
    nodeType: string
    contactPhone?: string
    status: string
    duration: number
    error?: {
      code: number
      message: string
    }
    input: Record<string, unknown>
    output: Record<string, unknown>
    createdAt: string
  }>
  pagination: {
    total: number
    limit: number
    offset: number
  }
}
```

---

## Error Response Format

Todas as respostas de erro seguem o formato:

```typescript
interface ErrorResponse {
  error: string           // Mensagem amigável em pt-BR
  code?: string          // Código interno (e.g., "FLOW_NOT_FOUND")
  details?: unknown      // Detalhes técnicos (apenas em dev)
  action?: string        // Ação sugerida para o usuário
}
```

**HTTP Status Codes**:
- `400`: Bad Request (validação falhou)
- `401`: Unauthorized (credenciais inválidas/ausentes)
- `404`: Not Found (recurso não existe)
- `409`: Conflict (execução já em andamento)
- `429`: Too Many Requests (rate limit)
- `500`: Internal Server Error
- `503`: Service Unavailable (dependência fora)

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| POST /execute | 10/min por workspace |
| GET /status | 60/min por execution |
| POST /pause, /resume | 10/min por execution |
| GET /executions | 30/min por workspace |

---

## Authentication

Todas as rotas requerem autenticação via cookie de sessão (Auth.js).

Header adicional para workspace multi-tenant:
```
X-Workspace-Id: {workspaceId}
```

---

## Webhook Verification

### GET /api/flow-engine/webhook

**Query Parameters (Meta Verification)**:
```
hub.mode=subscribe
hub.verify_token={configured_token}
hub.challenge={challenge_string}
```

**Response**: Retorna `hub.challenge` se token válido, 403 se inválido.
