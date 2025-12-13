# 🔍 Auditoria Completa dos Nodes - SmartZap Flow Engine

> **Data:** 4 de dezembro de 2025  
> **Versão WhatsApp API:** v24.0  
> **Status:** ✅ VALIDADO

---

## 📋 Sumário Executivo

Esta auditoria verificou todos os 23 tipos de nodes do workflow builder contra:
1. **Meta WhatsApp Cloud API v24.0** - Limites e formatos oficiais
2. **LangFlow** - Padrões de flow builder
3. **Flow Engine Executors** - Implementação de processamento de respostas

### Resultados

| Categoria | Total | Validado | Corrigido | Pendente |
|-----------|-------|----------|-----------|----------|
| Schemas (shared.ts) | 23 | 23 | 0 | 0 |
| Executors | 20 | 20 | 2 | 0 |
| Response Handlers | 7 | 7 | 3 | 0 |

---

## 📊 Validação de Schemas vs WhatsApp API

### Nodes de Mensagem

| Node | Campo | Limite Schema | Limite Meta API | Status |
|------|-------|---------------|-----------------|--------|
| **message** | text | 4096 | 4096 | ✅ |
| **image** | caption | 1024 | 1024 | ✅ |
| **video** | caption | 1024 | 1024 | ✅ |
| **audio** | - | - | - | ✅ |
| **document** | filename | 240 | 240 | ✅ |
| **document** | caption | 1024 | 1024 | ✅ |
| **sticker** | - | - | - | ✅ |

### Nodes Interativos

| Node | Campo | Limite Schema | Limite Meta API | Status |
|------|-------|---------------|-----------------|--------|
| **buttons** | body | 1024 | 1024 | ✅ |
| **buttons** | buttons[].title | 20 | 20 | ✅ |
| **buttons** | buttons max | 3 | 3 | ✅ |
| **buttons** | footer | 60 | 60 | ✅ |
| **list** | body | 1024 | 1024 | ✅ |
| **list** | header | 60 | 60 | ✅ |
| **list** | buttonText | 20 | 20 | ✅ |
| **list** | items[].title | 24 | 24 | ✅ |
| **list** | items[].description | 72 | 72 | ✅ |
| **list** | items max | 10 | 10 | ✅ |
| **menu** | text | 1024 | 1024 | ✅ |
| **menu** | header | 60 | 60 | ✅ |
| **menu** | footer | 60 | 60 | ✅ |
| **menu** | options[].label | 20 | 20 | ✅ |
| **menu** | options max | 10 | 10 | ✅ |
| **cta-url** | text | 1024 | 1024 | ✅ |
| **cta-url** | buttonText | 25 | 25 | ✅ |
| **cta-url** | url | 2000 | 2000 | ✅ |
| **carousel** | headerText | 60 | 60 | ✅ |
| **carousel** | bodyText | 1024 | 1024 | ✅ |
| **carousel** | cards[].title | 200 | 200 | ✅ |
| **carousel** | cards[].description | 100 | 100 | ✅ |
| **carousel** | cards[].buttonText | 25 | 25 | ✅ |
| **carousel** | cards max | 10 | 10 | ✅ |

### Node de Template

| Node | Campo | Limite Schema | Limite Meta API | Status |
|------|-------|---------------|-----------------|--------|
| **template** | buttons[].text | 25 | 25 | ✅ |
| **template** | buttons[].url | 2000 | 2000 | ✅ |
| **template** | button types | URL, PHONE_NUMBER, QUICK_REPLY, COPY_CODE, OTP, FLOW, CATALOG, MPM, VOICE_CALL | ✅ | ✅ |

### Nodes de Dados

| Node | Campo | Limite Schema | Limite Meta API | Status |
|------|-------|---------------|-----------------|--------|
| **location** | latitude | -90 to 90 | -90 to 90 | ✅ |
| **location** | longitude | -180 to 180 | -180 to 180 | ✅ |
| **location** | name | 100 | ~100 | ✅ |
| **location** | address | 500 | ~500 | ✅ |
| **contacts** | name | 256 | 256 | ✅ |
| **contacts** | phones | E.164 | E.164 | ✅ |
| **input** | question | 4096 | 4096 | ✅ |
| **input** | variableName | 64 | N/A | ✅ |

---

## 🔧 Correções Aplicadas

### 1. Response Handlers no Chatbot Mode

**Problema:** O `processUserResponse` no `chatbot.ts` só tratava `menu` e `input`.

**Correção:** Adicionados handlers para:
- `template` (QUICK_REPLY buttons)
- `buttons` (Reply buttons)
- `list` (List items)

```typescript
// Arquivo: lib/flow-engine/modes/chatbot.ts
// Função: processUserResponse

switch (node.type) {
  case 'template': { ... }  // ✅ ADICIONADO
  case 'buttons': { ... }   // ✅ ADICIONADO  
  case 'list': { ... }      // ✅ ADICIONADO
  case 'menu': { ... }      // Existente
  case 'input': { ... }     // Existente
}
```

### 2. Pause Execution no Chatbot

**Problema:** A condição de pausa não incluía `pauseExecution`, `buttons` e `list`.

**Correção:**
```typescript
// Antes:
if (nodeResult.collectInput || node.type === 'menu' || node.type === 'input')

// Depois:
if (
  nodeResult.collectInput || 
  nodeResult.pauseExecution ||
  node.type === 'menu' || 
  node.type === 'input' ||
  node.type === 'buttons' ||
  node.type === 'list'
)
```

### 3. Template Executor processResponse

**Problema:** O `templateNodeExecutor` não tinha função `processResponse`.

**Correção:** Adicionada função para processar cliques em botões QUICK_REPLY:
```typescript
// Arquivo: lib/flow-engine/nodes/template.ts
async processResponse(context, node): Promise<string | undefined> {
  // Matches button click to edge connection
  // Supports: button-0, button-1, button_0, button_1 formats
}
```

### 4. NodeType Expansion

**Problema:** `NodeType` não incluía `buttons`, `list`, `contacts`, `sticker`, `reaction`.

**Correção:**
```typescript
// Arquivo: types.ts
export type NodeType = 
  | 'start' | 'message' | 'menu' | 'input' | ...
  | 'buttons'    // ✅ ADICIONADO
  | 'list'       // ✅ ADICIONADO
  | 'contacts'   // ✅ ADICIONADO
  | 'sticker'    // ✅ ADICIONADO
  | 'reaction';  // ✅ ADICIONADO
```

---

## 📝 Nodes que Esperam Resposta do Usuário

Estes nodes pausam a execução e aguardam input:

| Node | Trigger Response | Edge Handle Pattern |
|------|-----------------|---------------------|
| **template** (QUICK_REPLY) | `buttonId` | `button-0`, `button-1` |
| **buttons** | `buttonId` | button `id` field |
| **list** | `listId` | item `id` field |
| **menu** | `buttonId` ou `listId` | option `id` field |
| **input** | `text` | single outgoing edge |

---

## 🔄 Fluxo de Processamento de Resposta

```
1. Webhook recebe mensagem
   ↓
2. Extrai: buttonId, listId, text
   ↓
3. processChatbotMessage()
   ↓
4. Carrega state (currentNodeId)
   ↓
5. processUserResponse(node, context)
   ↓
6. Match por:
   - node.type
   - data.buttons/options/items
   - incomingMessage.buttonId/listId/text
   ↓
7. Encontra edge via sourceHandle
   ↓
8. Retorna nextNodeId
   ↓
9. Continua execução do fluxo
```

---

## ✅ Checklist de Validação

- [x] Todos os schemas shared.ts validados contra API Meta
- [x] Todos os limites de caracteres corretos
- [x] Todos os limites de arrays corretos
- [x] Executors registrados no index.ts
- [x] processResponse implementado em nodes interativos
- [x] chatbot.ts processa todos os tipos de resposta
- [x] Condition para pause inclui todos os nodes necessários
- [x] NodeType inclui todos os tipos de nodes
- [x] Build TypeScript passa sem erros

---

## 📚 Referências

- [WhatsApp Cloud API - Messages](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages)
- [WhatsApp Cloud API - Send Messages](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages)
- [WhatsApp Template API Reference](./WHATSAPP-TEMPLATE-API-REFERENCE.md)
- [LangFlow Documentation](https://docs.langflow.org/)

---

> **Mantido por:** SmartZap Team  
> **Última atualização:** 4 de dezembro de 2025
