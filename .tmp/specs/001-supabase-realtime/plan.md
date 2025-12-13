# Implementation Plan: Supabase Realtime Integration

**Branch**: `001-supabase-realtime` | **Date**: 2025-12-06 | **Spec**: [spec.md](file:///Users/thaleslaray/code/projetos/smartzapv2/specs/001-supabase-realtime/spec.md)
**Input**: Feature specification from `/specs/001-supabase-realtime/spec.md`

## Summary

Integrar Supabase Realtime ao SmartZap para fornecer atualizações automáticas da UI sem refresh manual. Implementar hooks reutilizáveis que se inscrevem em tabelas do Supabase e atualizam React Query cache automaticamente, seguindo o padrão Page → Hook → Service → API da constitution.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: @supabase/supabase-js, @tanstack/react-query, React 19
**Storage**: Supabase Postgres (Realtime enabled on specific tables)
**Testing**: Playwright (E2E), manual testing
**Target Platform**: Web (Next.js App Router)
**Project Type**: Web application (existing codebase)
**Performance Goals**: < 2 segundos para atualizações na UI
**Constraints**: < 200 conexões simultâneas (Supabase Free), < 5 canais WebSocket por usuário
**Scale/Scope**: 6 páginas afetadas, 7 tabelas com Realtime enabled

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | How Implemented |
|-----------|--------|-----------------|
| I. Architecture Pattern | ✅ PASS | Hook (useRealtime) → existing React Query cache |
| II. View-Controller Separation | ✅ PASS | Realtime hooks separados, views não mudam |
| III. API-First Design | ✅ PASS | Supabase client já configurado em lib/ |
| IV. Type Safety | ✅ PASS | Types para RealtimeEvent, Subscription |
| V. Simplicity & YAGNI | ✅ PASS | 1 hook genérico + 1 provider, sem over-engineering |

**Technology Constraints Check**:
- ✅ Next.js App Router compatível
- ✅ React 19 compatível
- ✅ Supabase já no projeto (via @supabase/supabase-js)
- ✅ React Query já no projeto

## Project Structure

### Documentation (this feature)

```text
specs/001-supabase-realtime/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no new APIs)
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
lib/
├── supabase.ts               # Existing - add Realtime helper
├── supabase-realtime.ts      # NEW - Realtime subscriptions manager

hooks/
├── useRealtime.ts            # NEW - Generic Realtime hook
├── useRealtimeQuery.ts       # NEW - React Query + Realtime integration

components/
├── providers/
│   └── RealtimeProvider.tsx  # NEW - Global Realtime context
├── ui/
│   └── RealtimeIndicator.tsx # NEW - Connection status indicator

app/
├── (dashboard)/
│   ├── campaigns/[id]/       # UPDATE - Add Realtime subscription
│   ├── conversations/        # UPDATE - Add Realtime subscription
│   ├── workflows/            # UPDATE - Add Realtime subscription
│   ├── contacts/             # UPDATE - Add Realtime subscription
│   └── page.tsx              # UPDATE - Dashboard with Realtime
```

**Structure Decision**: Seguindo constitution, novos arquivos em lib/ para utilidades, hooks/ para hooks reutilizáveis, e components/providers/ para contexto global.

## Complexity Tracking

> Nenhuma violação da constitution - implementação segue padrões estabelecidos.

| Component | Justification |
|-----------|---------------|
| RealtimeProvider | Necessário para gerenciar única conexão WebSocket (evitar múltiplas conexões) |
| useRealtimeQuery | Integração com React Query evita duplicação de lógica de cache |
