# Implementation Plan: Flow Engine

**Branch**: `003-flow-engine` | **Date**: 2025-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-flow-engine/spec.md`

## Summary

Motor de execução de flows para WhatsApp com suporte a **todos os tipos de mensagem** da Cloud API v24.0, operando em **dois modos**: Campanha (disparo em massa) e Chatbot (resposta interativa a webhooks). Estrutura extensível preparada para futuro node de IA.

**Abordagem Técnica**: Refatorar e unificar a infraestrutura existente (`lib/flow-engine/` + `lib/workflow-executor.ts`) em um motor coeso com arquitetura de plugins para tipos de node.

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js 16+ / React 19)  
**Primary Dependencies**: 
- `@upstash/workflow` (QStash) para processamento distribuído
- `@upstash/redis` para estado de conversas
- WhatsApp Cloud API v24.0
**Storage**: Turso (LibSQL) para persistência + Redis para estado/cache  
**Testing**: Vitest para unit tests  
**Target Platform**: Vercel Edge Functions (serverless)
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**: 
- Flow de 5 nodes para 100 contatos em < 15 minutos
- Latência webhook → resposta < 2 segundos
- 50 campanhas simultâneas sem degradação
**Constraints**: 
- Rate limit WhatsApp: 1 msg/6s por par origem-destino
- Timeout serverless: 10s (Vercel)
- Janela de 24h para mensagens não-template
**Scale/Scope**: 10k contatos/campanha, múltiplos workspaces

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Princípio I: Architecture Pattern ✅
- **Page → Hook → Service → API**: Flow engine é backend-only, executa via API Routes
- API Routes em `/app/api/flow-engine/` chamam `lib/flow-engine/`
- Dashboard de execução seguirá padrão: `useCampaignDetails` hook já existe

### Princípio II: View-Controller Separation ✅
- Flow Engine é **pure backend** - não envolve components
- Visualização de execução usa hooks existentes (`useCampaignRealtime.ts`)

### Princípio III: API-First Design ✅
- Todas as operações via API Routes
- WhatsApp API já mapeada em `lib/whatsapp-errors.ts` (44 códigos)
- Phone formatting via `lib/phone-formatter.ts` (E.164)

### Princípio IV: Type Safety ✅
- Types já definidos em `types.ts` (FlowNode, FlowEdge, etc.)
- Expandir com tipos para execução (FlowExecution, NodeExecution)
- Zod validation para inputs de API

### Princípio V: Simplicity & YAGNI ✅
- **Reusar infraestrutura existente**:
  - `lib/flow-engine/` (parcialmente implementado)
  - `lib/workflow-executor.ts` (chatbot funcional)
  - `app/api/campaign/workflow/` (QStash workflow)
- Não criar abstrações prematuras
- Node de IA: apenas interface, sem implementação

### Technology Constraints ✅
- Next.js 16+, React 19, Tailwind 4
- Turso, Redis, QStash - todos já configurados
- WhatsApp Cloud API v24.0 - já integrado

---

## Project Structure

### Documentation (this feature)

```text
specs/003-flow-engine/
├── plan.md              # This file
├── research.md          # Phase 0: Research findings
├── data-model.md        # Phase 1: Entity definitions
├── quickstart.md        # Phase 1: Developer guide
├── contracts/           # Phase 1: API contracts
│   ├── flow-execution.yaml
│   └── webhook-handler.yaml
└── tasks.md             # Phase 2: Implementation tasks
```

### Source Code (repository root)

```text
lib/
├── flow-engine/                  # Core engine (EXISTING - expand)
│   ├── index.ts                  # Exports
│   ├── executor.ts               # Main executor (refactor)
│   ├── state.ts                  # Conversation state manager
│   ├── variables.ts              # Variable substitution
│   ├── validator.ts              # Flow validation
│   ├── tools.ts                  # Tool execution (AI prep)
│   ├── nodes/                    # Node executors (EXPAND)
│   │   ├── index.ts
│   │   ├── base.ts              # NEW: NodeExecutor interface
│   │   ├── message.ts           # Text messages
│   │   ├── image.ts             # Image (existing)
│   │   ├── video.ts             # Video (existing)
│   │   ├── audio.ts             # Audio (existing)
│   │   ├── document.ts          # Document (existing)
│   │   ├── sticker.ts           # NEW: Sticker support
│   │   ├── location.ts          # Location (existing)
│   │   ├── contacts.ts          # NEW: vCard contacts
│   │   ├── carousel.ts          # Carousel (existing)
│   │   ├── cta-url.ts           # CTA URL (existing)
│   │   ├── template.ts          # NEW: Template node
│   │   ├── reaction.ts          # NEW: Message reactions
│   │   ├── buttons.ts           # NEW: Reply buttons
│   │   ├── list.ts              # NEW: List message
│   │   ├── delay.ts             # Delay (existing)
│   │   ├── condition.ts         # If/Else (existing)
│   │   ├── input.ts             # Input collection
│   │   └── ai-agent.ts          # AI placeholder (existing)
│   └── modes/                    # NEW: Execution modes
│       ├── campaign.ts          # Bulk dispatch mode
│       └── chatbot.ts           # Interactive webhook mode
├── workflow-executor.ts          # DEPRECATE: Merge into flow-engine

app/api/
├── flow-engine/                  # NEW: Flow engine endpoints
│   ├── execute/route.ts         # Start flow execution
│   ├── status/[id]/route.ts     # Get execution status
│   └── webhook/route.ts         # Unified webhook handler
├── campaign/                     # EXISTING (refactor to use flow-engine)
│   ├── dispatch/route.ts        # Triggers flow-engine/modes/campaign
│   └── workflow/route.ts        # QStash workflow (uses flow-engine)
└── webhook/route.ts              # EXISTING (integrate flow-engine)

types.ts                          # Existing types (expand)
```

**Structure Decision**: Web application structure using Next.js App Router. Expanding existing `lib/flow-engine/` rather than creating new directory to maintain consistency with codebase. New `modes/` subdirectory separates campaign vs chatbot execution logic.

## Complexity Tracking

> No constitution violations - using existing patterns and infrastructure.

---

## Constitution Re-Check (Post-Design)

*Re-evaluated after Phase 1 design completion.*

### Princípio I: Architecture Pattern ✅ CONFIRMED
- Design mantém padrão Page → Hook → Service → API
- Novos endpoints `/api/flow-engine/*` seguem convenção existente
- Nenhum bypass de API layer

### Princípio II: View-Controller Separation ✅ CONFIRMED
- Flow Engine permanece backend-only
- Nenhum component novo necessário
- Dashboard usa hooks existentes

### Princípio III: API-First Design ✅ CONFIRMED
- 7 endpoints API definidos em `contracts/api-contracts.md`
- RESTful patterns consistentes
- Error handling via `whatsapp-errors.ts`

### Princípio IV: Type Safety ✅ CONFIRMED
- Novos tipos definidos em `data-model.md`:
  - `FlowExecution`, `NodeExecution`, `ConversationState`
  - `NodeExecutor<T>` interface genérica
  - Enums para status e tipos
- Zod schemas para validação de API input

### Princípio V: Simplicity & YAGNI ✅ CONFIRMED
- Reutiliza 90% da infraestrutura existente
- Apenas 6 novos arquivos de node (não 14 - muitos já existem)
- AI node: apenas interface, sem implementação
- Sem abstrações prematuras

### Technology Constraints ✅ CONFIRMED
- Nenhuma nova dependência adicionada
- Usa stack existente: Next.js, Turso, Redis, QStash
- WhatsApp API v24.0 unchanged

---

## Phase Completion Status

| Phase | Status | Output |
|-------|--------|--------|
| Phase 0: Research | ✅ Complete | `research.md` |
| Phase 1: Design | ✅ Complete | `data-model.md`, `contracts/`, `quickstart.md` |
| Phase 2: Tasks | 🔜 Next | Run `/speckit.tasks` to generate |

---

## Next Steps

1. Run `/speckit.tasks` to generate implementation tasks
2. Review and prioritize tasks
3. Begin implementation following task order

