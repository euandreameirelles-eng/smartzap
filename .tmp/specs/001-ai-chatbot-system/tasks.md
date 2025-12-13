# Tasks: Sistema de Chatbot WhatsApp

**Input**: Design documents from `/specs/001-ai-chatbot-system/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Testes NÃO foram solicitados explicitamente na spec. Incluídos apenas onde são bloqueadores naturais (validação de fluxo, por exemplo).

**Organization**: Tasks são agrupadas por user story para permitir implementação e teste independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[Story]**: User story relacionada (US1, US2, etc.)
- Caminhos exatos incluídos nas descrições

---

## Phase 1: Setup (Infraestrutura Inicial)

**Purpose**: Inicialização do projeto e estrutura base

- [X] T001 Instalar dependências: `npm i @xyflow/react zustand`
- [X] T002 [P] Criar diretório `lib/flow-engine/` com index.ts
- [X] T003 [P] Criar diretório `lib/whatsapp/` com index.ts
- [X] T004 [P] Criar diretório `components/features/bots/` vazio
- [X] T005 [P] Criar diretório `components/features/flow-editor/` vazio
- [X] T006 [P] Criar diretório `components/features/flow-editor/nodes/` vazio
- [X] T007 [P] Criar diretório `components/features/conversations/` vazio

---

## Phase 2: Foundational (Pré-requisitos Bloqueantes)

**Purpose**: Infraestrutura core que DEVE estar completa antes de qualquer user story

**⚠️ CRITICAL**: Nenhuma user story pode começar até esta fase estar completa

### Database Schema (Turso)

- [X] T008 Criar migration SQL com todas as 9 tabelas em `lib/migrations/001-chatbot-system.sql` conforme data-model.md
- [X] T009 Executar migration no Turso (criar script `npm run db:migrate`)
- [X] T010 [P] Adicionar operações CRUD para bots em `lib/turso-db.ts` (botDb)
- [X] T011 [P] Adicionar operações CRUD para flows em `lib/turso-db.ts` (flowDb)
- [X] T012 [P] Adicionar operações CRUD para conversations em `lib/turso-db.ts` (conversationDb)
- [X] T013 [P] Adicionar operações para messages em `lib/turso-db.ts` (messageDb)
- [X] T014 [P] Adicionar operações para conversation_variables em `lib/turso-db.ts` (variableDb)

### Tipos TypeScript

- [X] T015 Adicionar tipos Bot, BotStatus em `types.ts`
- [X] T016 [P] Adicionar tipos Flow, FlowNode, FlowEdge, NodeType em `types.ts`
- [X] T017 [P] Adicionar tipos Conversation, ConversationStatus em `types.ts`
- [X] T018 [P] Adicionar tipos Message, MessageDirection, MessageOrigin, MessageStatus em `types.ts`
- [X] T019 [P] Adicionar tipos AIAgent, Tool, ToolExecution em `types.ts`
- [X] T020 [P] Adicionar tipos ConversationVariable em `types.ts`

### WhatsApp Message Builders

- [X] T021 [P] Implementar builder de text messages em `lib/whatsapp/text.ts`
- [X] T022 [P] Implementar builder de reply buttons em `lib/whatsapp/interactive.ts`
- [X] T023 [P] Implementar builder de list messages em `lib/whatsapp/interactive.ts`
- [X] T024 [P] Implementar builder de media messages em `lib/whatsapp/media.ts`
- [X] T025 Criar barrel export em `lib/whatsapp/index.ts`

### Redis State Cache

- [X] T026 Implementar funções de cache de conversa em `lib/redis.ts` (getConversationState, setConversationState)
- [X] T027 [P] Implementar rate limit por par (phone:recipient) em `lib/redis.ts`
- [X] T028 [P] Implementar cache de CSW em `lib/redis.ts`

**Checkpoint**: Fundação pronta - implementação de user stories pode começar

---

## Phase 3: User Story 1 - Criar Chatbot de Regras (Priority: P1) 🎯 MVP

**Goal**: Criar bot de regras com menu de opções e respostas por palavras-chave

**Independent Test**: Criar bot com menu "1-Cardápio, 2-Horários, 3-Atendente" e verificar respostas via WhatsApp

### API Routes (Backend)

- [X] T029 [US1] Implementar GET /api/bots em `app/api/bots/route.ts` (lista bots)
- [X] T030 [US1] Implementar POST /api/bots em `app/api/bots/route.ts` (cria bot)
- [X] T031 [US1] Implementar GET /api/bots/[id] em `app/api/bots/[id]/route.ts`
- [X] T032 [US1] Implementar PATCH /api/bots/[id] em `app/api/bots/[id]/route.ts`
- [X] T033 [US1] Implementar DELETE /api/bots/[id] em `app/api/bots/[id]/route.ts`
- [X] T034 [US1] Implementar POST /api/bots/[id]/activate em `app/api/bots/[id]/activate/route.ts`
- [X] T035 [US1] Implementar POST /api/bots/[id]/deactivate em `app/api/bots/[id]/deactivate/route.ts`

### Flow Engine Core

- [X] T036 [US1] Implementar state manager em `lib/flow-engine/state.ts` (Redis + Turso sync)
- [X] T037 [US1] Implementar variable substitution em `lib/flow-engine/variables.ts` ({{var}} replacement)
- [X] T038 [US1] Implementar executor base em `lib/flow-engine/executor.ts` (node traversal)

### Node Handlers (Básicos)

- [X] T039 [P] [US1] Implementar StartNodeHandler em `lib/flow-engine/nodes/start.ts`
- [X] T040 [P] [US1] Implementar MessageNodeHandler em `lib/flow-engine/nodes/message.ts`
- [X] T041 [P] [US1] Implementar MenuNodeHandler em `lib/flow-engine/nodes/menu.ts` (auto Reply Buttons vs List)
- [X] T042 [P] [US1] Implementar EndNodeHandler em `lib/flow-engine/nodes/end.ts`
- [X] T043 [US1] Criar barrel export em `lib/flow-engine/nodes/index.ts`

### Webhook Integration

- [X] T044 [US1] Estender webhook em `app/api/webhook/route.ts` para rotear para bot engine
- [X] T045 [US1] Implementar POST /api/webhook/engine em `app/api/webhook/engine/route.ts` (QStash worker)
- [X] T046 [US1] Implementar criação/recuperação de conversation no webhook

### Service Layer

- [X] T047 [US1] Implementar botService.turso.ts em `services/botService.turso.ts`

### Hooks (Frontend)

- [X] T048 [US1] Implementar useBots hook em `hooks/useBots.ts` (React Query)

### Views (Frontend)

- [X] T049 [P] [US1] Criar BotCard component em `components/features/bots/BotCard.tsx`
- [X] T050 [P] [US1] Criar BotListView em `components/features/bots/BotListView.tsx`
- [X] T051 [US1] Criar BotFormView em `components/features/bots/BotFormView.tsx` (create/edit)

### Pages

- [X] T052 [US1] Criar página /bots em `app/(dashboard)/bots/page.tsx`
- [X] T053 [US1] Criar página /bots/[id] em `app/(dashboard)/bots/[id]/page.tsx`

**Checkpoint**: Bot de regras funcional via menu numérico/palavras-chave

---

## Phase 4: User Story 2 - Recursos Interativos WhatsApp (Priority: P2)

**Goal**: Usar botões, listas e quick replies nativos do WhatsApp

**Independent Test**: Mensagem com 3 botões aparece corretamente e responde ao clique

### Message Type Selection

- [X] T054 [US2] Implementar seleção automática Button vs List em `lib/flow-engine/nodes/menu.ts` baseado em quantidade de opções
- [X] T055 [P] [US2] Implementar validação de limites (20 chars título botão, 24 chars título lista) em `lib/whatsapp/interactive.ts`
- [X] T056 [P] [US2] Implementar header/footer opcionais em `lib/whatsapp/interactive.ts`

### Interactive Response Handling

- [X] T057 [US2] Processar button_reply no webhook em `app/api/webhook/route.ts`
- [X] T058 [US2] Processar list_reply no webhook em `app/api/webhook/route.ts`
- [X] T059 [US2] Mapear reply ID para transição de nó em `lib/flow-engine/executor.ts`

### CTA URL Button

- [X] T060 [P] [US2] Implementar CTA URL button builder em `lib/whatsapp/interactive.ts`
- [X] T061 [P] [US2] Implementar CtaUrlNodeHandler em `lib/flow-engine/nodes/cta-url.ts`

**Checkpoint**: Botões e listas interativas funcionando

---

## Phase 5: User Story 3 - Editor Visual de Fluxos (Priority: P3)

**Goal**: Criar fluxos visualmente com drag-and-drop usando React Flow

**Independent Test**: Criar fluxo com 5 blocos conectados e testar via WhatsApp

### API Routes (Flows)

- [X] T062 [US3] Implementar GET /api/bots/[id]/flows em `app/api/bots/[id]/flows/route.ts`
- [X] T063 [US3] Implementar PUT /api/bots/[id]/flows em `app/api/bots/[id]/flows/route.ts`
- [X] T064 [US3] Implementar POST /api/bots/[id]/flows/publish em `app/api/bots/[id]/flows/publish/route.ts`
- [X] T065 [US3] Implementar POST /api/flows/[id]/validate em `app/api/flows/[id]/validate/route.ts`

### Flow Validation

- [X] T066 [US3] Implementar validador de fluxo em `lib/flow-engine/validator.ts` (loops, conexões órfãs)

### Service Layer

- [X] T067 [US3] Implementar flowService.turso.ts em `services/flowService.turso.ts`

### Hooks (Frontend)

- [X] T068 [US3] Implementar useFlowEditor hook em `hooks/useFlowEditor.ts` (React Query + React Flow)

### Custom Nodes (React Flow)

- [X] T069 [P] [US3] Criar StartNode em `components/features/flow-editor/nodes/StartNode.tsx`
- [X] T070 [P] [US3] Criar MessageNode em `components/features/flow-editor/nodes/MessageNode.tsx`
- [X] T071 [P] [US3] Criar MenuNode em `components/features/flow-editor/nodes/MenuNode.tsx`
- [X] T072 [P] [US3] Criar InputNode em `components/features/flow-editor/nodes/InputNode.tsx`
- [X] T073 [P] [US3] Criar ConditionNode em `components/features/flow-editor/nodes/ConditionNode.tsx`
- [X] T074 [P] [US3] Criar DelayNode em `components/features/flow-editor/nodes/DelayNode.tsx`
- [X] T075 [P] [US3] Criar HandoffNode em `components/features/flow-editor/nodes/HandoffNode.tsx`
- [X] T076 [P] [US3] Criar EndNode em `components/features/flow-editor/nodes/EndNode.tsx`
- [X] T077 [US3] Criar barrel export em `components/features/flow-editor/index.ts`

### Editor Panels

- [X] T078 [P] [US3] Criar NodePalette (toolbox) em `components/features/flow-editor/NodePalette.tsx`
- [X] T079 [P] [US3] Criar NodeInspector em `components/features/flow-editor/NodeInspector.tsx`

### Editor View

- [X] T080 [US3] Criar FlowCanvas em `components/features/flow-editor/FlowCanvas.tsx`

### Pages

- [X] T081 [US3] Criar página /bots/[id]/editor em `app/(dashboard)/bots/[id]/editor/page.tsx`

**Checkpoint**: Editor visual funcional com 8 tipos de nó

---

## Phase 6: User Story 4 - Variáveis e Dados do Contato (Priority: P4)

**Goal**: Salvar informações coletadas e usar em mensagens ({{nome}}, {{pedido}})

**Independent Test**: Perguntar nome, salvar, usar em mensagem seguinte

### Node Handlers (Coleta)

- [X] T087 [US4] Implementar InputNodeHandler em `lib/flow-engine/nodes/input.ts` (coleta + validação)
- [X] T088 [US4] Implementar ConditionNodeHandler em `lib/flow-engine/nodes/condition.ts`

### Variable Management

- [X] T089 [US4] Implementar persistência de variáveis em `lib/flow-engine/variables.ts`
- [X] T090 [US4] Implementar validações (text, email, phone, number) em `lib/flow-engine/nodes/input.ts`

### API Routes (Variables)

- [X] T091 [P] [US4] Implementar GET /api/conversations/[id]/variables em `app/api/conversations/[id]/variables/route.ts`
- [X] T092 [P] [US4] Implementar PUT /api/conversations/[id]/variables em `app/api/conversations/[id]/variables/route.ts`

### UI Updates

- [X] T093 [US4] Adicionar editor de variáveis no PropertiesPanel para InputNode
- [X] T094 [US4] Adicionar editor de condições no PropertiesPanel para ConditionNode

**Checkpoint**: Variáveis funcionando com substituição {{var}}

---

## Phase 7: User Story 5 - Visualizar e Intervir em Conversas (Priority: P5)

**Goal**: Ver conversas ativas, histórico e assumir atendimento

**Independent Test**: Ver conversa, clicar "Assumir", enviar mensagem manual, bot pausa

### API Routes (Conversations)

- [X] T095 [US5] Implementar GET /api/conversations em `app/api/conversations/route.ts`
- [X] T096 [US5] Implementar GET /api/conversations/[id] em `app/api/conversations/[id]/route.ts`
- [X] T097 [US5] Implementar POST /api/conversations/[id]/takeover em `app/api/conversations/[id]/takeover/route.ts`
- [X] T098 [US5] Implementar POST /api/conversations/[id]/release em `app/api/conversations/[id]/release/route.ts`
- [X] T099 [US5] Implementar POST /api/conversations/[id]/messages em `app/api/conversations/[id]/messages/route.ts`
- [X] T100 [US5] Implementar POST /api/conversations/[id]/end em `app/api/conversations/[id]/end/route.ts`

### Service Layer

- [X] T101 [US5] Implementar conversationService.turso.ts em `services/conversationService.turso.ts`

### Hooks

- [X] T102 [US5] Implementar useConversations hook em `hooks/useConversations.ts`

### Views

- [X] T103 [P] [US5] Criar MessageBubble em `components/features/conversations/MessageBubble.tsx`
- [X] T104 [P] [US5] Criar ConversationListView em `components/features/conversations/ConversationListView.tsx`
- [X] T105 [US5] Criar ConversationDetailView em `components/features/conversations/ConversationDetailView.tsx`

### Pages

- [X] T106 [US5] Criar página /conversations em `app/(dashboard)/conversations/page.tsx`

### Handoff Integration

- [X] T107 [US5] Implementar HandoffNodeHandler em `lib/flow-engine/nodes/handoff.ts`
- [X] T108 [US5] Implementar notificação de takeover (Realtime) em `lib/realtime.ts`

**Checkpoint**: Inbox de conversas funcional com takeover/release

---

## Phase 8: User Story 6 - Agentes de IA nos Fluxos (Priority: P6)

**Goal**: Adicionar blocos de IA que respondem de forma inteligente

**Independent Test**: Menu → "Dúvidas" → Agente IA responde → "Preços" → Tabela fixa

### Database

- [X] T109 [P] [US6] Adicionar operações CRUD para ai_agents em `lib/turso-db.ts`
- [X] T110 [P] [US6] Adicionar operações CRUD para ai_tools em `lib/turso-db.ts`

### API Routes (AI Agents)

- [X] T111 [US6] Implementar CRUD /api/ai-agents em `app/api/ai-agents/route.ts` e `app/api/ai-agents/[id]/route.ts`

### AI Integration

- [X] T112 [US6] Implementar AIAgentNodeHandler em `lib/flow-engine/nodes/ai-agent.ts`
- [X] T113 [US6] Implementar chamada ao Gemini em `lib/flow-engine/nodes/ai-agent.ts`
- [X] T114 [US6] Implementar passagem de histórico de conversa como contexto

### UI

- [X] T115 [P] [US6] Criar AIAgentNode em `components/features/flow-editor/nodes/AIAgentNode.tsx`
- [X] T116 [US6] Adicionar configuração de AI no PropertiesPanel

**Checkpoint**: Blocos de IA funcionais com Gemini

---

## Phase 9: User Story 7 - Ferramentas (Tools) para IA (Priority: P7)

**Goal**: Configurar webhooks que IA pode chamar durante conversa

**Independent Test**: Configurar tool "consultar_pedido", IA usa e retorna dados reais

### API Routes (Tools)

- [X] T117 [US7] Implementar CRUD /api/ai-agents/[id]/tools em `app/api/ai-agents/[id]/tools/route.ts`

### Tool Execution

- [X] T118 [US7] Implementar execução de tool (HTTP call) em `lib/flow-engine/tools.ts`
- [X] T119 [US7] Implementar logging de tool_executions em `lib/flow-engine/tools.ts`
- [X] T120 [US7] Implementar incorporação de resultado na resposta IA

### UI

- [X] T121 [US7] Adicionar gestão de tools no PropertiesPanel para AIAgentNode

**Checkpoint**: Tools funcionais com logging de execução

---

## Phase 10: Media & Advanced Messages (Extensão)

**Purpose**: Blocos de mídia e mensagens avançadas

### Node Handlers (Mídia)

- [X] T122 [P] Implementar ImageNodeHandler em `lib/flow-engine/nodes/image.ts`
- [X] T123 [P] Implementar VideoNodeHandler em `lib/flow-engine/nodes/video.ts`
- [X] T124 [P] Implementar DocumentNodeHandler em `lib/flow-engine/nodes/document.ts`
- [X] T125 [P] Implementar AudioNodeHandler em `lib/flow-engine/nodes/audio.ts`
- [X] T126 [P] Implementar LocationNodeHandler em `lib/flow-engine/nodes/location.ts`
- [X] T127 [P] Implementar CarouselNodeHandler em `lib/flow-engine/nodes/carousel.ts`

### Custom Nodes (UI)

- [X] T128 [P] Criar ImageNode em `components/features/flow-editor/nodes/ImageNode.tsx`
- [X] T129 [P] Criar VideoNode em `components/features/flow-editor/nodes/VideoNode.tsx`
- [X] T130 [P] Criar DocumentNode em `components/features/flow-editor/nodes/DocumentNode.tsx`
- [X] T131 [P] Criar AudioNode em `components/features/flow-editor/nodes/AudioNode.tsx`
- [X] T132 [P] Criar LocationNode em `components/features/flow-editor/nodes/LocationNode.tsx`
- [X] T133 [P] Criar CarouselNode em `components/features/flow-editor/nodes/CarouselNode.tsx`

### Delay Node

- [X] T134 Implementar DelayNodeHandler em `lib/flow-engine/nodes/delay.ts` com agendamento QStash
- [X] T135 Implementar POST /api/webhook/schedule em `app/api/webhook/schedule/route.ts`

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Melhorias que afetam múltiplas user stories

- [X] T136 [P] Adicionar navegação para /bots no sidebar em `app/(dashboard)/layout.tsx`
- [X] T137 [P] Adicionar navegação para /conversations no sidebar em `app/(dashboard)/layout.tsx`
- [X] T138 Implementar indicador de typing antes de respostas longas (lib/whatsapp/status.ts)
- [X] T139 Implementar mark as read quando bot responde (lib/whatsapp/status.ts)
- [X] T140 [P] Adicionar loading states em todas as views (já existente)
- [X] T141 [P] Adicionar error boundaries em páginas (components/ui/ErrorBoundary.tsx)
- [X] T142 Implementar paginação na lista de conversas
- [X] T143 Implementar busca/filtro na lista de bots (já existente)
- [X] T144 Validar quickstart.md com fluxo completo de teste
- [X] T145 Atualizar README.md com nova funcionalidade

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← BLOCKS ALL USER STORIES
    ↓
┌───────────────────────────────────────────────────┐
│ User Stories podem ser paralelas após Phase 2:   │
│                                                   │
│  Phase 3 (US1) ─→ Phase 4 (US2) ─→ Phase 5 (US3) │
│       ↓                                           │
│  Phase 6 (US4) ─→ Phase 7 (US5)                  │
│       ↓                                           │
│  Phase 8 (US6) ─→ Phase 9 (US7)                  │
│       ↓                                           │
│  Phase 10 (Media)                                 │
└───────────────────────────────────────────────────┘
    ↓
Phase 11 (Polish)
```

### User Story Dependencies

| Story | Depends On | Can Start After |
|-------|-----------|-----------------|
| US1 (Bot de Regras) | Phase 2 | Foundational complete |
| US2 (Interativos) | US1 | US1 complete (extends menu) |
| US3 (Editor Visual) | US1 | US1 complete (needs bot) |
| US4 (Variáveis) | US3 | US3 complete (needs editor) |
| US5 (Conversas) | US1 | US1 complete (needs conversations) |
| US6 (IA) | US3, US4 | Editor + Variables complete |
| US7 (Tools) | US6 | AI Agents complete |

### Parallel Opportunities

**Within Phase 2 (Foundational):**
```bash
# Parallel Group A (DB)
T010, T011, T012, T013, T014 # All turso-db operations

# Parallel Group B (Types)
T015, T016, T017, T018, T019, T020 # All types.ts additions

# Parallel Group C (WhatsApp Builders)
T021, T022, T023, T024 # All lib/whatsapp/*

# Parallel Group D (Redis)
T026, T027, T028 # Redis operations
```

**Within Phase 5 (Editor Visual):**
```bash
# All custom nodes in parallel
T074-T081 # 8 node components

# Both panels in parallel
T083, T084 # NodePanel + PropertiesPanel
```

**Within Phase 10 (Media):**
```bash
# All media handlers in parallel
T122-T127 # 6 node handlers

# All media UI nodes in parallel  
T128-T133 # 6 node components
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. ✅ Phase 1: Setup (~30min)
2. ✅ Phase 2: Foundational (~4h)
3. ✅ Phase 3: User Story 1 (~6h)
4. **STOP**: Bot de regras funciona via menu/keywords
5. Deploy inicial possível

**MVP Tasks: T001-T053 (53 tasks)**

### Incremental Delivery

| Milestone | User Stories | Value Delivered |
|-----------|--------------|-----------------|
| MVP | US1 | Bot de regras funciona |
| v0.2 | US1 + US2 | Botões interativos |
| v0.3 | US1-3 | Editor visual |
| v0.4 | US1-5 | Inbox + Takeover |
| v0.5 | US1-6 | IA básica |
| v1.0 | US1-7 + Polish | Feature completa |

---

## Task Summary

| Phase | Tasks | Parallel | Description |
|-------|-------|----------|-------------|
| 1 | T001-T007 | 6 | Setup |
| 2 | T008-T028 | 16 | Foundational |
| 3 | T029-T053 | 6 | US1: Bot de Regras |
| 4 | T054-T061 | 4 | US2: Interativos |
| 5 | T062-T086 | 14 | US3: Editor Visual |
| 6 | T087-T094 | 2 | US4: Variáveis |
| 7 | T095-T108 | 3 | US5: Conversas |
| 8 | T109-T116 | 2 | US6: IA |
| 9 | T117-T121 | 0 | US7: Tools |
| 10 | T122-T135 | 12 | Media |
| 11 | T136-T145 | 4 | Polish |
| **Total** | **145** | **69** | |

**Parallel Opportunities**: ~47% das tasks podem rodar em paralelo

---

## Notes

- Tasks [P] = arquivos diferentes, sem dependências
- [USx] = mapeia task para user story específica
- Cada user story é testável independentemente
- Commit após cada task ou grupo lógico
- Pare em qualquer checkpoint para validar incremento
- Evitar: tasks vagas, conflitos de arquivo, dependências cross-story
