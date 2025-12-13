# Research: Flow Engine

**Feature**: 003-flow-engine  
**Date**: 2025-01-03

## Overview

Pesquisa técnica para implementação do Flow Engine, focando em decisões de arquitetura, padrões de execução e integração com infraestrutura existente.

---

## 1. Arquitetura de Execução

### Decisão: Unificar workflow-executor.ts e flow-engine/

**Rationale**: O projeto tem duas implementações paralelas:
- `lib/workflow-executor.ts` - Chatbot funcional, usado pelo webhook
- `lib/flow-engine/executor.ts` - Bot conversation flows

Ambos fazem essencialmente o mesmo trabalho (executar nodes, gerenciar estado, enviar mensagens). Manter dois sistemas aumenta complexidade e bug surface.

**Escolha**: Refatorar `lib/flow-engine/` para ser o motor único, absorvendo funcionalidades do `workflow-executor.ts`.

**Alternativas Consideradas**:
1. ❌ Manter ambos separados - duplicação de código, bugs divergentes
2. ❌ Criar terceiro sistema - ainda mais fragmentação
3. ✅ Unificar em flow-engine - single source of truth

---

## 2. Modo de Execução: Campanha vs Chatbot

### Decisão: Estratégia de Modos via Strategy Pattern

**Rationale**: Os dois modos têm comportamentos distintos:

| Aspecto | Campanha | Chatbot |
|---------|----------|---------|
| Trigger | API call (disparo manual) | Webhook (mensagem recebida) |
| Estado | Fire-and-forget por contato | Stateful por conversa |
| Rate Limit | Batch processing | Resposta única |
| Timeout | Longo (minutos) | Curto (<2s) |

**Escolha**: Criar `lib/flow-engine/modes/` com duas estratégias:
- `campaign.ts` - Processa lista de contatos via QStash batches
- `chatbot.ts` - Processa mensagem única, mantém estado em Redis

**Alternativas Consideradas**:
1. ❌ if/else no executor - código spaghetti
2. ❌ Dois executors separados - duplicação
3. ✅ Strategy pattern com interface comum - limpo, extensível

---

## 3. Arquitetura de Nodes: Plugin System

### Decisão: Interface NodeExecutor

**Rationale**: Spec exige que novos tipos de node possam ser adicionados "em menos de 1 hora" (SC-006). Isso requer uma interface clara e desacoplada.

**Escolha**: Criar interface `NodeExecutor` em `lib/flow-engine/nodes/base.ts`:

```typescript
interface NodeExecutor<T extends FlowNodeData = FlowNodeData> {
  type: NodeType
  execute(context: ExecutionContext, data: T): Promise<NodeExecutionResult>
  validateConfig?(data: T): ValidationResult
}
```

Cada node implementa essa interface. O executor principal faz lookup por tipo.

**Alternativas Consideradas**:
1. ❌ Switch/case gigante - difícil de manter
2. ❌ Factory pattern puro - overhead desnecessário
3. ✅ Registry de executors - simples, tipado, extensível

---

## 4. Gerenciamento de Estado

### Decisão: Redis para Estado Efêmero, Turso para Persistência

**Rationale**: 
- Estado de conversa (currentNodeId, variables) precisa ser rápido (< 10ms lookup)
- Histórico de execução precisa ser persistido para análise

**Escolha**:
- **Redis**: `ConversationState` (TTL 24h), `TemplateMapping` (TTL 7d), `ExecutionLock`
- **Turso**: `flow_executions`, `node_executions`, `campaign_contacts`

**Pattern Existente**: Já usado em `lib/flow-engine/state.ts` - apenas expandir.

---

## 5. Rate Limiting

### Decisão: Delay Distribuído via QStash

**Rationale**: WhatsApp impõe 1 msg/6s por par origem-destino (erro 131056). Com 100 contatos, isso significa 10 minutos mínimo.

**Escolha**: Usar `context.sleep()` do Upstash Workflow entre mensagens:

```typescript
// Em campaign mode
for (const contact of contacts) {
  await context.run(`send-${contact.phone}`, async () => {
    await sendMessage(contact)
  })
  await context.sleep('rate-limit', 6000) // 6 segundos
}
```

QStash persiste o estado entre sleeps, permitindo execução que ultrapassa timeout de 10s.

**Alternativas Consideradas**:
1. ❌ setTimeout em serverless - não persiste entre invocações
2. ❌ Fila separada (SQS/RabbitMQ) - over-engineering
3. ✅ QStash sleep - já integrado, durable, simples

---

## 6. Tipos de Mensagem

### Decisão: Implementar Todos os 14 Tipos

**Rationale**: Spec exige cobertura de 100% da Cloud API (SC-007).

| Tipo | Status | Implementação |
|------|--------|---------------|
| text | ✅ Existe | `nodes/message.ts` |
| image | ✅ Existe | `nodes/image.ts` |
| video | ✅ Existe | `nodes/video.ts` |
| audio | ✅ Existe | `nodes/audio.ts` |
| document | ✅ Existe | `nodes/document.ts` |
| sticker | ⚠️ Parcial | Criar `nodes/sticker.ts` |
| location | ✅ Existe | `nodes/location.ts` |
| contacts | 🆕 Novo | Criar `nodes/contacts.ts` |
| reply_buttons | ⚠️ Parcial | Criar `nodes/buttons.ts` |
| list | ⚠️ Parcial | Criar `nodes/list.ts` |
| cta_url | ✅ Existe | `nodes/cta-url.ts` |
| carousel | ✅ Existe | `nodes/carousel.ts` |
| template | ⚠️ Parcial | Criar `nodes/template.ts` |
| reaction | 🆕 Novo | Criar `nodes/reaction.ts` |

**Ação**: Criar 6 novos arquivos, refatorar 4 existentes.

---

## 7. Processamento de Respostas (Chatbot)

### Decisão: Mapeamento por contextMessageId

**Rationale**: Quando usuário clica botão de template, webhook traz `context.id` (ID da mensagem original). Precisamos mapear isso de volta ao node que enviou.

**Escolha**: Já implementado em `workflow-executor.ts`:
```typescript
// Ao enviar template com botões
await saveTemplateMapping(sentMessageId, workflowId, nodeId)

// Ao receber resposta
const mapping = await getTemplateMapping(contextMessageId)
```

Migrar essa lógica para `lib/flow-engine/modes/chatbot.ts`.

---

## 8. Estrutura para IA

### Decisão: Interface Preparada, Implementação Deferida

**Rationale**: Spec define IA como P3 (prepare, don't implement). O motor deve aceitar node `ai_response` sem quebrar.

**Escolha**: 
1. Interface `AINodeExecutor` em `nodes/ai-agent.ts` (já existe)
2. Contexto enriquecido com `conversationHistory` para futuro uso
3. Node desconhecido → log warning, pula para próximo

**Implementação Futura**: Quando IA for prioridade, basta implementar `AINodeExecutor.execute()`.

---

## 9. Tratamento de Erros

### Decisão: Usar Mapeamento Existente + Retry Configurable

**Rationale**: `lib/whatsapp-errors.ts` já mapeia 44 códigos de erro com categorias, retry, e ações.

**Escolha**:
- **Erros Críticos** (payment, auth): Abort + alert
- **Erros de Rate** (131056): Retry com backoff (6s → 12s → 24s → fail)
- **Erros de Opt-Out** (135000): Marcar contato, continuar para outros
- **Erros de Número** (133010): Marcar inválido, continuar

Máximo 3 retries por mensagem.

---

## 10. Testes

### Decisão: Unit Tests para Nodes + Integration para Modos

**Rationale**: Nodes são funções puras (entrada → saída). Modos envolvem Redis/Turso/API.

**Escolha**:
- `tests/unit/flow-engine/nodes/` - Mock de contexto, testar cada node
- `tests/integration/flow-engine/` - Usar containers Docker para Redis/Turso

**Cobertura Target**: 80% para nodes, 60% para modos.

---

## Summary

| Decisão | Escolha | Justificativa |
|---------|---------|---------------|
| Arquitetura | Unificar em flow-engine | Single source of truth |
| Modos | Strategy pattern | Limpo, extensível |
| Nodes | Plugin interface | SC-006 compliance |
| Estado | Redis + Turso | Fast + Persistent |
| Rate Limit | QStash sleep | Durable, integrado |
| Mensagens | 14 tipos | SC-007 compliance |
| Respostas | contextMessageId map | Já funciona |
| IA | Interface only | P3 scope |
| Erros | whatsapp-errors.ts | Já existe, completo |
| Testes | Unit + Integration | Cobertura adequada |
