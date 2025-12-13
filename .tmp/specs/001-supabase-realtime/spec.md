# Feature Specification: Supabase Realtime Integration

**Feature Branch**: `001-supabase-realtime`  
**Created**: 2025-12-06  
**Status**: Draft  
**Input**: User description: "Implementar Supabase Realtime para deixar o app incrível com atualizações em tempo real"

## Visão Geral

Integrar Supabase Realtime ao SmartZap para fornecer atualizações automáticas da interface sem necessidade de refresh manual. O objetivo é criar uma experiência premium onde dados aparecem instantaneamente, impressionando os usuários.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Status de Campanhas ao Vivo (Priority: P1)

Como operador de campanhas, quero ver o progresso do envio de mensagens atualizando em tempo real, para que eu possa acompanhar o status sem precisar dar F5.

**Why this priority**: Core do produto - campanhas são a principal funcionalidade. Acompanhar o envio em tempo real é a experiência mais impactante.

**Independent Test**: Pode ser testado enviando uma campanha para 10 contatos e observando os contadores "Enviados: X / Total" atualizando automaticamente a cada envio.

**Acceptance Scenarios**:

1. **Given** campanha em andamento com 0/100 enviados, **When** sistema envia uma mensagem, **Then** contador atualiza para 1/100 em menos de 2 segundos sem refresh
2. **Given** campanha em andamento, **When** ocorre uma falha de envio, **Then** contador de falhas incrementa automaticamente
3. **Given** campanha finalizada, **When** última mensagem é enviada, **Then** status muda para "Concluída" automaticamente
4. **Given** usuário em outra aba, **When** campanha termina, **Then** ao voltar à aba, dados estão atualizados

---

### User Story 2 - Dashboard Métricas ao Vivo (Priority: P2)

Como gerente, quero ver as métricas do dashboard atualizando sozinhas, para impressionar clientes em reuniões de demonstração.

**Why this priority**: Alto impacto visual e de vendas. Dashboard é a primeira tela que usuários veem.

**Independent Test**: Pode ser testado enviando uma mensagem de teste e verificando se o contador "Mensagens Hoje" incrementa sem refresh.

**Acceptance Scenarios**:

1. **Given** dashboard aberto, **When** nova campanha é criada em outra aba, **Then** contador de campanhas atualiza automaticamente
2. **Given** dashboard aberto, **When** contato é adicionado, **Then** contador de contatos incrementa em tempo real
3. **Given** múltiplos usuários no dashboard, **When** dados mudam, **Then** todos veem atualização simultânea

---

### User Story 3 - Workflows Executando ao Vivo (Priority: P2)

Como desenvolvedor de automações, quero ver o progresso do workflow executando em tempo real, para debugar problemas facilmente.

**Why this priority**: Essencial para desenvolvimento e debug de automações complexas.

**Independent Test**: Pode ser testado executando um workflow de 3 nós e observando cada nó acender conforme é processado.

**Acceptance Scenarios**:

1. **Given** workflow iniciado, **When** nó é executado, **Then** nó fica destacado visualmente no canvas
2. **Given** workflow em execução, **When** nó falha, **Then** nó fica vermelho com mensagem de erro visível
3. **Given** visualizando workflow, **When** execução termina, **Then** caminho percorrido fica indicado

---

### User Story 4 - Cockpit Mode Interativo (Priority: P3)

Como operador no Cockpit Mode, quero ver contatos mudando de status automaticamente, para ter uma visão em tempo real do pipeline.

**Why this priority**: Melhora UX do Cockpit Mode existente, mas não é crítico para MVP.

**Independent Test**: Pode ser testado alterando status de um contato via API e verificando se o card move automaticamente no kanban.

**Acceptance Scenarios**:

1. **Given** Cockpit Mode aberto, **When** workflow muda status de contato, **Then** card move para nova coluna automaticamente
2. **Given** múltiplos contatos carregados, **When** um é atualizado, **Then** apenas aquele contato atualiza (não recarrega lista toda)
3. **Given** contato com timer expirado, **When** timeout ocorre, **Then** indicador visual atualiza

---

### User Story 5 - Notificações em Tempo Real (Priority: P3)

Como usuário do sistema, quero receber notificações instantâneas de eventos importantes, para reagir rapidamente.

**Why this priority**: Nice-to-have que melhora engajamento, mas sistema funciona sem.

**Independent Test**: Pode ser testado com um webhook de teste e verificando se toast notification aparece.

**Acceptance Scenarios**:

1. **Given** usuário logado, **When** campanha termina, **Then** notificação toast aparece em até 2 segundos
2. **Given** usuário logado, **When** erro crítico ocorre, **Then** notificação de alerta aparece imediatamente
3. **Given** usuário em qualquer página, **When** evento ocorre, **Then** notificação é visível globalmente

---

### Edge Cases

- O que acontece quando conexão WebSocket cai? → Sistema deve reconectar automaticamente e sincronizar estado
- O que acontece quando usuário está offline e volta? → Sistema deve sincronizar dados perdidos
- O que acontece com muitas atualizações simultâneas? → Sistema deve agrupar (debounce) para não sobrecarregar UI
- O que acontece se Supabase Realtime estiver indisponível? → Sistema funciona normalmente com refresh manual (graceful degradation)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sistema DEVE estabelecer conexão WebSocket com Supabase Realtime no carregamento da página
- **FR-002**: Sistema DEVE reconectar automaticamente em caso de desconexão, com backoff exponencial
- **FR-003**: Sistema DEVE atualizar UI em menos de 2 segundos após mudança no banco de dados
- **FR-004**: Sistema DEVE suportar subscriptions nas tabelas: `campaigns`, `campaign_contacts`, `contacts`, `workflows`, `executions`
- **FR-005**: Sistema DEVE agrupar atualizações frequentes (debounce de 200ms) para evitar flickering
- **FR-006**: Sistema DEVE continuar funcionando se Realtime falhar (graceful degradation)
- **FR-007**: Sistema DEVE mostrar indicador visual quando conexão Realtime estiver ativa
- **FR-008**: Sistema DEVE limpar subscriptions quando componente é desmontado (evitar memory leaks)

### Key Entities

- **Subscription**: Representa uma escuta ativa em uma tabela, com callback de atualização
- **Channel**: Canal de comunicação com o Supabase, agrupa múltiplas subscriptions
- **RealtimeEvent**: Evento recebido com tipo (INSERT, UPDATE, DELETE) e payload

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Usuários veem atualizações de campanhas em menos de 2 segundos após mudança no banco
- **SC-002**: Taxa de reconexão bem-sucedida após queda é de 95% em até 5 segundos
- **SC-003**: Sistema mantém menos de 5 conexões WebSocket simultâneas por usuário
- **SC-004**: 90% dos usuários percebem que dados atualizam sozinhos (métrica de pesquisa)
- **SC-005**: Zero memory leaks causados por subscriptions não limpas após 1 hora de uso
- **SC-006**: Sistema funciona normalmente quando Realtime está indisponível (fallback para refresh)

## Assumptions

- Supabase Realtime está habilitado no projeto (está no plano Free)
- Replication está ativado nas tabelas relevantes do Postgres
- Limite de 200 conexões simultâneas do plano Free é suficiente para uso atual
- Client Supabase já está configurado no projeto

## Pages Analysis for Realtime Optimization

Análise completa das páginas que se beneficiam do Realtime:

### Alta Prioridade (Core Features)

| Página | Tabela(s) | Benefício |
|--------|-----------|-----------|
| `/campaigns/[id]` | `campaigns`, `campaign_contacts` | Contador "532/1000" atualiza sozinho |
| `/conversations` | `conversations`, `messages` | Mensagens novas aparecem instantaneamente |
| `/dashboard` | `campaigns`, `contacts` | Métricas impressionam em demos |

### Média Prioridade (UX Melhorada)

| Página | Tabela(s) | Benefício |
|--------|-----------|-----------|
| `/workflows` | `workflows`, `executions` | Status "Publicado/Rascunho" atualiza |
| `/contacts` | `contacts` | Novo contato aparece sem refresh |
| `/templates/workspaces/[id]` | `executions` | Nodes acendem conforme executam |

### Tabelas para Habilitar Realtime no Supabase

1. **campaigns** - Status, contadores de envio
2. **campaign_contacts** - Progresso individual de cada envio
3. **contacts** - Novos contatos, mudanças de status
4. **conversations** - Novas conversas ativas
5. **messages** - Novas mensagens recebidas/enviadas
6. **workflows** - Status de publicação
7. **executions** - Progresso de workflow em tempo real

## Out of Scope

- Notificações push (browser notifications) - pode ser adicionado futuramente
- Sincronização offline (PWA) - complexidade adicional
- Histórico de notificações - apenas toasts transitórios por agora
