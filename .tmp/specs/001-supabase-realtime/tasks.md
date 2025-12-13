# Tasks: Supabase Realtime Integration

**Input**: Design documents from `/specs/001-supabase-realtime/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: Não solicitados - implementação sem testes automatizados.

**Organization**: Tasks organizadas por user story para implementação independente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[Story]**: User story relacionada (US1, US2, US3, US4, US5)
- Inclui caminhos exatos de arquivos

---

## Phase 1: Setup (Infraestrutura Compartilhada)

**Purpose**: Habilitar Realtime no Supabase e criar estrutura base

- [x] T001 Criar migration SQL para habilitar Realtime nas tabelas em `supabase/migrations/0003_enable_realtime.sql`
- [x] T002 [P] Criar types para Realtime em `types.ts` (RealtimeEvent, ChannelStatus, Subscription)
- [x] T003 [P] Criar utilitário de Realtime em `lib/supabase-realtime.ts`

---

## Phase 2: Foundational (Infraestrutura Core)

**Purpose**: Hooks e Provider que bloqueiam todas as user stories

**⚠️ CRITICAL**: Nenhuma user story pode começar até esta fase estar completa

- [x] T004 Criar `hooks/useRealtime.ts` - hook de contexto para status de conexão
- [x] T005 Criar `hooks/useRealtimeQuery.ts` - integração React Query + Realtime
- [x] T006 Criar `components/providers/RealtimeProvider.tsx` - provider global
- [x] T007 Integrar RealtimeProvider em `app/providers.tsx`
- [x] T008 [P] Criar `components/ui/RealtimeIndicator.tsx` - badge de status de conexão

**Checkpoint**: Foundation ready - implementação das user stories pode começar

---

## Phase 3: User Story 1 - Status de Campanhas ao Vivo (Priority: P1) 🎯 MVP

**Goal**: Contadores de campanha atualizam em tempo real ("532/1000 enviados")

**Independent Test**: Enviar campanha para 10 contatos e observar contadores atualizando automaticamente

### Implementation for User Story 1

- [x] T009 [US1] Atualizar `hooks/useCampaigns.ts` para usar useRealtimeQuery na tabela `campaigns`
- [x] T010 [US1] Atualizar `hooks/useCampaignContacts.ts` (ou criar) para Realtime na tabela `campaign_contacts`
- [x] T011 [US1] Atualizar `app/(dashboard)/campaigns/[id]/page.tsx` para exibir contador ao vivo
- [x] T012 [US1] Adicionar RealtimeIndicator no header da página de campanha

**Checkpoint**: Campanhas atualizam em tempo real - MVP funcional

---

## Phase 4: User Story 2 - Dashboard Métricas ao Vivo (Priority: P2)

**Goal**: Métricas do dashboard atualizam sozinhas (impressionar em demos)

**Independent Test**: Adicionar contato em outra aba e ver contador incrementar sem refresh

### Implementation for User Story 2

- [x] T013 [US2] Atualizar `hooks/useDashboard.ts` para usar useRealtimeQuery nas tabelas `campaigns`, `contacts`
- [x] T014 [US2] Atualizar `app/(dashboard)/page.tsx` ou `DashboardClientWrapper.tsx` para consumir dados Realtime
- [x] T015 [US2] Adicionar RealtimeIndicator no header do dashboard

**Checkpoint**: Dashboard atualiza em tempo real

---

## Phase 5: User Story 3 - Workflows Executando ao Vivo (Priority: P2)

**Goal**: Ver progresso do workflow executando (nodes acendendo)

**Independent Test**: Executar workflow de 3 nós e observar cada nó acender conforme processa

### Implementation for User Story 3

- [x] T016 [US3] Criar `hooks/useExecutionRealtime.ts` para subscrever tabela `executions`
- [x] T017 [US3] Atualizar canvas em `app/(dashboard)/templates/workspaces/[id]/page.tsx` para destacar node ativo
- [x] T018 [US3] Atualizar `app/(dashboard)/workflows/page.tsx` para mostrar status de publicação em tempo real

**Checkpoint**: Workflows mostram execução em tempo real

---

## Phase 6: User Story 4 - Cockpit Mode Interativo (Priority: P3)

**Goal**: Cards de contatos movem automaticamente no kanban

**Independent Test**: Alterar status de contato via API e ver card mover no kanban

### Implementation for User Story 4

- [ ] T019 [US4] Atualizar `hooks/useContacts.ts` para usar useRealtimeQuery na tabela `contacts`
- [ ] T020 [US4] Atualizar componentes de Cockpit Mode para renderizar mudanças incrementais (não recarregar lista toda)

**Checkpoint**: Cockpit Mode atualiza contatos em tempo real

---

## Phase 7: User Story 5 - Notificações em Tempo Real (Priority: P3)

**Goal**: Toast notifications aparecem instantaneamente para eventos importantes

**Independent Test**: Finalizar campanha e ver toast aparecer em outra página

### Implementation for User Story 5

- [x] T021 [US5] Criar `hooks/useRealtimeNotifications.ts` para subscrever eventos globais
- [x] T022 [US5] Criar `components/features/notifications/NotificationToast.tsx` - componente de toast
- [x] T023 [US5] Integrar NotificationToast no layout principal em `app/(dashboard)/layout.tsx`

**Checkpoint**: Notificações aparecem em tempo real

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Melhorias que afetam múltiplas user stories

- [x] T024 [P] Implementar debounce de 200ms em useRealtimeQuery para updates frequentes
- [x] T025 [P] Adicionar graceful degradation (funcionar sem Realtime)
- [x] T026 [P] Adicionar logs de erro para debugging de conexões
- [ ] T027 Atualizar documentação no quickstart.md com instruções de troubleshooting
- [ ] T028 Executar validação manual seguindo quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sem dependências - começar imediatamente
- **Foundational (Phase 2)**: Depende de Setup - BLOQUEIA todas user stories
- **User Stories (Phase 3-7)**: Todas dependem de Foundational
- **Polish (Phase 8)**: Depende de user stories desejadas estarem completas

### User Story Dependencies

| Story | Depende de | Pode começar após |
|-------|------------|-------------------|
| US1 (Campanhas) | Foundational | Phase 2 |
| US2 (Dashboard) | Foundational | Phase 2 |
| US3 (Workflows) | Foundational | Phase 2 |
| US4 (Cockpit) | Foundational | Phase 2 |
| US5 (Notificações) | Foundational | Phase 2 |

**Todas as user stories são independentes entre si!**

### Parallel Opportunities

```text
Phase 1 (Setup):
- T002, T003 podem rodar em paralelo após T001

Phase 2 (Foundational):
- T004, T005 podem rodar após T003
- T008 pode rodar em paralelo com T004-T007

Após Phase 2:
- US1, US2, US3, US4, US5 podem todas rodar em paralelo (diferentes desenvolvedores)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T008)
3. Complete Phase 3: User Story 1 (T009-T012)
4. **STOP and VALIDATE**: Testar campanhas atualizando em tempo real
5. Deploy/demo se pronto

### Incremental Delivery

1. Setup + Foundational → Infraestrutura pronta
2. Add US1 → Testar → Deploy (MVP!) **← Melhor ponto de parada**
3. Add US2 → Dashboard ao vivo → Deploy
4. Add US3 → Workflows ao vivo → Deploy
5. Add US4, US5 → Nice-to-have → Deploy

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 28 |
| Setup Tasks | 3 |
| Foundational Tasks | 5 |
| US1 Tasks | 4 |
| US2 Tasks | 3 |
| US3 Tasks | 3 |
| US4 Tasks | 2 |
| US5 Tasks | 3 |
| Polish Tasks | 5 |
| Parallel Opportunities | 12 tasks marcadas [P] |
| MVP Scope | Phase 1-3 (12 tasks) |

---

## Notes

- [P] tasks = arquivos diferentes, sem dependências
- [Story] label mapeia task para user story específica
- Cada user story pode ser completada e testada independentemente
- Commitar após cada task ou grupo lógico
- Parar em qualquer checkpoint para validar story independentemente
