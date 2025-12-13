# API Contracts: Bots

## GET /api/bots

Lista todos os bots do usuário.

**Response** `200 OK`
```json
{
  "bots": [
    {
      "id": "uuid",
      "name": "Atendimento Pizzaria",
      "phoneNumberId": "123456789",
      "status": "active",
      "flowId": "uuid" | null,
      "createdAt": "2025-12-03T10:00:00Z"
    }
  ]
}
```

---

## POST /api/bots

Cria um novo bot.

**Request Body**
```json
{
  "name": "Atendimento Pizzaria",
  "phoneNumberId": "123456789",
  "welcomeMessage": "Olá! Bem-vindo à Pizzaria. Digite 1 para ver o cardápio.",
  "fallbackMessage": "Desculpe, não entendi. Digite MENU para ver as opções.",
  "sessionTimeoutMinutes": 30
}
```

**Response** `201 Created`
```json
{
  "id": "uuid",
  "name": "Atendimento Pizzaria",
  "phoneNumberId": "123456789",
  "status": "draft",
  "createdAt": "2025-12-03T10:00:00Z"
}
```

---

## GET /api/bots/[id]

Retorna detalhes de um bot.

**Response** `200 OK`
```json
{
  "id": "uuid",
  "name": "Atendimento Pizzaria",
  "phoneNumberId": "123456789",
  "status": "active",
  "flowId": "uuid",
  "welcomeMessage": "Olá!",
  "fallbackMessage": "Não entendi.",
  "sessionTimeoutMinutes": 30,
  "createdAt": "2025-12-03T10:00:00Z",
  "updatedAt": "2025-12-03T10:00:00Z",
  "stats": {
    "activeConversations": 5,
    "totalMessages": 1234,
    "avgResponseTime": 1.5
  }
}
```

---

## PATCH /api/bots/[id]

Atualiza um bot.

**Request Body**
```json
{
  "name": "Novo Nome",
  "status": "active",
  "welcomeMessage": "Nova mensagem"
}
```

**Response** `200 OK`
```json
{
  "id": "uuid",
  "name": "Novo Nome",
  "status": "active",
  "updatedAt": "2025-12-03T11:00:00Z"
}
```

---

## DELETE /api/bots/[id]

Deleta um bot (soft delete - marca como archived).

**Response** `204 No Content`

---

## POST /api/bots/[id]/activate

Ativa o bot (requer fluxo publicado).

**Response** `200 OK`
```json
{
  "id": "uuid",
  "status": "active"
}
```

**Error** `400 Bad Request`
```json
{
  "error": "Bot não tem fluxo publicado"
}
```

---

## POST /api/bots/[id]/deactivate

Desativa o bot.

**Response** `200 OK`
```json
{
  "id": "uuid",
  "status": "inactive"
}
```
