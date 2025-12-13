# Implementation Plan: Design System

**Branch**: `002-design-system` | **Date**: 2025-12-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-design-system/spec.md`

## Summary

Implementar um Design System eficiente baseado no shadcn/ui para o SmartZap, substituindo os estilos hardcoded (100+ ocorrências de `bg-zinc-*`) por Design Tokens semânticos e componentes reutilizáveis com CVA. O sistema seguirá o padrão Tailwind CSS v4 + CSS variables, permitindo tema consistente, dark mode, e componentes acessíveis via Radix UI.

## Technical Context

**Language/Version**: TypeScript 5.7+, React 19  
**Primary Dependencies**: 
- `class-variance-authority` (CVA) - gerenciamento de variantes
- `clsx` + `tailwind-merge` - merge de classes  
- `@radix-ui/*` - primitivos acessíveis (via shadcn/ui)
- `lucide-react` - ícones (já instalado)
- `tw-animate-css` - animações

**Storage**: N/A (feature frontend-only)  
**Testing**: Vitest (unit) + Playwright (E2E visual)  
**Target Platform**: Web (Next.js 16, App Router)  
**Project Type**: Web application (frontend-only feature)  
**Performance Goals**: Componentes renderizam em <16ms, zero layout shift  
**Constraints**: Manter compatibilidade com Tailwind CSS v4, dark mode via `.dark` class  
**Scale/Scope**: 23 componentes (5 P0 + 8 P1 + 10 P2), migração de 8 features existentes. Ver [component-index.md](./component-index.md) para lista completa de 51 componentes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Architecture Pattern** | ✅ PASS | Componentes UI vivem em `components/ui/` (já previsto) |
| **II. View-Controller Separation** | ✅ PASS | Componentes base são Views puras, sem lógica de negócio |
| **III. API-First Design** | N/A | Feature frontend-only, sem interação com API |
| **IV. Type Safety** | ✅ PASS | Todos componentes terão tipos explícitos + VariantProps |
| **V. Simplicity & YAGNI** | ✅ PASS | Começar com componentes mínimos, expandir sob demanda |

**Technology Constraints Check:**
| Constraint | Status |
|------------|--------|
| Next.js 16+ | ✅ Mantido |
| React 19+ | ✅ Mantido |
| Tailwind CSS 4+ | ✅ Mantido, usando `@theme inline` |
| lucide-react | ✅ Já instalado |
| pt-BR | ✅ Labels em português |

## Project Structure

### Documentation (this feature)

```text
specs/002-design-system/
├── plan.md              # Este arquivo
├── research.md          # Phase 0: Pesquisa shadcn/ui + Tailwind v4
├── data-model.md        # Phase 1: Design Tokens schema
├── quickstart.md        # Phase 1: Guia de uso para devs
├── component-index.md   # Índice completo de 51 componentes shadcn/ui
├── contracts/           # Phase 1: Especificação de componentes
│   ├── button.md
│   ├── input.md
│   └── card.md
└── tasks.md             # Phase 2: Tasks de implementação
```

### Source Code (repository root)

```text
components/
├── ui/                          # Componentes base (shadcn/ui)
│   │
│   │  # P0 - CRÍTICOS (5 componentes - 100% necessário)
│   ├── button.tsx               # 188 ocorrências
│   ├── input.tsx                # 56 ocorrências
│   ├── label.tsx                # 65 ocorrências
│   ├── card.tsx                 # ~100+ containers
│   ├── badge.tsx                # Status tags
│   │
│   │  # P1 - ALTOS (8 componentes - muito usado)
│   ├── textarea.tsx             # 10 ocorrências
│   ├── select.tsx               # 21 ocorrências
│   ├── checkbox.tsx             # Seleção múltipla
│   ├── switch.tsx               # Toggles
│   ├── skeleton.tsx             # Loading states
│   ├── dialog.tsx               # 6+ modais
│   ├── table.tsx                # 5 tabelas
│   ├── form.tsx                 # Formulários
│   │
│   │  # P2 - MÉDIOS (10 componentes - nice-to-have)
│   ├── progress.tsx             # Barra de progresso
│   ├── alert.tsx                # Mensagens
│   ├── sonner.tsx               # Toast notifications
│   ├── separator.tsx            # Divisórias
│   ├── scroll-area.tsx          # Scroll custom
│   ├── tabs.tsx                 # Navegação
│   ├── pagination.tsx           # Paginação
│   ├── alert-dialog.tsx         # Confirmações
│   ├── dropdown-menu.tsx        # Menus (⋮)
│   ├── popover.tsx              # Pop-ups
│   ├── tooltip.tsx              # Hints
│   │
│   │  # EXISTENTES (migrar para tokens)
│   ├── Form.tsx                 # EXISTING: Manter/Migrar
│   ├── AccountAlertBanner.tsx   # EXISTING: Migrar para tokens
│   ├── PrefetchLink.tsx         # EXISTING: Manter
│   └── WhatsAppPhonePreview.tsx # EXISTING: Migrar para tokens
│
├── composed/                    # Componentes compostos
│   ├── form-field.tsx           # FormField + Label + Message
│   ├── data-table.tsx           # Table + Pagination + Sorting
│   └── confirm-dialog.tsx       # Dialog + Actions padronizadas
│
└── features/                    # EXISTING: Migrar gradualmente
    ├── bots/                    # 3 arquivos com ~50 ocorrências zinc
    ├── campaigns/               # Migrar CampaignListView
    ├── contacts/
    ├── conversations/
    ├── dashboard/
    ├── flow-editor/
    ├── settings/
    └── templates/

lib/
├── utils.ts                     # NEW: cn() utility

app/
├── globals.css                  # MODIFY: Adicionar Design Tokens

tests/
├── unit/
│   └── components/              # NEW: Testes de componentes
│       ├── button.test.tsx
│       └── input.test.tsx
└── e2e/
    └── visual/                  # NEW: Testes visuais (opcional)
```

**Índice Completo**: Ver [component-index.md](./component-index.md) para lista de todos os 51 componentes shadcn/ui com status de implementação.

## Complexity Tracking

| Aspecto | Decisão | Justificativa |
|---------|---------|---------------|
| Nova pasta `composed/` | Adicionar | Separa componentes atômicos de compostos, facilita descoberta |
| Dependências novas | CVA + tw-merge | Padrão shadcn/ui, já usado em produção por Vercel/ai-chatbot |
| Tokens em OKLCH vs HSL | Usar HSL | Projeto já usa HSL em globals.css; manter consistência |
