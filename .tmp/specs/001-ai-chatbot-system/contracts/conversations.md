# API Contracts: Conversations

## GET /api/conversations

Lista conversas ativas (para tela de inbox).

**Query Params**
- `status`: 'active' | 'paused' | 'ended' (default: active)
- `botId`: filtrar por bot
- `operatorId`: filtrar por operador
- `limit`: máx resultados (default: 50)
- `cursor`: paginação

**Response** `200 OK`
```json
{
  "conversations": [
    {
      "id": "uuid",
      "botId": "uuid",
      "botName": "Atendimento Pizzaria",
      "contactPhone": "+5511999999999",
      "contactName": "João Silva",
      "status": "active",
      "currentNodeId": "node-3",
      "assignedOperatorId": null,
      "lastMessage": {
        "text": "Quero ver o cardápio",
        "direction": "inbound",
        "createdAt": "2025-12-03T10:30:00Z"
      },
      "messageCount": 5,
      "createdAt": "2025-12-03T10:00:00Z"
    }
  ],
  "nextCursor": "abc123"
}
```

---

## GET /api/conversations/[id]

Retorna conversa com histórico.

**Response** `200 OK`
```json
{
  "id": "uuid",
  "botId": "uuid",
  "botName": "Atendimento Pizzaria",
  "contactPhone": "+5511999999999",
  "contactName": "João Silva",
  "status": "active",
  "currentNodeId": "node-3",
  "assignedOperatorId": null,
  "cswStartedAt": "2025-12-03T10:00:00Z",
  "cswExpiresAt": "2025-12-04T10:00:00Z",
  "variables": {
    "nome": "João",
    "pedido": "pizza"
  },
  "messages": [
    {
      "id": "uuid",
      "waMessageId": "wamid.xxx",
      "direction": "inbound",
      "origin": "client",
      "type": "text",
      "content": { "text": "Oi" },
      "status": "delivered",
      "createdAt": "2025-12-03T10:00:00Z"
    },
    {
      "id": "uuid",
      "waMessageId": "wamid.yyy",
      "direction": "outbound",
      "origin": "bot",
      "type": "interactive",
      "content": {
        "type": "button",
        "body": { "text": "Olá! Como posso ajudar?" },
        "action": {
          "buttons": [
            { "id": "1", "title": "Cardápio" },
            { "id": "2", "title": "Horários" }
          ]
        }
      },
      "status": "read",
      "createdAt": "2025-12-03T10:00:01Z",
      "deliveredAt": "2025-12-03T10:00:02Z",
      "readAt": "2025-12-03T10:00:05Z"
    }
  ],
  "createdAt": "2025-12-03T10:00:00Z"
}
```

---

## POST /api/conversations/[id]/takeover

Operador assume a conversa.

**Request Body**
```json
{
  "operatorId": "uuid"
}
```

**Response** `200 OK`
```json
{
  "id": "uuid",
  "status": "paused",
  "assignedOperatorId": "uuid"
}
```

---

## POST /api/conversations/[id]/release

Operador devolve ao bot.

**Response** `200 OK`
```json
{
  "id": "uuid",
  "status": "active",
  "assignedOperatorId": null
}
```

---

## POST /api/conversations/[id]/messages

Operador envia mensagem manual.

**Request Body**
```json
{
  "type": "text",
  "content": {
    "text": "Olá, sou o atendente João. Como posso ajudar?"
  }
}
```

**Response** `201 Created`
```json
{
  "id": "uuid",
  "waMessageId": "wamid.zzz",
  "direction": "outbound",
  "origin": "operator",
  "status": "sent",
  "createdAt": "2025-12-03T10:35:00Z"
}
```

---

## POST /api/conversations/[id]/end

Encerra a conversa.

**Response** `200 OK`
```json
{
  "id": "uuid",
  "status": "ended"
}
```

---

## GET /api/conversations/[id]/variables

Lista variáveis da conversa.

**Response** `200 OK`
```json
{
  "variables": [
    { "key": "nome", "value": "João", "collectedAt": "2025-12-03T10:05:00Z" },
    { "key": "pedido", "value": "pizza margherita", "collectedAt": "2025-12-03T10:10:00Z" }
  ]
}
```

---

## PUT /api/conversations/[id]/variables

Atualiza variável (uso interno/operador).

**Request Body**
```json
{
  "key": "pedido",
  "value": "pizza calabresa"
}
```

**Response** `200 OK`
```json
{
  "key": "pedido",
  "value": "pizza calabresa",
  "updatedAt": "2025-12-03T10:40:00Z"
}
```
