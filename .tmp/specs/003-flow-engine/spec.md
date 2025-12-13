# Feature Specification: Flow Engine (Motor de Execução de Flows)

**Feature Branch**: `003-flow-engine`  
**Created**: 2025-01-03  
**Status**: Draft  
**Input**: Motor de Execução de Flows para WhatsApp - suporta todos os tipos de mensagem da Cloud API, modo chatbot e campanha, com estrutura preparada para IA

---

## Visão Geral

O Flow Engine é o **motor de execução** que transforma os flows visuais criados no Workflow Builder em mensagens reais enviadas via WhatsApp Cloud API. Suporta dois modos de operação:

1. **Modo Chatbot**: Responde a mensagens recebidas, gerencia estado de conversa, aguarda respostas
2. **Modo Campanha**: Disparo em massa para lista de contatos, execução sequencial

---

## User Scenarios & Testing

### User Story 1 - Executar Flow Simples de Campanha (Priority: P1)

O usuário cria uma campanha selecionando um flow e uma lista de contatos. O sistema executa o flow para cada contato, enviando as mensagens na sequência definida.

**Why this priority**: É o caso de uso principal do SmartZap - automação de marketing via WhatsApp. Sem isso, o produto não entrega valor.

**Independent Test**: Criar um flow com 3 nodes (texto → imagem → texto), selecionar 5 contatos, iniciar campanha e verificar se todos receberam as 3 mensagens.

**Acceptance Scenarios**:

1. **Given** um flow com nodes [Start → Text → Image → Text → End] e 10 contatos selecionados, **When** usuário inicia a campanha, **Then** cada contato recebe as 3 mensagens na ordem correta
2. **Given** um flow em execução, **When** a API retorna erro 131056 (rate limit), **Then** sistema aguarda 6 segundos e reenvia automaticamente
3. **Given** uma campanha com 100 contatos, **When** execução inicia, **Then** dashboard mostra progresso em tempo real (enviados/total)
4. **Given** um flow com variáveis `{{nome}}`, **When** mensagem é enviada, **Then** variável é substituída pelo nome do contato

---

### User Story 2 - Responder Mensagem com Flow de Chatbot (Priority: P1)

Quando um usuário envia mensagem para o número do WhatsApp, o sistema identifica o flow ativo e responde automaticamente, seguindo a lógica definida.

**Why this priority**: Chatbot é o segundo pilar do produto - atendimento automatizado 24/7.

**Independent Test**: Configurar flow de boas-vindas, enviar "Oi" para o número, verificar se resposta automática é enviada.

**Acceptance Scenarios**:

1. **Given** um flow de chatbot ativo com trigger "qualquer mensagem", **When** usuário envia "Olá", **Then** sistema responde com primeiro node do flow
2. **Given** um flow com botões de resposta rápida, **When** usuário clica em um botão, **Then** sistema avança para o node correspondente à opção escolhida
3. **Given** um flow com lista interativa, **When** usuário seleciona um item, **Then** sistema processa a seleção e continua o flow
4. **Given** conversa em andamento no flow, **When** passam 24 horas sem interação, **Then** sessão é encerrada e próxima mensagem reinicia o flow

---

### User Story 3 - Enviar Diferentes Tipos de Mídia (Priority: P2)

O motor deve suportar todos os tipos de mensagem da WhatsApp Cloud API: texto, imagem, vídeo, áudio, documento, sticker, localização e contatos.

**Why this priority**: Essencial para campanhas ricas, mas texto sozinho já entrega valor mínimo.

**Independent Test**: Criar flow com cada tipo de mídia, executar para 1 contato, verificar recebimento correto de cada tipo.

**Acceptance Scenarios**:

1. **Given** node de imagem com URL, **When** executado, **Then** imagem é enviada com caption opcional
2. **Given** node de vídeo com media_id, **When** executado, **Then** vídeo é enviado (máx 16MB)
3. **Given** node de documento PDF, **When** executado, **Then** documento é enviado com filename
4. **Given** node de localização, **When** executado, **Then** pin de mapa é enviado com nome e endereço
5. **Given** node de áudio, **When** executado, **Then** áudio é enviado e reproduzível no WhatsApp

---

### User Story 4 - Processar Mensagens Interativas (Priority: P2)

O motor deve enviar e processar respostas de mensagens interativas: botões, listas, CTA URL e carrosséis.

**Why this priority**: Interatividade aumenta engajamento, mas flows simples já funcionam.

**Independent Test**: Criar flow com botões "Sim/Não", enviar para usuário teste, clicar em cada opção e verificar se flow segue caminho correto.

**Acceptance Scenarios**:

1. **Given** node com 3 reply buttons, **When** usuário clica no botão "Opção B", **Then** flow segue para o node conectado ao "Opção B"
2. **Given** node com lista de 10 itens em 2 seções, **When** usuário seleciona item, **Then** sistema recebe ID do item e continua flow
3. **Given** node CTA URL, **When** executado, **Then** botão de abrir URL é renderizado corretamente
4. **Given** node de carrossel com 5 cards, **When** executado, **Then** usuário visualiza carrossel deslizável

---

### User Story 5 - Enviar Templates Pré-aprovados (Priority: P2)

O motor deve suportar envio de templates (fora da janela de 24h) com substituição de parâmetros.

**Why this priority**: Templates são obrigatórios para iniciar conversa, essencial para campanhas proativas.

**Independent Test**: Criar node de template com parâmetros, executar para contato que não interagiu em 24h, verificar entrega.

**Acceptance Scenarios**:

1. **Given** template "pedido_confirmado" com parâmetros {{1}}=nome e {{2}}=pedido, **When** executado, **Then** mensagem é enviada com valores substituídos
2. **Given** template com header de imagem, **When** executado, **Then** imagem do header é carregada corretamente
3. **Given** template com botões dinâmicos, **When** executado, **Then** botões aparecem com textos corretos
4. **Given** usuário fora da janela de 24h, **When** flow tenta enviar texto simples, **Then** sistema retorna erro indicando necessidade de template

---

### User Story 6 - Gerenciar Estado de Conversa (Priority: P2)

O sistema deve manter o estado de cada conversa para saber em qual node o usuário está e quais variáveis foram coletadas.

**Why this priority**: Sem estado, chatbot não funciona para flows com múltiplas etapas.

**Independent Test**: Iniciar conversa, responder 3 perguntas em sequência, verificar se sistema lembra respostas anteriores.

**Acceptance Scenarios**:

1. **Given** conversa iniciada no node 5 de 10, **When** usuário responde, **Then** sistema continua do node 6
2. **Given** flow que coleta nome e email, **When** usuário fornece ambos, **Then** variáveis estão disponíveis para nodes seguintes
3. **Given** sessão inativa por 30 minutos (configurável), **When** usuário envia mensagem, **Then** sistema pergunta se deseja continuar ou reiniciar
4. **Given** múltiplas conversas simultâneas, **When** cada usuário responde, **Then** estados são isolados e não se misturam

---

### User Story 7 - Executar Nodes de Controle (Priority: P3)

O motor deve suportar nodes de controle de fluxo: delay, condicionais (if/else), e saltos.

**Why this priority**: Aumenta flexibilidade, mas flows lineares já atendem maioria dos casos.

**Independent Test**: Criar flow com delay de 5s entre mensagens, executar, verificar intervalo.

**Acceptance Scenarios**:

1. **Given** node de delay de 10 segundos, **When** executado, **Then** próximo node só executa após 10s
2. **Given** node condicional "se variável X = 'sim'", **When** X='sim', **Then** segue caminho verdadeiro
3. **Given** node condicional com X='não', **When** executado, **Then** segue caminho falso
4. **Given** node de salto para outro ponto do flow, **When** executado, **Then** execução continua do ponto indicado

---

### User Story 8 - Estrutura Preparada para IA (Priority: P3)

O motor deve ter estrutura extensível para adicionar node de IA (LLM) no futuro, mesmo que não implementado agora.

**Why this priority**: IA é diferencial competitivo, mas chatbot determinístico já resolve 80% dos casos.

**Independent Test**: Interface de node genérico permite adicionar novo tipo "ai_response" sem refatorar motor.

**Acceptance Scenarios**:

1. **Given** arquitetura do motor, **When** desenvolvedor cria novo tipo de node, **Then** basta implementar interface NodeExecutor
2. **Given** node com tipo desconhecido, **When** motor encontra, **Then** loga warning e pula para próximo node
3. **Given** estrutura de contexto, **When** node de IA for implementado, **Then** tem acesso a histórico de conversa e variáveis

---

### Edge Cases

- O que acontece quando WhatsApp API está fora do ar? → Retry com backoff exponencial, máx 3 tentativas, depois marca como falha
- Como lidar com usuário que bloqueia o número? → Detectar erro 135000, marcar contato como OPT_OUT
- O que acontece se mídia expira (URL > 5min)? → Re-upload automático ou fallback para mensagem de erro
- Como tratar número inválido/não existe no WhatsApp? → Erro 133010, marcar contato como inválido
- O que acontece em loop infinito no flow? → Limite de 100 nodes por execução, depois aborta
- Como lidar com resposta inesperada do usuário? → Node de fallback configurável ou repete pergunta

---

## Requirements

### Functional Requirements

#### Core Engine

- **FR-001**: Sistema DEVE ler e interpretar JSON de flows criados no Workflow Builder
- **FR-002**: Sistema DEVE executar nodes em sequência respeitando conexões definidas
- **FR-003**: Sistema DEVE suportar execução em modo CAMPANHA (lista de contatos, sem esperar resposta)
- **FR-004**: Sistema DEVE suportar execução em modo CHATBOT (resposta a webhooks, aguarda interação)
- **FR-005**: Sistema DEVE gerenciar estado de cada conversa individualmente (stateful)

#### Tipos de Mensagem

- **FR-010**: Sistema DEVE enviar mensagens de TEXTO (até 4096 caracteres)
- **FR-011**: Sistema DEVE enviar mensagens de IMAGEM (JPEG, PNG, até 5MB)
- **FR-012**: Sistema DEVE enviar mensagens de VÍDEO (MP4, 3GPP, até 16MB)
- **FR-013**: Sistema DEVE enviar mensagens de ÁUDIO (AAC, MP4, OGG, até 16MB)
- **FR-014**: Sistema DEVE enviar mensagens de DOCUMENTO (PDF, DOC, etc., até 100MB)
- **FR-015**: Sistema DEVE enviar mensagens de STICKER (WebP, 512x512, até 500KB)
- **FR-016**: Sistema DEVE enviar mensagens de LOCALIZAÇÃO (lat, long, nome, endereço)
- **FR-017**: Sistema DEVE enviar mensagens de CONTATOS (vCard)
- **FR-018**: Sistema DEVE enviar REPLY BUTTONS (até 3 botões)
- **FR-019**: Sistema DEVE enviar LIST MESSAGE (até 10 seções, 10 itens cada)
- **FR-020**: Sistema DEVE enviar CTA URL BUTTON
- **FR-021**: Sistema DEVE enviar CARROSSEL DE MÍDIA (2-10 cards)
- **FR-022**: Sistema DEVE enviar TEMPLATES com parâmetros substituídos
- **FR-023**: Sistema DEVE enviar TEMPLATES com header de mídia
- **FR-024**: Sistema DEVE enviar REAÇÕES (emoji) a mensagens

#### Controle de Fluxo

- **FR-030**: Sistema DEVE suportar node de DELAY (espera configurável)
- **FR-031**: Sistema DEVE suportar node CONDICIONAL (if/else baseado em variáveis)
- **FR-032**: Sistema DEVE substituir VARIÁVEIS em textos ({{nome}}, {{telefone}}, etc.)
- **FR-033**: Sistema DEVE armazenar VARIÁVEIS coletadas durante o flow
- **FR-034**: Sistema DEVE suportar node de SALTO para outro ponto do flow

#### Interatividade (Chatbot)

- **FR-040**: Sistema DEVE processar RESPOSTAS de botões (button_reply webhook)
- **FR-041**: Sistema DEVE processar SELEÇÕES de lista (list_reply webhook)
- **FR-042**: Sistema DEVE processar TEXTO LIVRE do usuário
- **FR-043**: Sistema DEVE rotear resposta para branch correta do flow
- **FR-044**: Sistema DEVE expirar sessão após timeout configurável (padrão 30min)

#### Rate Limiting & Erros

- **FR-050**: Sistema DEVE respeitar rate limit de 1 msg/6s por par origem-destino
- **FR-051**: Sistema DEVE implementar retry com backoff exponencial em erros 429
- **FR-052**: Sistema DEVE detectar e tratar erro de janela 24h (131047)
- **FR-053**: Sistema DEVE detectar e marcar contatos que bloquearam (135000)
- **FR-054**: Sistema DEVE detectar números inválidos (133010)
- **FR-055**: Sistema DEVE logar todos os erros com contexto (flow_id, node_id, contact_id)

#### Extensibilidade

- **FR-060**: Sistema DEVE usar arquitetura de plugins para tipos de node
- **FR-061**: Sistema DEVE permitir adicionar novos tipos de node sem alterar core
- **FR-062**: Sistema DEVE expor interface NodeExecutor para implementações customizadas
- **FR-063**: Sistema DEVE preparar contexto com histórico para futuro node de IA

### Key Entities

- **Flow**: Definição do fluxo (JSON com nodes e connections)
- **FlowExecution**: Instância de execução de um flow (campanha ou sessão de chat)
- **NodeExecution**: Registro de execução de cada node individual
- **ConversationState**: Estado atual de uma conversa (node atual, variáveis, histórico)
- **MessageQueue**: Fila de mensagens a serem enviadas (para rate limiting)

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Flow de 5 nodes executa completamente para 100 contatos em menos de 15 minutos
- **SC-002**: Taxa de entrega de mensagens acima de 95% (excluindo bloqueios/inválidos)
- **SC-003**: Latência média entre receber webhook e enviar resposta menor que 2 segundos
- **SC-004**: Sistema suporta 50 campanhas simultâneas sem degradação
- **SC-005**: Zero mensagens perdidas por falha de estado (persistência confiável)
- **SC-006**: Desenvolvedor consegue adicionar novo tipo de node em menos de 1 hora
- **SC-007**: 100% dos tipos de mensagem da Cloud API são suportados
- **SC-008**: Sistema recupera automaticamente de 95% dos erros transitórios

---

## Assumptions

- Workflow Builder já gera JSON válido com estrutura de nodes e connections
- Credenciais da WhatsApp Cloud API já estão configuradas por workspace
- Redis está disponível para gerenciamento de estado e filas
- QStash está disponível para processamento de filas distribuídas
- Turso (SQLite) é usado para persistência de execuções e logs

---

## Out of Scope (para esta versão)

- Implementação completa do node de IA (apenas estrutura preparada)
- Interface visual de monitoramento em tempo real (usa logs)
- Webhook de status de leitura (delivered é suficiente)
- Suporte a grupos do WhatsApp
- Pagamentos via WhatsApp
- Chamadas de voz
