# Implementation Plan: Sistema de Chatbot WhatsApp (Regras + IA)

**Branch**: `001-ai-chatbot-system` | **Date**: 2025-12-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ai-chatbot-system/spec.md`

## Summary

Sistema de chatbot para WhatsApp estilo ManyChat/Botpress com editor visual de fluxos baseados em regras, expandível para agentes de IA. Construído 100% sobre a WhatsApp Cloud API v24.0 oficial da Meta. Abordagem: (1) Bots de regras sem custo de IA, (2) Editor visual React Flow, (3) Agentes IA opcionais.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20+  
**Primary Dependencies**: Next.js 16, React 19, React Flow, @tanstack/react-query  
**Storage**: Turso (SQLite) como source of truth, Upstash Redis como cache hot  
**Testing**: Vitest (unit), Playwright (e2e)  
**Target Platform**: Web (Vercel Edge)  
**Project Type**: web (monolith Next.js com App Router)  
**Performance Goals**: 95% respostas bot <2s, 100 conversas simultâneas, IA <15s  
**Constraints**: Pair rate 1msg/6s, CSW 24h, máx 3 botões, máx 10 items lista  
**Scale/Scope**: MVP com 7 user stories, 90 FRs, expansível para multi-tenant

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Pre-Design | Post-Design | Notes |
|-----------|------------|-------------|-------|
| I. Architecture Pattern | ✅ PASS | ✅ PASS | Pages thin, hooks controller, services API client |
| II. View-Controller Separation | ✅ PASS | ✅ PASS | Views em components/features/, hooks em hooks/ |
| III. API-First Design | ✅ PASS | ✅ PASS | Contratos REST em contracts/ |
| IV. Type Safety | ✅ PASS | ✅ PASS | Tipos definidos em data-model.md, extender types.ts |
| V. Simplicity & YAGNI | ✅ PASS | ✅ PASS | 8 node types iniciais, IA opcional |

**Technology Constraints Check:**
- ✅ Next.js 16 + React 19
- ✅ Tailwind CSS 4
- ✅ Turso + Redis existentes
- ✅ lucide-react para ícones
- ✅ pt-BR para UI
- ✅ React Flow para editor visual (nova dependência justificada)

## Project Structure

### Documentation (this feature)

\`\`\`text
specs/001-ai-chatbot-system/
├── plan.md              # This file
├── spec.md              # Feature specification ✅
├── research/
│   ├── meta-api-capabilities.md  # API analysis (32 pages) ✅
│   └── api-limits-cheatsheet.md  # Quick reference ✅
├── research.md          # Phase 0 output ✅
├── data-model.md        # Phase 1 output ✅
├── quickstart.md        # Phase 1 output ✅
├── contracts/           # Phase 1 output ✅
│   ├── bots.md          # Bot CRUD API
│   ├── flows.md         # Flow CRUD API
│   ├── conversations.md # Conversation API
│   └── webhook.md       # Webhook + Engine API
└── tasks.md             # Phase 2 output (próximo)
\`\`\`

### Source Code (repository root)

\`\`\`text
# Next.js App Router (web application)
app/
├── (dashboard)/
│   ├── bots/                    # NEW: Bot management
│   │   ├── page.tsx             # Bot list
│   │   └── [id]/
│   │       ├── page.tsx         # Bot details
│   │       └── editor/
│   │           └── page.tsx     # Flow editor
│   └── conversations/           # NEW: Live conversations
│       └── page.tsx
├── api/
│   ├── bots/                    # NEW: Bot CRUD
│   ├── flows/                   # NEW: Flow CRUD
│   ├── conversations/           # NEW: Conversation state
│   └── webhook/                 # EXTEND: Add bot routing
│       └── route.ts

components/
├── features/
│   ├── bots/                    # NEW
│   │   ├── BotListView.tsx
│   │   ├── BotFormView.tsx
│   │   └── BotCard.tsx
│   ├── flow-editor/             # NEW
│   │   ├── FlowEditorView.tsx
│   │   ├── nodes/               # Custom node types
│   │   │   ├── StartNode.tsx
│   │   │   ├── MessageNode.tsx
│   │   │   ├── MenuNode.tsx
│   │   │   ├── InputNode.tsx
│   │   │   ├── ConditionNode.tsx
│   │   │   ├── DelayNode.tsx
│   │   │   ├── HandoffNode.tsx
│   │   │   └── AIAgentNode.tsx
│   │   └── panels/
│   │       ├── NodePanel.tsx
│   │       └── PropertiesPanel.tsx
│   └── conversations/           # NEW
│       ├── ConversationListView.tsx
│       ├── ConversationDetailView.tsx
│       └── MessageBubble.tsx

hooks/
├── useBots.ts                   # NEW
├── useFlowEditor.ts             # NEW
├── useConversations.ts          # NEW
└── useFlowEngine.ts             # NEW: Runtime engine

services/
├── botService.turso.ts          # NEW
├── flowService.turso.ts         # NEW
└── conversationService.turso.ts # NEW

lib/
├── flow-engine/                 # NEW: Core engine
│   ├── executor.ts              # Flow execution
│   ├── nodes/                   # Node handlers
│   ├── variables.ts             # Variable substitution
│   └── state.ts                 # State management (Redis + Turso)
├── whatsapp/                    # NEW: WhatsApp message builders
│   ├── text.ts
│   ├── interactive.ts
│   ├── media.ts
│   └── index.ts
└── turso-db.ts                  # EXTEND: Add new tables

types.ts                         # EXTEND: Add Bot, Flow, Conversation types
\`\`\`

**Structure Decision**: Web application monolith seguindo padrão existente do SmartZap. Novas features em diretórios dedicados, reutilizando infraestrutura (Turso, Redis, Webhook).

## Complexity Tracking

> No violations - all patterns align with Constitution.

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Flow Engine | lib/flow-engine/ | Separado de hooks para testabilidade |
| State Management | Redis + Turso | Clarificado na spec (resilience) |
| Node Types | 8 tipos iniciais | YAGNI - expandir conforme necessário |

---

## Phase Status

| Phase | Status | Output |
|-------|--------|--------|
| Phase 0: Research | ✅ COMPLETE | research.md |
| Phase 1: Design | ✅ COMPLETE | data-model.md, contracts/, quickstart.md |
| Phase 2: Tasks | ✅ COMPLETE | tasks.md |
| Phase 3: Implement | ⏳ PENDING | Código fonte |

---

## Generated Artifacts Summary

### Phase 0: research.md
- Análise completa da WhatsApp Cloud API v24.0
- 21 tipos de mensagem documentados
- Limites críticos identificados (pair rate, CSW, botões)
- Decisão de arquitetura: Redis + Turso confirmada

### Phase 1: data-model.md
- 9 tabelas definidas com schemas SQL completos
- Relações e índices otimizados
- Suporte a multi-tenant preparado (workspace_id)

### Phase 1: contracts/
- **bots.md**: CRUD completo para bots
- **flows.md**: CRUD + validação de flows
- **conversations.md**: Estado, mensagens, takeover/release
- **webhook.md**: Engine de execução, state machine, error handling

### Phase 1: quickstart.md
- Setup do ambiente de desenvolvimento
- Criação de primeiro bot via dashboard e API
- Teste com ngrok
- Estrutura de arquivos explicada
