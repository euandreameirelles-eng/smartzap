# API Contracts: Flows

## GET /api/flows?botId={botId}

Lista fluxos de um bot.

**Response** `200 OK`
```json
{
  "flows": [
    {
      "id": "uuid",
      "botId": "uuid",
      "name": "Fluxo Principal",
      "status": "published",
      "version": 3,
      "nodeCount": 12,
      "createdAt": "2025-12-03T10:00:00Z",
      "updatedAt": "2025-12-03T11:00:00Z"
    }
  ]
}
```

---

## POST /api/flows

Cria um novo fluxo.

**Request Body**
```json
{
  "botId": "uuid",
  "name": "Fluxo Principal"
}
```

**Response** `201 Created`
```json
{
  "id": "uuid",
  "botId": "uuid",
  "name": "Fluxo Principal",
  "nodes": [],
  "edges": [],
  "status": "draft",
  "version": 1,
  "createdAt": "2025-12-03T10:00:00Z"
}
```

---

## GET /api/flows/[id]

Retorna fluxo completo com nós e arestas.

**Response** `200 OK`
```json
{
  "id": "uuid",
  "botId": "uuid",
  "name": "Fluxo Principal",
  "status": "draft",
  "version": 1,
  "nodes": [
    {
      "id": "node-1",
      "type": "start",
      "position": { "x": 100, "y": 100 },
      "data": {
        "triggers": ["*"]
      }
    },
    {
      "id": "node-2",
      "type": "message",
      "position": { "x": 100, "y": 200 },
      "data": {
        "text": "Olá! Bem-vindo.",
        "typingDelay": 1500
      }
    },
    {
      "id": "node-3",
      "type": "menu",
      "position": { "x": 100, "y": 300 },
      "data": {
        "text": "Como posso ajudar?",
        "options": [
          { "id": "opt-1", "label": "Cardápio", "value": "cardapio" },
          { "id": "opt-2", "label": "Horários", "value": "horarios" },
          { "id": "opt-3", "label": "Atendente", "value": "atendente" }
        ]
      }
    }
  ],
  "edges": [
    { "id": "e1-2", "source": "node-1", "target": "node-2" },
    { "id": "e2-3", "source": "node-2", "target": "node-3" }
  ],
  "createdAt": "2025-12-03T10:00:00Z",
  "updatedAt": "2025-12-03T10:00:00Z"
}
```

---

## PUT /api/flows/[id]

Atualiza fluxo (nós e arestas).

**Request Body**
```json
{
  "name": "Fluxo Atualizado",
  "nodes": [...],
  "edges": [...]
}
```

**Response** `200 OK`
```json
{
  "id": "uuid",
  "version": 2,
  "updatedAt": "2025-12-03T11:00:00Z"
}
```

---

## POST /api/flows/[id]/publish

Publica o fluxo (cria nova versão, valida).

**Response** `200 OK`
```json
{
  "id": "uuid",
  "status": "published",
  "version": 3
}
```

**Error** `400 Bad Request`
```json
{
  "error": "Fluxo inválido",
  "details": [
    { "nodeId": "node-5", "error": "Nó sem conexão de saída" },
    { "nodeId": "node-3", "error": "Loop infinito detectado" }
  ]
}
```

---

## POST /api/flows/[id]/validate

Valida fluxo sem publicar.

**Response** `200 OK`
```json
{
  "valid": true,
  "warnings": [
    { "nodeId": "node-7", "warning": "Nó END sem conexões de entrada" }
  ]
}
```

**Response** `200 OK` (com erros)
```json
{
  "valid": false,
  "errors": [
    { "nodeId": "node-5", "error": "Nó sem conexão de saída" }
  ]
}
```

---

## POST /api/flows/[id]/duplicate

Duplica o fluxo.

**Response** `201 Created`
```json
{
  "id": "new-uuid",
  "name": "Fluxo Principal (cópia)",
  "status": "draft"
}
```

---

## DELETE /api/flows/[id]

Deleta um fluxo.

**Response** `204 No Content`

**Error** `400 Bad Request` (se é o fluxo ativo do bot)
```json
{
  "error": "Não é possível deletar fluxo ativo"
}
```

---

## Node Types Schema

### START
```json
{
  "type": "start",
  "data": {
    "triggers": ["*"] | ["oi", "olá", "menu"],
    "triggerType": "any" | "keyword" | "webhook"
  }
}
```

### MESSAGE
```json
{
  "type": "message",
  "data": {
    "text": "Olá {{nome}}!",
    "typingDelay": 1500,
    "previewUrl": true
  }
}
```

### MENU
```json
{
  "type": "menu",
  "data": {
    "text": "Escolha uma opção:",
    "header": "Atendimento",
    "footer": "Powered by SmartZap",
    "options": [
      { "id": "opt-1", "label": "Cardápio", "value": "cardapio", "description": "Ver nosso cardápio" }
    ]
  }
}
```

### INPUT
```json
{
  "type": "input",
  "data": {
    "prompt": "Qual seu nome?",
    "variableName": "nome",
    "validation": "text" | "email" | "phone" | "number",
    "errorMessage": "Por favor, digite um valor válido."
  }
}
```

### CONDITION
```json
{
  "type": "condition",
  "data": {
    "variable": "{{pedido_ativo}}",
    "operator": "equals" | "contains" | "greater" | "less" | "exists",
    "value": "true"
  }
}
```

### DELAY
```json
{
  "type": "delay",
  "data": {
    "seconds": 5
  }
}
```

### HANDOFF
```json
{
  "type": "handoff",
  "data": {
    "message": "Transferindo para um atendente...",
    "notifyKeyword": "ATENDENTE"
  }
}
```

### AI_AGENT
```json
{
  "type": "ai_agent",
  "data": {
    "agentId": "uuid",
    "fallbackMessage": "Desculpe, não consegui processar."
  }
}
```

### IMAGE
```json
{
  "type": "image",
  "data": {
    "url": "https://...",
    "mediaId": "123",
    "caption": "Nosso cardápio"
  }
}
```

### CAROUSEL
```json
{
  "type": "carousel",
  "data": {
    "cards": [
      {
        "header": { "type": "image", "url": "https://..." },
        "body": "Pizza Margherita",
        "ctaUrl": "https://...",
        "ctaText": "Ver mais"
      }
    ]
  }
}
```
