# Tasks: Flow Engine (Motor de Execução de Flows)

**Input**: Design documents from `/specs/003-flow-engine/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema, types, and core interfaces

- [X] T001 Create database migrations for flow_executions and node_executions tables in `lib/migrations/003-flow-engine.sql`
- [X] T002 [P] Add FlowExecution and NodeExecution types to `types.ts`
- [X] T003 [P] Add ExecutionStatus and NodeExecutionStatus enums to `types.ts`
- [X] T004 [P] Create NodeExecutor interface in `lib/flow-engine/nodes/base.ts`
- [X] T005 Create ExecutionContext type in `lib/flow-engine/types.ts`
- [X] T006 Run database migration to create new tables

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Refactor node registry with plugin architecture in `lib/flow-engine/nodes/index.ts`
- [X] T008 [P] Create state manager with Redis persistence in `lib/flow-engine/state.ts` (expand existing)
- [X] T009 [P] Create flow-engine database operations in `lib/turso-db.ts` (add flowExecutionDb, nodeExecutionDb)
- [X] T010 Implement core executor with mode dispatch in `lib/flow-engine/executor.ts` (refactor existing)
- [X] T011 Create sendMessage helper with WhatsApp API integration in `lib/flow-engine/sender.ts`
- [X] T012 [P] Implement variable substitution with built-in variables in `lib/flow-engine/variables.ts` (expand existing)
- [X] T013 Create error handler with retry logic using whatsapp-errors.ts in `lib/flow-engine/error-handler.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Executar Flow Simples de Campanha (Priority: P1) 🎯 MVP

**Goal**: Execute multi-node flows for a list of contacts with rate limiting and progress tracking

**Independent Test**: Create flow with 3 nodes (text → image → text), select 5 contacts, start campaign, verify all received 3 messages

### Implementation for User Story 1

- [X] T014 [P] [US1] Implement message node executor in `lib/flow-engine/nodes/message.ts` (refactor existing)
- [X] T015 [P] [US1] Implement image node executor in `lib/flow-engine/nodes/image.ts` (refactor existing)
- [X] T016 [US1] Create campaign mode executor with QStash batches in `lib/flow-engine/modes/campaign.ts`
- [X] T017 [US1] Implement rate limiting with 6s delay between messages in campaign mode
- [X] T018 [US1] Create POST /api/flow-engine/execute endpoint in `app/api/flow-engine/execute/route.ts`
- [X] T019 [P] [US1] Create GET /api/flow-engine/status/[id] endpoint in `app/api/flow-engine/status/[id]/route.ts`
- [X] T020 [US1] Integrate campaign dispatch with flow-engine in `app/api/campaign/dispatch/route.ts`
- [X] T021 [US1] Implement progress tracking and realtime updates via existing SSE

**Checkpoint**: User Story 1 complete - basic campaign execution works independently

---

## Phase 4: User Story 2 - Responder Mensagem com Flow de Chatbot (Priority: P1)

**Goal**: Automatically respond to incoming WhatsApp messages using active flow, maintaining conversation state

**Independent Test**: Configure welcome flow, send "Oi" to number, verify automatic response

### Implementation for User Story 2

- [X] T022 [US2] Create chatbot mode executor with Redis state in `lib/flow-engine/modes/chatbot.ts`
- [X] T023 [US2] Implement conversation state management in `lib/flow-engine/state.ts`
- [X] T024 [US2] Implement session timeout logic (configurable, default 30min) in chatbot mode
- [X] T025 [US2] Migrate findMatchingWorkflow logic from `lib/workflow-executor.ts` to `lib/flow-engine/modes/chatbot.ts`
- [X] T026 [US2] Migrate executeWorkflow logic from `lib/workflow-executor.ts` to `lib/flow-engine/modes/chatbot.ts`
- [X] T027 [US2] Integrate chatbot mode with webhook in `app/api/webhook/route.ts` (replace workflow-executor calls)
- [X] T028 [US2] Implement trigger matching (any_message, keyword, starts_with, contains, regex)

**Checkpoint**: User Story 2 complete - chatbot responds to messages independently

---

## Phase 5: User Story 3 - Enviar Diferentes Tipos de Mídia (Priority: P2)

**Goal**: Support all WhatsApp media message types: video, audio, document, sticker, location, contacts

**Independent Test**: Create flow with each media type, execute for 1 contact, verify correct delivery

### Implementation for User Story 3

- [X] T029 [P] [US3] Implement video node executor in `lib/flow-engine/nodes/video.ts` (refactor existing)
- [X] T030 [P] [US3] Implement audio node executor in `lib/flow-engine/nodes/audio.ts` (refactor existing)
- [X] T031 [P] [US3] Implement document node executor in `lib/flow-engine/nodes/document.ts` (refactor existing)
- [X] T032 [P] [US3] Implement sticker node executor in `lib/flow-engine/nodes/sticker.ts` (NEW)
- [X] T033 [P] [US3] Implement location node executor in `lib/flow-engine/nodes/location.ts` (refactor existing)
- [X] T034 [P] [US3] Implement contacts (vCard) node executor in `lib/flow-engine/nodes/contacts.ts` (NEW)
- [X] T035 [US3] Register all media nodes in `lib/flow-engine/nodes/index.ts`

**Checkpoint**: User Story 3 complete - all media types work

---

## Phase 6: User Story 4 - Processar Mensagens Interativas (Priority: P2)

**Goal**: Send and process interactive messages: buttons, lists, CTA URL, carousels

**Independent Test**: Create flow with buttons "Sim/Não", send to test user, click each option, verify flow follows correct path

### Implementation for User Story 4

- [X] T036 [P] [US4] Implement buttons node executor (reply buttons, up to 3) in `lib/flow-engine/nodes/buttons.ts` (NEW)
- [X] T037 [P] [US4] Implement list node executor (up to 10 sections, 10 items each) in `lib/flow-engine/nodes/list.ts` (NEW)
- [X] T038 [P] [US4] Implement cta-url node executor in `lib/flow-engine/nodes/cta-url.ts` (refactor existing)
- [X] T039 [P] [US4] Implement carousel node executor in `lib/flow-engine/nodes/carousel.ts` (refactor existing)
- [X] T040 [US4] Implement button_reply processing in chatbot mode
- [X] T041 [US4] Implement list_reply processing in chatbot mode
- [X] T042 [US4] Implement edge routing based on button/list selection
- [X] T043 [US4] Register all interactive nodes in `lib/flow-engine/nodes/index.ts`

**Checkpoint**: User Story 4 complete - interactive messages work with response handling

---

## Phase 7: User Story 5 - Enviar Templates Pré-aprovados (Priority: P2)

**Goal**: Send pre-approved templates outside 24h window with parameter substitution

**Independent Test**: Create template node with parameters, execute for contact outside 24h window, verify delivery

### Implementation for User Story 5

- [X] T044 [US5] Implement template node executor in `lib/flow-engine/nodes/template.ts` (NEW)
- [X] T045 [US5] Implement template parameter substitution (header, body, button variables)
- [X] T046 [US5] Implement template response mapping for button clicks in `lib/flow-engine/state.ts`
- [X] T047 [US5] Add template button click routing in chatbot mode
- [X] T048 [US5] Implement reaction node executor in `lib/flow-engine/nodes/reaction.ts` (NEW)
- [X] T049 [US5] Register template and reaction nodes in `lib/flow-engine/nodes/index.ts`

**Checkpoint**: User Story 5 complete - templates work with parameter substitution

---

## Phase 8: User Story 6 - Gerenciar Estado de Conversa (Priority: P2)

**Goal**: Maintain conversation state per user: current node, collected variables, history

**Independent Test**: Start conversation, answer 3 questions in sequence, verify system remembers previous answers

### Implementation for User Story 6

- [X] T050 [US6] Implement input node executor with variable collection in `lib/flow-engine/nodes/input.ts` (refactor existing)
- [X] T051 [US6] Implement menu node executor in `lib/flow-engine/nodes/menu.ts` (refactor existing)
- [X] T052 [US6] Implement conversation history storage (last 20 messages) in state
- [X] T053 [US6] Implement session timeout with configurable duration
- [X] T054 [US6] Implement session resume prompt ("continue or restart?")
- [X] T055 [US6] Ensure state isolation between concurrent conversations

**Checkpoint**: User Story 6 complete - stateful conversations work

---

## Phase 9: User Story 7 - Executar Nodes de Controle (Priority: P3)

**Goal**: Support flow control nodes: delay, conditionals (if/else), jumps

**Independent Test**: Create flow with 5s delay between messages, execute, verify interval

### Implementation for User Story 7

- [X] T056 [P] [US7] Implement delay node executor with QStash scheduling in `lib/flow-engine/nodes/delay.ts` (refactor existing)
- [X] T057 [P] [US7] Implement condition node executor (if/else) in `lib/flow-engine/nodes/condition.ts` (refactor existing)
- [X] T058 [P] [US7] Implement jump node executor in `lib/flow-engine/nodes/jump.ts` (NEW)
- [X] T059 [US7] Implement loop detection with 100 node limit in executor
- [X] T060 [US7] Register control nodes in `lib/flow-engine/nodes/index.ts`

**Checkpoint**: User Story 7 complete - flow control works

---

## Phase 10: User Story 8 - Estrutura Preparada para IA (Priority: P3)

**Goal**: Extensible architecture allowing new node types (especially AI) to be added in < 1 hour

**Independent Test**: NodeExecutor interface allows adding "ai_response" type without refactoring engine

### Implementation for User Story 8

- [X] T061 [US8] Document NodeExecutor interface with examples in `lib/flow-engine/nodes/README.md`
- [X] T062 [US8] Implement unknown node handler (log warning, skip to next) in executor
- [X] T063 [US8] Add conversationHistory to ExecutionContext for future AI access
- [X] T064 [US8] Create placeholder AI node executor in `lib/flow-engine/nodes/ai-agent.ts` (refactor existing)
- [X] T065 [US8] Implement handoff node executor in `lib/flow-engine/nodes/handoff.ts` (refactor existing)

**Checkpoint**: User Story 8 complete - engine is extensible

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, optimization, and final integration

- [X] T066 [P] Deprecate and remove `lib/workflow-executor.ts` (all logic migrated)
- [X] T067 [P] Add comprehensive logging with FLOW_ENGINE_DEBUG flag
- [X] T068 [P] Create GET /api/flow-engine/executions endpoint for listing executions
- [X] T069 [P] Create GET /api/flow-engine/executions/[id]/nodes endpoint for node details
- [X] T070 [P] Create POST /api/flow-engine/status/[id]/pause endpoint
- [X] T071 [P] Create POST /api/flow-engine/status/[id]/resume endpoint
- [X] T072 [P] Create DELETE /api/flow-engine/status/[id] endpoint for cancellation
- [X] T073 Update quickstart.md with final API examples
- [X] T074 Run full validation using quickstart.md scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ──────────────────────────────────────────────→ T001-T006
          │
          ▼
Phase 2 (Foundational) ───────────────────────────────────────→ T007-T013
          │
          ├───────────────────────────────────────────────────────────────────┐
          │                                                                    │
          ▼                                                                    ▼
Phase 3 (US1: Campaign) ─→ T014-T021      Phase 4 (US2: Chatbot) ─→ T022-T028
          │                                         │
          └─────────────────┬───────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
Phase 5 (US3)       Phase 6 (US4)       Phase 7 (US5)
T029-T035           T036-T043           T044-T049
          │                 │                 │
          └─────────────────┼─────────────────┘
                            ▼
                    Phase 8 (US6: State)
                    T050-T055
                            │
          ┌─────────────────┴─────────────────┐
          ▼                                   ▼
Phase 9 (US7: Control)               Phase 10 (US8: Extensibility)
T056-T060                            T061-T065
          │                                   │
          └─────────────────┬─────────────────┘
                            ▼
                    Phase 11 (Polish)
                    T066-T074
```

### User Story Independence

| Story | Depends On | Can Test Independently? |
|-------|------------|------------------------|
| US1 (Campaign) | Foundational | ✅ Yes - flow → contacts → messages |
| US2 (Chatbot) | Foundational | ✅ Yes - webhook → flow → response |
| US3 (Media) | US1 or US2 | ✅ Yes - just needs one mode working |
| US4 (Interactive) | US2 (for response handling) | ✅ Yes - send + process responses |
| US5 (Templates) | US1 or US2 | ✅ Yes - send templates |
| US6 (State) | US2 | ✅ Yes - multi-step conversations |
| US7 (Control) | US1 or US2 | ✅ Yes - delay, conditions |
| US8 (Extensibility) | Foundational | ✅ Yes - architecture only |

### Parallel Opportunities Per Phase

**Phase 1 (Setup)**:
```bash
# Parallel: T002, T003, T004 (different files)
```

**Phase 2 (Foundational)**:
```bash
# Parallel: T008, T009, T012 (different files)
```

**Phase 3 (US1)**:
```bash
# Parallel: T014, T015 (different node files)
# Parallel: T019 (status endpoint while T016-T018 run)
```

**Phase 4 (US2)**:
```bash
# After T022, T023-T024 can run parallel
# T025-T026 must be sequential (migrate then refactor)
```

**Phase 5 (US3)**:
```bash
# ALL PARALLEL: T029, T030, T031, T032, T033, T034 (different node files)
```

**Phase 6 (US4)**:
```bash
# Parallel: T036, T037, T038, T039 (different node files)
# Then T040-T042 (response handling, sequential)
```

**Phase 11 (Polish)**:
```bash
# ALL PARALLEL: T066, T067, T068, T069, T070, T071, T072 (different files/endpoints)
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T013)
3. Complete Phase 3: User Story 1 - Campaign (T014-T021)
4. **STOP and VALIDATE**: Test campaign execution independently
5. Complete Phase 4: User Story 2 - Chatbot (T022-T028)
6. **STOP and VALIDATE**: Test chatbot independently
7. Deploy MVP with campaign + chatbot working

### Incremental Delivery

After MVP:
- Add US3 (Media) → Test → Deploy
- Add US4 (Interactive) → Test → Deploy
- Add US5 (Templates) → Test → Deploy
- Add US6 (State) → Test → Deploy
- Add US7 (Control) → Test → Deploy
- Add US8 (Extensibility) → Test → Deploy
- Polish → Final Deploy

---

## Task Summary

| Phase | Tasks | Parallel Tasks | Story |
|-------|-------|----------------|-------|
| Setup | T001-T006 | T002, T003, T004 | - |
| Foundational | T007-T013 | T008, T009, T012 | - |
| US1 (Campaign) | T014-T021 | T014, T015, T019 | P1 |
| US2 (Chatbot) | T022-T028 | T023, T024 | P1 |
| US3 (Media) | T029-T035 | T029-T034 | P2 |
| US4 (Interactive) | T036-T043 | T036-T039 | P2 |
| US5 (Templates) | T044-T049 | - | P2 |
| US6 (State) | T050-T055 | - | P2 |
| US7 (Control) | T056-T060 | T056, T057, T058 | P3 |
| US8 (Extensibility) | T061-T065 | - | P3 |
| Polish | T066-T074 | T066-T072 | - |

**Total Tasks**: 74  
**P1 Tasks (MVP)**: 21 (T014-T021 + T022-T028 + foundational)  
**Parallel Opportunities**: 38 tasks can run in parallel within their phase

---

## Notes

- [P] tasks = different files, no dependencies within phase
- [US#] label maps task to specific user story
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- `workflow-executor.ts` will be deprecated after US2 migration (T066)
