# API Contracts: Webhook (Bot Engine)

## POST /api/webhook

Webhook principal que recebe eventos do WhatsApp e roteia para o bot engine.

### Evento: Mensagem Recebida

**Request Body** (do Meta)
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WABA_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "5511999999999",
          "phone_number_id": "PHONE_NUMBER_ID"
        },
        "contacts": [{
          "profile": { "name": "João Silva" },
          "wa_id": "5511888888888"
        }],
        "messages": [{
          "from": "5511888888888",
          "id": "wamid.xxx",
          "timestamp": "1701600000",
          "type": "text",
          "text": { "body": "Olá, quero fazer um pedido" }
        }]
      },
      "field": "messages"
    }]
  }]
}
```

**Processamento Interno:**
1. Identifica `phoneNumberId` → Busca bot associado
2. Identifica contato → Cria/recupera conversation
3. Salva mensagem inbound
4. Se conversation não está `paused`:
   - Executa flow a partir do `currentNodeId`
   - Envia mensagens de resposta
   - Atualiza `currentNodeId`
5. Se conversation está `paused` (takeover):
   - Apenas salva mensagem e notifica operador

**Response** `200 OK`
```text
OK
```
> Deve retornar 200 rapidamente. Processamento assíncrono via QStash.

---

### Evento: Status de Mensagem

**Request Body** (do Meta)
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "statuses": [{
          "id": "wamid.yyy",
          "status": "delivered",
          "timestamp": "1701600010",
          "recipient_id": "5511888888888"
        }]
      }
    }]
  }]
}
```

**Processamento Interno:**
1. Atualiza status da mensagem (sent → delivered → read)
2. Atualiza timestamp correspondente

---

### Evento: Interactive Reply (Button/List)

**Request Body** (do Meta)
```json
{
  "messages": [{
    "type": "interactive",
    "interactive": {
      "type": "button_reply",
      "button_reply": {
        "id": "opt-1",
        "title": "Sim, confirmo"
      }
    }
  }]
}
```

**Processamento:**
- `button_reply.id` → Match com transição no flow
- Navega para próximo nó

---

## POST /api/webhook/engine

Endpoint interno para execução do bot (chamado via QStash).

**Request Body**
```json
{
  "conversationId": "uuid",
  "triggeredBy": "inbound_message",
  "messageId": "uuid",
  "nodeId": "node-5"
}
```

**Processamento:**
1. Carrega conversation + flow
2. Executa nó:
   - **Message Node**: Envia mensagem, avança
   - **Condition Node**: Avalia condição, roteia
   - **Collect Node**: Aguarda resposta
   - **Delay Node**: Agenda próxima execução
   - **Action Node**: Executa integração
   - **AI Node**: Chama agente AI
   - **Handoff Node**: Pausa e notifica
3. Persiste novo estado
4. Loop até atingir nó de espera ou fim

**Response** `200 OK`
```json
{
  "success": true,
  "nextNodeId": "node-8",
  "messagesSent": 2,
  "executionTimeMs": 450
}
```

---

## POST /api/webhook/schedule

Agenda execução futura (para delay nodes).

**Request Body**
```json
{
  "conversationId": "uuid",
  "nodeId": "node-delay-1",
  "executeAt": "2025-12-03T12:00:00Z"
}
```

**Response** `201 Created`
```json
{
  "scheduled": true,
  "qstashMessageId": "msg_xxx",
  "executeAt": "2025-12-03T12:00:00Z"
}
```

---

## Bot Engine State Machine

```
                    ┌─────────────────┐
                    │   START NODE    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
               ┌────│  MESSAGE NODE   │────┐
               │    └────────┬────────┘    │
               │             │             │
     ┌─────────▼─────────┐   │   ┌─────────▼─────────┐
     │  CONDITION NODE   │   │   │   COLLECT NODE    │
     └─────────┬─────────┘   │   └─────────┬─────────┘
               │             │             │
               │    ┌────────▼────────┐    │
               └────►   DELAY NODE    ◄────┘
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   ACTION NODE   │
                    │  (HTTP/Webhook) │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │    AI NODE      │
                    │ (Gemini/Custom) │
                    └────────┬────────┘
                             │
          ┌─────────────┬────┴────┬─────────────┐
          │             │         │             │
    ┌─────▼─────┐ ┌─────▼─────┐  │    ┌────────▼────────┐
    │  END NODE │ │ LOOP BACK │  │    │  HANDOFF NODE   │
    └───────────┘ └───────────┘  │    │ (Human Takeover)│
                                 │    └─────────────────┘
                          ┌──────▼──────┐
                          │  TRANSFER   │
                          │  (Outro Bot)│
                          └─────────────┘
```

### Node Execution Rules

| Node Type | Blocking? | Next Trigger |
|-----------|-----------|--------------|
| Message | Não | Imediato |
| Condition | Não | Imediato (baseado em resultado) |
| Collect | Sim | Nova mensagem inbound |
| Delay | Sim | Timer QStash |
| Action | Não | Imediato (async) |
| AI | Depende | Resposta do agente |
| Handoff | Sim | Release pelo operador |
| End | N/A | Conversa encerrada |

---

## Error Handling

**WhatsApp API Errors:**
```json
{
  "error": {
    "code": 131056,
    "type": "rate_limit",
    "message": "Pair rate limit reached",
    "retryAfter": 6
  }
}
```

**Ações:**
- `131056` (pair rate): Retry com backoff de 6s
- `131051` (user not opted-in): Marca contato como opt-out
- `131042` (payment): Log crítico, pausa bot
- `470` (re-engagement): Aguarda janela CSW ou envia template

---

## Webhook Verification (GET)

**Query Params**
```
hub.mode=subscribe
hub.verify_token=MY_TOKEN
hub.challenge=CHALLENGE_STRING
```

**Response** `200 OK`
```
CHALLENGE_STRING
```
