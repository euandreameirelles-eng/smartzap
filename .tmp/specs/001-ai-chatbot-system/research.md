# Research: Sistema de Chatbot WhatsApp

**Date**: 2025-12-03  
**Status**: ✅ Complete

## Research Tasks Completed

### 1. WhatsApp Cloud API v24.0

**Decision**: Usar 100% da API oficial Meta, sem wrappers não-oficiais

**Rationale**: 
- Documentação completa (32 páginas analisadas)
- Suporte a todos os 21 tipos de mensagem
- Sem risco de ban por API não-oficial
- Webhooks bem documentados

**Alternatives Considered**:
- Baileys (não-oficial): Rejeitado - risco de ban, sem suporte Meta
- WAPI.js (não-oficial): Rejeitado - mesmo problema

**Full Analysis**: `research/meta-api-capabilities.md` (1566 linhas)

---

### 2. Editor Visual de Fluxos

**Decision**: React Flow (https://reactflow.dev)

**Rationale**:
- Biblioteca React mais madura para flow editors
- MIT License
- Suporte a custom nodes
- Boa performance com muitos nós
- Usado por Supabase, Stripe, etc.

**Alternatives Considered**:
- XState visualizer: Rejeitado - foco em state machines, não flow editor
- Custom canvas: Rejeitado - YAGNI, reinventar a roda
- Rete.js: Considerado - menos popular, menos documentação

---

### 3. Persistência de Estado

**Decision**: Redis (cache hot) + Turso (source of truth)

**Rationale**:
- Redis: Sub-millisecond reads para conversas ativas
- Turso: Durabilidade, recovery após falhas
- Sync a cada mudança de nó (não cada mensagem)
- Recovery: se Redis vazio, busca do Turso

**Alternatives Considered**:
- Redis only: Rejeitado - sem durabilidade
- Turso only: Rejeitado - latência maior para conversas ativas
- PostgreSQL: Rejeitado - não está no stack

---

### 4. Tipos de Nós do Flow

**Decision**: 8 tipos iniciais + 12 tipos de mídia = 20 tipos total

**Core Nodes (8)**:
| Node | Descrição |
|------|-----------|
| START | Gatilho (msg, keyword, webhook) |
| MESSAGE | Enviar texto |
| MENU | Botões (≤3) ou Lista (4-10) |
| INPUT | Coletar resposta → variável |
| CONDITION | If/else baseado em variável |
| DELAY | Aguardar tempo |
| HANDOFF | Transferir para humano |
| AI_AGENT | Resposta via IA (P6) |

**Media Nodes (12)**:
| Node | Descrição |
|------|-----------|
| IMAGE | Enviar imagem |
| VIDEO | Enviar vídeo |
| AUDIO | Enviar áudio |
| DOCUMENT | Enviar documento |
| STICKER | Enviar sticker |
| LOCATION | Enviar localização |
| LOCATION_REQUEST | Pedir localização |
| CONTACT | Enviar card de contato |
| CAROUSEL | Media carousel |
| CTA_URL | Botão para link |
| REACTION | Reagir a mensagem |
| END | Fim do fluxo |

**Rationale**: Cobrir 100% dos tipos de mensagem da API Meta

---

### 5. Formato de Variáveis

**Decision**: `{{nome}}` syntax (Handlebars-style)

**Rationale**:
- Familiar (usado em templates, Mustache, etc.)
- Fácil de detectar com regex
- Não conflita com JSON ou código

**Reserved Variables**:
- `{{nome}}` - Nome do contato
- `{{telefone}}` - Telefone do contato
- `{{primeiro_nome}}` - Primeiro nome
- `{{ultima_msg}}` - Última mensagem recebida

---

### 6. Rate Limiting Strategy

**Decision**: Queue por destinatário com delay de 6s

**Rationale**:
- API Meta: 1 msg/6s por par (business → user)
- Implementar fila Redis por destinatário
- Agrupar mensagens quando possível
- Usar QStash para processamento async

**Implementation**:
```typescript
// Chave: rate:${phoneNumberId}:${recipientPhone}
// TTL: 6 segundos
await redis.set(key, '1', { ex: 6 });
```

---

### 7. CSW (Customer Service Window) Handling

**Decision**: Verificar CSW antes de enviar, fallback para template

**Rationale**:
- API Meta: mensagens livres só dentro de 24h
- Armazenar `lastMessageAt` por contato no Redis
- Se CSW expirada: usar template existente OU notificar operador

**Flow**:
```
Message → Check CSW → If expired → Use template
                    → If active  → Send free-form
```

---

## Key Findings Summary

| Topic | Finding |
|-------|---------|
| Max buttons | 3 (usar lista para 4+) |
| Max list items | 10 (submenus para mais) |
| Button title | 20 chars |
| List item title | 24 chars |
| Pair rate | 1 msg/6 segundos |
| CSW duration | 24h (72h para CTWA) |
| Typing indicator | Máx 25 segundos |
| Media carousel | 2-10 cards |
| Stickers | WebP only |
| Videos | H.264 only |
| Groups API | Pós-feature (OBA + 100k limit) |
| Calling API | Pós-feature |
