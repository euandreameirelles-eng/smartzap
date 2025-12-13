# Tasks: Design System

**Input**: Design documents from `/specs/002-design-system/`  
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, component-index.md ✓

**Tests**: Não solicitados explicitamente - tarefas focam em implementação.

**Organization**: Tarefas organizadas por user story para permitir implementação e teste independente de cada história.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[Story]**: Qual user story esta tarefa pertence (US1, US2, etc.)
- Caminhos exatos incluídos nas descrições

---

## Phase 1: Setup (Infraestrutura Compartilhada)

**Purpose**: Inicialização do projeto e instalação de dependências

- [ ] T001 Instalar dependências: `npm install class-variance-authority tailwind-merge`
- [ ] T002 [P] Criar utilitário cn() em `lib/utils.ts`
- [ ] T003 [P] Criar pasta `components/composed/` para componentes compostos
- [ ] T004 Inicializar shadcn/ui com `npx shadcn@latest init` (se necessário configurar components.json)

---

## Phase 2: Foundational (Design Tokens) 

**Purpose**: Base que DEVE estar completa antes de qualquer componente

**⚠️ CRÍTICO**: Nenhum componente pode ser criado antes desta fase estar completa

- [ ] T005 Adicionar Design Tokens ao `app/globals.css` seguindo schema de `data-model.md`
- [ ] T006 Configurar Tailwind v4 theme mapping com `@theme inline` em `app/globals.css`
- [ ] T007 Testar tokens: criar página temporária que exibe todas as cores semânticas
- [ ] T008 Validar que `bg-primary`, `bg-card`, `text-muted-foreground` funcionam corretamente

**Checkpoint**: Tokens funcionando - implementação de componentes pode começar

---

## Phase 3: User Story 1 - Componentes Base Consistentes (Priority: P1) 🎯 MVP

**Goal**: Desenvolvedores podem usar Button, Input, Card, Badge, Label com variantes padronizadas

**Independent Test**: Criar página `/test-ds` que usa todos os componentes e verificar consistência visual

### P0 - Críticos (5 componentes)

- [ ] T009 [US1] Criar componente Button com CVA em `components/ui/button.tsx` conforme `contracts/button.md`
- [ ] T010 [P] [US1] Criar componente Input em `components/ui/input.tsx` conforme `contracts/input.md`
- [ ] T011 [P] [US1] Criar componente Label em `components/ui/label.tsx`
- [ ] T012 [P] [US1] Criar componente Card (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter) em `components/ui/card.tsx` conforme `contracts/card.md`
- [ ] T013 [P] [US1] Criar componente Badge com variantes em `components/ui/badge.tsx`

### P1 - Altos (8 componentes)

- [ ] T014 [P] [US1] Criar componente Textarea em `components/ui/textarea.tsx`
- [ ] T015 [P] [US1] Criar componente Select (via shadcn) em `components/ui/select.tsx`
- [ ] T016 [P] [US1] Criar componente Checkbox em `components/ui/checkbox.tsx`
- [ ] T017 [P] [US1] Criar componente Switch em `components/ui/switch.tsx`
- [ ] T018 [P] [US1] Criar componente Skeleton em `components/ui/skeleton.tsx`
- [ ] T019 [P] [US1] Criar componente Dialog (via shadcn/Radix) em `components/ui/dialog.tsx`
- [ ] T020 [P] [US1] Criar componente Table (Table, TableHeader, TableBody, TableRow, TableCell) em `components/ui/table.tsx`
- [ ] T021 [P] [US1] Criar componente Form (FormField, FormLabel, FormMessage) em `components/ui/form.tsx`

**Checkpoint**: User Story 1 completa - 13 componentes base disponíveis

---

## Phase 4: User Story 2 - Design Tokens Consistentes (Priority: P1)

**Goal**: Mudança em uma variável CSS reflete em toda a aplicação

**Independent Test**: Alterar `--primary` no globals.css e verificar que todos componentes `bg-primary` mudam

- [ ] T022 [US2] Documentar mapeamento de tokens em comentários no `app/globals.css`
- [ ] T023 [US2] Configurar autocomplete do Tailwind para mostrar cores semânticas (verificar se `@theme inline` resolve)
- [ ] T024 [US2] Criar variante de cor `success` (emerald) para mensagens de sucesso
- [ ] T025 [US2] Criar variante de cor `warning` (amber) para avisos
- [ ] T026 [US2] Adicionar tokens de chart (--chart-1 a --chart-5) para futuros gráficos

**Checkpoint**: User Story 2 completa - Sistema de tokens totalmente funcional

---

## Phase 5: User Story 3 - Componentes Compostos (Priority: P2)

**Goal**: Desenvolvedores usam Modal, Form, DataTable com padrões consistentes

**Independent Test**: Criar modal de confirmação usando Dialog e verificar que tem overlay, animação e trap de foco

### P2 - Médios (10 componentes restantes)

- [ ] T027 [P] [US3] Criar componente Progress em `components/ui/progress.tsx`
- [ ] T028 [P] [US3] Criar componente Alert em `components/ui/alert.tsx`
- [ ] T029 [P] [US3] Configurar Sonner (Toast) em `components/ui/sonner.tsx` e adicionar Toaster ao layout
- [ ] T030 [P] [US3] Criar componente Separator em `components/ui/separator.tsx`
- [ ] T031 [P] [US3] Criar componente ScrollArea em `components/ui/scroll-area.tsx`
- [ ] T032 [P] [US3] Criar componente Tabs (Tabs, TabsList, TabsTrigger, TabsContent) em `components/ui/tabs.tsx`
- [ ] T033 [P] [US3] Criar componente Pagination em `components/ui/pagination.tsx`
- [ ] T034 [P] [US3] Criar componente AlertDialog em `components/ui/alert-dialog.tsx`
- [ ] T035 [P] [US3] Criar componente DropdownMenu em `components/ui/dropdown-menu.tsx`
- [ ] T036 [P] [US3] Criar componente Popover em `components/ui/popover.tsx`
- [ ] T037 [P] [US3] Criar componente Tooltip em `components/ui/tooltip.tsx`

### Compostos

- [ ] T038 [US3] Criar componente FormField (Label + Input + Message) em `components/composed/form-field.tsx`
- [ ] T039 [US3] Criar componente ConfirmDialog (AlertDialog padronizado) em `components/composed/confirm-dialog.tsx`
- [ ] T040 [US3] Criar componente DataTable (Table + Pagination + Sorting) em `components/composed/data-table.tsx`

**Checkpoint**: User Story 3 completa - Componentes compostos disponíveis

---

## Phase 6: User Story 4 - Migração Gradual (Priority: P2)

**Goal**: Componentes existentes migrados para usar Design System sem regressões visuais

**Independent Test**: Migrar `BotCard.tsx` e verificar que aparência visual permanece igual ou melhora

### Migração por Feature (ordem por impacto)

#### bots/ (50+ ocorrências)
- [ ] T041 [US4] Migrar `components/features/bots/BotCard.tsx` para usar Card, Badge, Button do Design System
- [ ] T042 [US4] Migrar `components/features/bots/BotListView.tsx` para usar tokens e componentes
- [ ] T043 [US4] Migrar `components/features/bots/BotFormView.tsx` para usar Input, Label, Textarea, Button

#### campaigns/
- [ ] T044 [P] [US4] Migrar `components/features/campaigns/CampaignListView.tsx` para usar Table, Badge, Button
- [ ] T045 [P] [US4] Migrar `components/features/campaigns/CampaignCard.tsx` para usar Card e tokens

#### contacts/
- [ ] T046 [P] [US4] Migrar `components/features/contacts/ContactListView.tsx` para usar Table, Checkbox, Button
- [ ] T047 [P] [US4] Migrar `components/features/contacts/ContactFormView.tsx` para usar Input, Label, Button

#### settings/
- [ ] T048 [P] [US4] Migrar `components/features/settings/SettingsView.tsx` para usar Card, Input, Switch, Button
- [ ] T049 [P] [US4] Migrar `components/features/settings/SetupWizardView.tsx` para usar tokens

#### templates/
- [ ] T050 [P] [US4] Migrar componentes em `components/features/templates/` para usar Card, Badge

#### dashboard/
- [ ] T051 [P] [US4] Migrar componentes em `components/features/dashboard/` para usar Card e tokens

#### Componentes UI existentes
- [ ] T052 [US4] Migrar `components/ui/AccountAlertBanner.tsx` para usar tokens (bg-destructive, text-destructive-foreground)
- [ ] T053 [US4] Migrar `components/ui/WhatsAppPhonePreview.tsx` para usar tokens

**Checkpoint**: User Story 4 completa - 80% dos componentes migrados

---

## Phase 7: User Story 5 - Documentação (Priority: P3)

**Goal**: Desenvolvedor novo consegue usar Design System apenas com documentação

**Independent Test**: Pedir a alguém criar um Card com Button usando apenas o quickstart.md

- [ ] T054 [US5] Atualizar `specs/002-design-system/quickstart.md` com exemplos de todos os 23 componentes
- [ ] T055 [P] [US5] Adicionar seção de "Como Migrar" no quickstart.md
- [ ] T056 [P] [US5] Criar exemplo de página completa usando Design System em `app/(dashboard)/test-ds/page.tsx`
- [ ] T057 [US5] Atualizar `component-index.md` marcando componentes implementados como ✅

**Checkpoint**: User Story 5 completa - Documentação pronta

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Melhorias que afetam múltiplas user stories

- [ ] T058 [P] Remover página de teste `/test-ds` (ou mover para /dev-only)
- [ ] T059 [P] Verificar que build passa sem erros: `npm run build`
- [ ] T060 [P] Verificar que lint passa: `npm run lint`
- [ ] T061 Fazer commit final da feature e criar PR para main
- [ ] T062 Rodar validação do `quickstart.md` com desenvolvedor novo

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ─────────────────────────────────┐
                                                 ↓
Phase 2 (Foundational - Tokens) ─────────────────┤ BLOQUEIA TUDO
                                                 ↓
┌────────────────────────────────────────────────┴──────────────────────────────────────┐
│                                                                                        │
│  Phase 3 (US1 - Componentes Base) ──→ Phase 5 (US3 - Compostos)                       │
│         ↓                                    ↓                                        │
│  Phase 4 (US2 - Tokens Doc)          Phase 6 (US4 - Migração)                         │
│                                              ↓                                        │
│                                      Phase 7 (US5 - Docs)                             │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                                 ↓
                                      Phase 8 (Polish)
```

### User Story Dependencies

| User Story | Depende de | Pode começar após |
|------------|------------|-------------------|
| US1 (Componentes Base) | Phase 2 | Tokens prontos |
| US2 (Tokens Doc) | US1 parcial | T009-T013 (P0 components) |
| US3 (Compostos) | US1 completa | T021 (Form) |
| US4 (Migração) | US1 + US3 | T040 (DataTable) |
| US5 (Documentação) | US1 + US3 + US4 | Tudo implementado |

### Parallel Opportunities

**Dentro de cada fase**, tarefas marcadas `[P]` podem rodar em paralelo:

```bash
# Phase 3 - Todos componentes P0 em paralelo:
T010 (Input) | T011 (Label) | T012 (Card) | T013 (Badge)

# Phase 3 - Todos componentes P1 em paralelo:
T014 (Textarea) | T015 (Select) | T016 (Checkbox) | T017 (Switch) | T018 (Skeleton) | T019 (Dialog) | T020 (Table) | T021 (Form)

# Phase 5 - Todos componentes P2 em paralelo:
T027-T037 (todos os 11 componentes)

# Phase 6 - Migrações por feature em paralelo:
T044-T045 (campaigns) | T046-T047 (contacts) | T048-T049 (settings) | T050 (templates) | T051 (dashboard)
```

---

## Parallel Example: Phase 3 (US1)

```bash
# Primeiro, criar Button (depende dos tokens):
T009: Create Button component with CVA in components/ui/button.tsx

# Depois, em paralelo (todos dependem só de tokens):
T010: Create Input component in components/ui/input.tsx
T011: Create Label component in components/ui/label.tsx
T012: Create Card component in components/ui/card.tsx
T013: Create Badge component in components/ui/badge.tsx

# Em seguida, em paralelo (P1 components):
T014-T021: All P1 components can be created in parallel
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. ✅ Complete Phase 1: Setup (T001-T004)
2. ✅ Complete Phase 2: Tokens (T005-T008)
3. ✅ Complete Phase 3: US1 P0 only (T009-T013) → **5 componentes críticos**
4. **STOP and VALIDATE**: Testar Button, Input, Card em página real
5. Deploy se necessário

### Incremental Delivery

| Increment | Tasks | Deliverable |
|-----------|-------|-------------|
| **MVP** | T001-T013 | 5 componentes P0 + tokens |
| **+P1** | T014-T026 | +8 componentes + tokens extras |
| **+Compostos** | T027-T040 | +11 componentes + 3 compostos |
| **+Migração** | T041-T053 | 80% codebase migrado |
| **+Docs** | T054-T057 | Documentação completa |
| **Final** | T058-T062 | Polish e PR |

### Estimativa de Tempo

| Phase | Tasks | Estimativa |
|-------|-------|------------|
| Setup | 4 | 30 min |
| Tokens | 4 | 1 hora |
| US1 (P0) | 5 | 2 horas |
| US1 (P1) | 8 | 3 horas |
| US2 | 5 | 1 hora |
| US3 | 14 | 4 horas |
| US4 | 13 | 6 horas |
| US5 | 4 | 2 horas |
| Polish | 5 | 1 hora |
| **TOTAL** | **62** | **~20 horas** |

---

## Summary

| Métrica | Valor |
|---------|-------|
| Total de tasks | 62 |
| Tasks por US1 | 13 |
| Tasks por US2 | 5 |
| Tasks por US3 | 14 |
| Tasks por US4 | 13 |
| Tasks por US5 | 4 |
| Tasks parallelizáveis | 48 (~77%) |
| MVP scope | T001-T013 (13 tasks) |
| Componentes a criar | 23 |
| Features a migrar | 8 |

---

## Notes

- `[P]` = arquivos diferentes, sem dependências
- `[USx]` = mapeia tarefa para user story específica
- Cada user story pode ser testada independentemente
- Commit após cada tarefa ou grupo lógico
- Pare em qualquer checkpoint para validar
- Evite: tarefas vagas, conflitos de arquivo, dependências cruzadas que quebram independência
