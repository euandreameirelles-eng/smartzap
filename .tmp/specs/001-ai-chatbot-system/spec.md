# Feature Specification: Sistema de Chatbot WhatsApp (Regras + IA)

**Feature Branch**: `001-ai-chatbot-system`  
**Created**: 2025-12-02  
**Status**: Draft  
**Input**: Sistema de chatbot para WhatsApp estilo ManyChat/Botpress com suporte a fluxos visuais baseados em regras como prioridade, com opção de escalar para agentes de IA. Construído 100% sobre a API oficial da Meta (WhatsApp Cloud API).

## Contexto e Decisões de Design

### Base Tecnológica
- **WhatsApp Cloud API (Meta) v24.0**: Única fonte de verdade para envio/recebimento de mensagens
- **Mensagens Interativas**: Uso de botões, listas e quick replies nativos da API Meta
- **Templates Aprovados**: Para mensagens fora da janela de 24h (já existente no SmartZap)
- **Sessões de Conversa**: Janela de 24h da Meta para mensagens livres (Customer Service Window)

### Abordagem
- **Prioridade 1**: Bots baseados em regras (sem IA, sem custo por mensagem)
- **Prioridade 2**: Editor visual de fluxos (React Flow)
- **Prioridade 3**: Agentes de IA como extensão opcional

---

## Referência Técnica: WhatsApp Cloud API

> **Fonte**: Documentação oficial Meta - [developers.facebook.com/docs/whatsapp](https://developers.facebook.com/docs/whatsapp)  
> **Análise completa**: `specs/001-ai-chatbot-system/research/meta-api-capabilities.md` (21 tipos de mensagem documentados)  
> **Tabela de limites**: `specs/001-ai-chatbot-system/research/api-limits-cheatsheet.md`

### Tipos de Mensagem Disponíveis (21 tipos documentados)

| Tipo | Uso no Chatbot | Limitações |
|------|----------------|------------|
| **Text Messages** | Mensagens livres | Apenas dentro da CSW, preview URL opcional |
| **Reply Buttons** | Menus com até 3 opções | Máx 3 botões, título 20 chars |
| **List Messages** | Menus com 4-10 opções | Máx 10 items, título 24 chars, header só texto |
| **CTA URL Button** | Direcionar para links | 1 botão por mensagem |
| **Media Carousel** | Showcase de ofertas | 2-10 cards, CTA URL cada, todos mesmo header type |
| **Product Carousel** | Catálogo de produtos | Requer catálogo Meta, 2-10 cards |
| **Image Messages** | Enviar imagens | JPEG/PNG, 5MB máx |
| **Video Messages** | Enviar vídeos | MP4/3GPP, H.264, 16MB máx |
| **Audio Messages** | Enviar áudios | MP3/M4A/AAC/OGG, 16MB máx |
| **Voice Messages** | Áudio estilo gravado | OGG/OPUS, 512KB para ícone play |
| **Document Messages** | Enviar arquivos | PDF/DOC/etc, 100MB máx |
| **Sticker Messages** | Enviar stickers | WebP apenas, 100-500KB |
| **Location Messages** | Enviar localização | lat/long + nome/endereço |
| **Location Request** | Pedir localização | Usuário pode recusar |
| **Contacts Messages** | Compartilhar contatos | Máx 257 contatos |
| **Reaction Messages** | Reagir a mensagens | Qualquer emoji, só webhook sent |
| **Contextual Replies** | Responder citando | Não funciona com templates |
| **WhatsApp Flows** | Formulários complexos | Requer aprovação Meta |
| **Templates** | Fora da janela 24h | Requer aprovação prévia |
| **Mark as Read** | Marcar como lido | Marca anteriores também |
| **Typing Indicators** | Indicar digitação | Máx 25 segundos |
| **Address Messages** | Coletar endereço | ⚠️ APENAS Índia (+91) |

### Limites Críticos da API

| Limite | Valor | Impacto no Design |
|--------|-------|-------------------|
| Botões por mensagem | **3 máximo** | Menus >3 opções usam List |
| Items em lista | **10 máximo** | Menus >10 dividir em submenus |
| Título do botão | **20 caracteres** | Textos curtos e objetivos |
| Título item lista | **24 caracteres** | Textos curtos e objetivos |
| Descrição item lista | **72 caracteres** | Descrição opcional |
| Pair rate limit | **1 msg/6 segundos** | Delay entre mensagens para mesmo usuário |
| Customer Service Window | **24 horas** | Após expirar, só templates |
| Flow JSON size | **10 MB** | Limite para WhatsApp Flows |

### Webhooks de Entrada (Todos os tipos)

| Tipo de Mensagem | Campo no Payload | Dados Relevantes |
|------------------|------------------|------------------|
| Texto livre | `message.text.body` | Texto digitado |
| Clique em botão | `message.interactive.button_reply` | `id`, `title` |
| Seleção em lista | `message.interactive.list_reply` | `id`, `title`, `description` |
| Resposta de Flow | `message.interactive.nfm_reply` | `response_json` |
| Quick reply template | `message.button` | `text`, `payload` |
| Imagem | `message.image` | `id`, `caption`, `mime_type` |
| Documento | `message.document` | `id`, `filename`, `mime_type` |
| Áudio | `message.audio` | `id`, `mime_type` |
| Vídeo | `message.video` | `id`, `caption`, `mime_type` |
| Sticker | `message.sticker` | `id`, `mime_type` |
| Localização | `message.location` | `latitude`, `longitude`, `name`, `address` |
| Contatos | `message.contacts[]` | Array de contatos vCard-style |
| Reação | `message.reaction` | `emoji`, `message_id` |
| Pedido (Order) | `message.order` | `catalog_id`, `product_items[]` |

### Status de Mensagens (Webhooks de Status)

| Status | Significado |
|--------|-------------|
| `sent` | Mensagem enviada ao servidor WhatsApp |
| `delivered` | Mensagem entregue ao dispositivo do usuário |
| `read` | Mensagem lida pelo usuário |
| `failed` | Falha no envio (verificar código de erro) |

### Janelas de Conversa e Cobrança

| Tipo | Quando Abre | Duração | Custo |
|------|-------------|---------|-------|
| Service | Msg não-template na CSW | 24h | Grátis |
| Marketing | Template marketing | 24h | $$ |
| Utility | Template utility fora CSW | 24h | $ |
| Free Entry Point | Resposta a CTWA <24h | 72h | Grátis |

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Criar Chatbot de Regras com Menu de Opções (Priority: P1)

Como administrador do sistema, quero criar um chatbot simples com menus de opções e respostas automáticas baseadas em palavras-chave, para automatizar atendimento sem depender de IA e sem custo adicional por mensagem.

**Why this priority**: Esta é a base de qualquer ferramenta de chatbot (ManyChat, Botpress, etc). A maioria dos casos de uso não precisa de IA - menus e respostas fixas resolvem 80% dos problemas.

**Independent Test**: Criar um bot com menu "1-Cardápio, 2-Horários, 3-Atendente" e verificar que cada opção retorna a resposta correta via WhatsApp.

**Acceptance Scenarios**:

1. **Given** o usuário está criando um bot, **When** ele define uma mensagem de boas-vindas, **Then** essa mensagem é enviada automaticamente quando um contato inicia conversa
2. **Given** um bot tem menu de opções configurado, **When** cliente digita o número da opção, **Then** a resposta correspondente é enviada
3. **Given** um bot tem palavras-chave configuradas, **When** cliente digita palavra que contém a keyword, **Then** a resposta mapeada é enviada
4. **Given** cliente digita algo não reconhecido, **When** bot processa, **Then** mensagem de fallback é enviada com opções válidas
5. **Given** um bot usa botões interativos da Meta, **When** cliente clica no botão, **Then** o fluxo correspondente é executado

---

### User Story 2 - Usar Recursos Interativos Nativos do WhatsApp (Priority: P2)

Como administrador do sistema, quero usar os recursos interativos nativos do WhatsApp (botões, listas, quick replies) nas respostas do bot, para melhorar a experiência do usuário e aumentar taxas de resposta.

**Why this priority**: A API da Meta oferece componentes ricos que aumentam engajamento. Usar texto puro quando há botões disponíveis é desperdício.

**Independent Test**: Configurar uma mensagem com 3 botões e verificar que aparecem corretamente no WhatsApp do cliente e respondem ao clique.

**Acceptance Scenarios**:

1. **Given** o usuário configura uma mensagem, **When** ele adiciona botões de resposta rápida, **Then** a mensagem é enviada com botões clicáveis (máx 3)
2. **Given** o usuário configura uma lista de opções, **When** há mais de 3 opções, **Then** a mensagem é enviada como lista interativa (máx 10 itens)
3. **Given** cliente clica em um botão, **When** webhook recebe o callback, **Then** o bot processa como se fosse texto da opção clicada
4. **Given** o dispositivo não suporta botões, **When** mensagem é enviada, **Then** fallback para texto com opções numeradas

---

### User Story 3 - Construir Fluxos Visuais Drag-and-Drop (Priority: P3)

Como administrador do sistema, quero criar fluxos de conversa visualmente arrastando e conectando blocos, para visualizar e editar a lógica do bot sem programação.

**Why this priority**: Editor visual é o diferencial de ferramentas como ManyChat. Permite criar fluxos complexos de forma intuitiva.

**Independent Test**: Criar um fluxo com: Início → Boas-vindas → Menu (3 opções) → Respostas diferentes para cada → Fim. Testar via WhatsApp.

**Acceptance Scenarios**:

1. **Given** o usuário está no editor de fluxos, **When** ele arrasta um bloco de mensagem, **Then** o bloco é posicionado na área de trabalho
2. **Given** dois blocos existem, **When** usuário conecta a saída de um à entrada do outro, **Then** uma aresta visual é criada
3. **Given** um fluxo está completo, **When** usuário clica em "Testar", **Then** pode simular o fluxo sem enviar mensagens reais
4. **Given** um fluxo está salvo e ativo, **When** mensagem chega do WhatsApp, **Then** o fluxo é executado automaticamente

---

### User Story 4 - Gerenciar Variáveis e Dados do Contato (Priority: P4)

Como administrador do sistema, quero salvar informações coletadas durante a conversa (nome, pedido, preferência) e usá-las em mensagens posteriores, para personalizar o atendimento.

**Why this priority**: Variáveis permitem personalização ("Olá {{nome}}") e lógica condicional (se já é cliente → fluxo A).

**Independent Test**: Criar fluxo que pergunta nome, salva em variável, e usa em mensagem seguinte.

**Acceptance Scenarios**:

1. **Given** o bot pergunta o nome do cliente, **When** cliente responde, **Then** a resposta é salva na variável {{nome}}
2. **Given** uma variável está salva, **When** mensagem usa {{nome}}, **Then** o valor real é substituído antes do envio
3. **Given** variáveis de contato existem, **When** admin visualiza contato, **Then** todas variáveis coletadas são exibidas
4. **Given** um bloco de condição existe, **When** avalia {{pedido_ativo}} == true, **Then** fluxo segue caminho correto

---

### User Story 5 - Visualizar e Intervir em Conversas (Priority: P5)

Como operador, quero ver todas as conversas ativas em tempo real e poder assumir o atendimento manualmente quando necessário, para resolver casos que o bot não consegue.

**Why this priority**: Nem tudo pode ser automatizado. Operadores precisam ver o que está acontecendo e intervir.

**Independent Test**: Ver conversa ativa, clicar em "Assumir", enviar mensagem manual e verificar que bot pausa.

**Acceptance Scenarios**:

1. **Given** o operador acessa a tela de conversas, **When** há conversas ativas, **Then** são listadas ordenadas por última mensagem
2. **Given** operador seleciona uma conversa, **When** visualiza, **Then** vê histórico completo incluindo respostas do bot
3. **Given** operador clica em "Assumir", **When** envia mensagem manual, **Then** bot pausa e operador assume
4. **Given** operador clica em "Devolver ao bot", **When** próxima mensagem chega, **Then** bot retoma automação

---

### User Story 6 - Adicionar Agentes de IA aos Fluxos (Priority: P6)

Como administrador do sistema, quero adicionar blocos de "Agente IA" nos fluxos para casos onde respostas inteligentes são necessárias, combinando regras simples com IA quando apropriado.

**Why this priority**: IA é poderosa mas cara. Usar apenas onde necessário (ex: após qualificação inicial por regras).

**Independent Test**: Criar fluxo: Menu → Se escolhe "Dúvidas" → Agente IA responde → Se escolhe "Preços" → Tabela fixa.

**Acceptance Scenarios**:

1. **Given** o usuário está editando um fluxo, **When** arrasta bloco "Agente IA", **Then** pode configurar prompt de sistema e modelo
2. **Given** fluxo chega no bloco de IA, **When** mensagem é processada, **Then** resposta é gerada pelo modelo configurado
3. **Given** agente IA está respondendo, **When** há histórico de conversa, **Then** contexto é passado para a IA
4. **Given** usuário quer limitar custo, **When** configura max_tokens, **Then** respostas respeitam o limite

---

### User Story 7 - Configurar Ferramentas (Tools) para Agentes IA (Priority: P7)

Como administrador do sistema, quero configurar ferramentas que os agentes de IA podem usar (consultar pedido, verificar estoque, agendar), para que a IA execute ações reais durante a conversa.

**Why this priority**: Tools são o diferencial de agentes modernos, mas dependem da IA estar funcionando primeiro.

**Independent Test**: Configurar tool "consultar_pedido", e quando cliente pergunta status, IA consulta API e responde com dados reais.

**Acceptance Scenarios**:

1. **Given** o usuário configura um agente IA, **When** adiciona uma tool, **Then** define nome, descrição, parâmetros e webhook
2. **Given** agente tem tools, **When** IA decide usar uma tool, **Then** webhook é chamado e resultado incorporado na resposta
3. **Given** tool falha, **When** agente tenta usar, **Then** resposta de fallback é enviada

---

### Edge Cases

- O que acontece quando cliente envia áudio/imagem/documento?
  - **Assumido**: Bot de regras envia fallback pedindo texto; Agente IA pode processar (se configurado)
- O que acontece se cliente não responde em X minutos?
  - **Assumido**: Sessão expira após tempo configurável, próxima mensagem reinicia fluxo
- Como tratar múltiplas mensagens em sequência rápida?
  - **Assumido**: Sistema processa todas em ordem, responde a cada uma
- O que acontece se webhook da Meta falha?
  - **Assumido**: Retry automático com backoff exponencial (já implementado no SmartZap)
- Como tratar mensagens de grupos WhatsApp?
  - **Assumido**: Ignoradas na versão inicial (apenas 1:1)
- O que acontece fora da janela de 24h?
  - **Assumido**: Usa templates aprovados (funcionalidade já existente no SmartZap)

## Requirements *(mandatory)*

### Functional Requirements

**Integração WhatsApp Cloud API (Base - Meta Official v24.0)**
- **FR-001**: Sistema DEVE receber mensagens via webhook seguindo especificação Meta Cloud API v24.0
- **FR-002**: Sistema DEVE enviar mensagens de texto via endpoint POST /{phone_number_id}/messages
- **FR-003**: Sistema DEVE suportar Reply Buttons (type: "button") com máximo 3 botões por mensagem
- **FR-004**: Sistema DEVE suportar List Messages (type: "list") com máximo 10 items e 10 seções
- **FR-005**: Sistema DEVE processar webhooks de button_reply e list_reply corretamente
- **FR-006**: Sistema DEVE respeitar pair rate limit de 1 msg/6 segundos por destinatário
- **FR-007**: Sistema DEVE verificar Customer Service Window (24h) antes de enviar mensagens livres
- **FR-008**: Sistema DEVE usar templates aprovados para mensagens fora da CSW (já existente)
- **FR-009**: Sistema DEVE implementar retry com backoff exponencial (4^X segundos) para falhas

**Chatbot Baseado em Regras (Core - Estilo ManyChat)**
- **FR-010**: Usuários DEVEM poder criar bots com mensagem de boas-vindas
- **FR-011**: Usuários DEVEM poder definir menus de opções numéricas (1, 2, 3...)
- **FR-012**: Usuários DEVEM poder definir menus de opções por texto (MENU, AJUDA...)
- **FR-013**: Usuários DEVEM poder mapear palavras-chave para respostas (match parcial ou exato)
- **FR-014**: Sistema DEVE suportar fallback configurável para inputs não reconhecidos
- **FR-015**: Sistema DEVE suportar variáveis em mensagens ({{nome}}, {{telefone}}, customizadas)
- **FR-016**: Sistema DEVE permitir coletar input do usuário e salvar em variável
- **FR-017**: Sistema DEVE suportar timeout de sessão configurável
- **FR-018**: Sistema DEVE escolher automaticamente Reply Buttons (≤3) ou List (4-10) baseado na quantidade de opções

**Mensagens Interativas WhatsApp (Recursos Nativos Meta)**
- **FR-019**: Sistema DEVE respeitar limite de 20 caracteres para títulos de botões
- **FR-020**: Sistema DEVE respeitar limite de 24 caracteres para títulos de items de lista
- **FR-021**: Sistema DEVE respeitar limite de 72 caracteres para descrições de items
- **FR-022**: Sistema DEVE permitir header opcional (texto até 60 chars OU imagem/documento/vídeo)
- **FR-023**: Sistema DEVE permitir footer opcional (até 60 caracteres)
- **FR-024**: Sistema DEVE suportar CTA URL Button para direcionar a links externos (1 botão, 20 chars)

**Mensagens de Mídia (Media Messages - Suporte Completo)**
- **FR-052**: Sistema DEVE suportar envio de imagens (JPEG, PNG, máx 5MB) com caption opcional
- **FR-053**: Sistema DEVE suportar envio de vídeos (MP4/3GPP, H.264, máx 16MB) com caption opcional
- **FR-054**: Sistema DEVE suportar envio de documentos (PDF, DOC, etc., máx 100MB) com filename obrigatório
- **FR-055**: Sistema DEVE suportar envio de áudio (MP3, M4A, AAC, OGG, máx 16MB)
- **FR-056**: Sistema DEVE suportar envio de voice messages (OGG/OPUS, máx 512KB para ícone de play)
- **FR-057**: Sistema DEVE suportar envio de stickers (WebP apenas, estático 100KB, animado 500KB)
- **FR-058**: Sistema DEVE aceitar mídia por ID (já uploaded) ou por URL pública

**Mensagens de Localização (Location Messages)**
- **FR-059**: Sistema DEVE suportar envio de localização com latitude, longitude, nome e endereço
- **FR-060**: Sistema DEVE suportar bloco LOCATION_REQUEST para solicitar localização do usuário
- **FR-061**: Sistema DEVE processar webhook de location quando usuário compartilha localização

**Mensagens de Contato (Contacts Messages)**
- **FR-062**: Sistema DEVE suportar envio de cards de contato com nome, telefone, email, endereço
- **FR-063**: Sistema DEVE respeitar limite de 257 contatos por mensagem
- **FR-064**: Sistema DEVE incluir wa_id quando disponível para botões "Message" e "Save contact"

**Mensagens de Reação (Reaction Messages)**
- **FR-065**: Sistema DEVE suportar envio de reações (emojis) a mensagens específicas
- **FR-066**: Sistema DEVE suportar remoção de reação (emoji vazio)
- **FR-067**: Sistema DEVE processar reações recebidas do usuário via webhook

**Carrossel de Mídia (Media Carousel - NOVO Nov 2024)**
- **FR-068**: Sistema DEVE suportar envio de carrossel de mídia com 2-10 cards
- **FR-069**: Cada card DEVE ter header (imagem ou vídeo, todos iguais), body e botão CTA URL
- **FR-070**: Sistema DEVE validar que todos os cards têm mesmo tipo de header

**Carrossel de Produtos (Product Carousel - Requer Catálogo)**
- **FR-071**: Sistema PODE suportar carrossel de produtos se catálogo Meta estiver configurado
- **FR-072**: Cada card de produto DEVE referenciar product_retailer_id e catalog_id

**Respostas Contextuais (Contextual Replies)**
- **FR-073**: Sistema DEVE suportar responder a mensagem específica (context.message_id)
- **FR-074**: Sistema DEVE armazenar message_id de mensagens recebidas para permitir reply contextual
- **FR-075**: Sistema NÃO DEVE usar contextual reply com templates (bolha não aparece)
- **FR-076**: Sistema NÃO DEVE usar contextual reply com reactions (não permitido)

**Status e Indicadores (Read Receipts & Typing)**
- **FR-077**: Sistema DEVE suportar marcar mensagens como lidas (ticks azuis)
- **FR-078**: Sistema DEVE suportar typing indicators ("digitando...") por até 25 segundos
- **FR-079**: Sistema DEVE usar typing indicator antes de respostas que demoram (ex: IA)

**Editor Visual de Fluxos (React Flow Base)**
- **FR-025**: Sistema DEVE fornecer canvas drag-and-drop para edição de fluxos
- **FR-026**: Sistema DEVE suportar bloco START (início do fluxo, gatilho configurável)
- **FR-027**: Sistema DEVE suportar bloco MESSAGE (enviar texto com preview URL opcional)
- **FR-028**: Sistema DEVE suportar bloco MENU (opções com Reply Buttons ou List automaticamente)
- **FR-029**: Sistema DEVE suportar bloco INPUT (coletar resposta em variável)
- **FR-030**: Sistema DEVE suportar bloco CONDITION (if/else baseado em variáveis)
- **FR-031**: Sistema DEVE suportar bloco DELAY (aguardar tempo antes de continuar)
- **FR-032**: Sistema DEVE suportar bloco HANDOFF (transferir para humano, pausar bot)
- **FR-033**: Sistema DEVE suportar bloco END (fim do fluxo)
- **FR-034**: Sistema DEVE validar fluxos antes de salvar (sem loops infinitos, conexões válidas)
- **FR-035**: Sistema DEVE permitir modo de teste/simulação do fluxo sem enviar mensagens reais

**Blocos de Mídia no Editor Visual**
- **FR-080**: Sistema DEVE suportar bloco IMAGE (enviar imagem com caption opcional)
- **FR-081**: Sistema DEVE suportar bloco VIDEO (enviar vídeo com caption opcional)
- **FR-082**: Sistema DEVE suportar bloco DOCUMENT (enviar arquivo com nome obrigatório)
- **FR-083**: Sistema DEVE suportar bloco AUDIO (enviar áudio ou voice message)
- **FR-084**: Sistema DEVE suportar bloco STICKER (enviar sticker WebP)
- **FR-085**: Sistema DEVE suportar bloco LOCATION (enviar localização com nome/endereço)
- **FR-086**: Sistema DEVE suportar bloco LOCATION_REQUEST (solicitar localização)
- **FR-087**: Sistema DEVE suportar bloco CONTACT (enviar card de contato)
- **FR-088**: Sistema DEVE suportar bloco CAROUSEL (media carousel 2-10 cards com CTA)
- **FR-089**: Sistema DEVE suportar bloco CTA_URL (botão único para link externo)
- **FR-090**: Sistema DEVE suportar bloco REACTION (reagir a mensagem específica)

**Gestão de Conversas e Intervenção**
- **FR-036**: Sistema DEVE exibir lista de conversas ativas ordenadas por última mensagem
- **FR-037**: Sistema DEVE mostrar histórico completo de conversa selecionada
- **FR-038**: Sistema DEVE indicar origem de cada mensagem (bot/humano/cliente)
- **FR-039**: Sistema DEVE indicar status de entrega (sent/delivered/read/failed)
- **FR-040**: Sistema DEVE permitir operador assumir conversa (pausar bot)
- **FR-041**: Sistema DEVE permitir operador devolver conversa ao bot
- **FR-042**: Sistema DEVE notificar operador quando cliente solicita atendimento humano

**Agentes de IA (Extensão Opcional)**
- **FR-043**: Sistema DEVE suportar bloco AI_AGENT no editor de fluxos
- **FR-044**: Usuários DEVEM poder configurar prompt de sistema para agente
- **FR-045**: Usuários DEVEM poder escolher modelo de IA (configurável)
- **FR-046**: Sistema DEVE passar histórico de conversa como contexto para IA
- **FR-047**: Sistema DEVE permitir limite de tokens por resposta

**Ferramentas para Agentes IA (Tools)**
- **FR-048**: Usuários DEVEM poder definir tools com nome, descrição e schema JSON
- **FR-049**: Sistema DEVE executar webhook quando IA decide usar tool
- **FR-050**: Sistema DEVE incorporar resultado da tool na resposta da IA
- **FR-051**: Sistema DEVE registrar execuções de tools para auditoria

### Key Entities

- **Bot**: Chatbot configurado. Contém nome, número WhatsApp associado, status (ativo/inativo), fluxo associado
- **Flow**: Fluxo visual de conversa. Contém nome, nós (JSON), arestas (JSON), versão, status (rascunho/publicado)
- **FlowNode**: Bloco individual do fluxo. Tipos: START, MESSAGE, MENU, INPUT, CONDITION, DELAY, HANDOFF, AI_AGENT, END
- **Conversation**: Sessão de conversa. Contém contato, bot, estado atual do fluxo, variáveis coletadas, status (ativa/pausada/encerrada), operador (se assumida)
- **Message**: Mensagem individual. Contém conteúdo, tipo (text/interactive/template), origem (client/bot/operator), timestamp, status de entrega
- **ContactVariable**: Variável salva do contato. Contém contato, chave, valor, data de coleta
- **AIAgent**: Configuração de agente IA. Contém prompt de sistema, modelo, max_tokens, tools associadas
- **Tool**: Ferramenta para IA. Contém nome, descrição, schema de parâmetros, webhook URL
- **ToolExecution**: Log de execução de tool. Contém tool, conversa, input, output, duração, status

## Assumptions & Constraints

### Limitações Impostas pela API Meta

| Limitação | Impacto | Decisão de Design |
|-----------|---------|-------------------|
| Máximo 3 botões em Reply Buttons | Menus com mais opções não cabem | Sistema usa List Message automaticamente para 4+ opções |
| Máximo 10 items em List | Menus muito extensos impossíveis | Dividir em submenus hierárquicos |
| Header em List só aceita texto | Não pode usar imagem em menus extensos | Enviar imagem separada antes do menu |
| Pair rate: 1 msg/6s por usuário | Não pode enviar rajadas | Implementar queue com delay automático |
| CSW expira em 24h | Mensagens livres bloqueadas | Sistema verifica CSW antes de enviar, usa template se expirada |
| WhatsApp Flows requer aprovação | Formulários nativos não imediatos | Coletar dados via INPUT nodes como alternativa |
| Sem suporte a grupos | Apenas chat 1:1 | Ignorar mensagens de grupos na versão inicial |
| Sem edição de mensagens enviadas | Erros não corrigíveis | Validar conteúdo antes de enviar |
| Templates requerem aprovação | Delay para novos templates | Usar templates existentes do SmartZap |
| Vídeos só H.264 codec | H.265/HEVC não funcionam | Validar/converter vídeos antes de upload |
| Stickers só WebP | PNG/JPEG não funcionam | Converter para WebP antes de envio |
| Voice messages só OGG/OPUS | Outros formatos sem ícone de play | Usar formato correto para "voz gravada" |
| Contextual reply com template | Bolha de citação não aparece | Não usar reply em templates |
| Typing indicator max 25s | Desaparece automaticamente | Usar apenas quando for responder em seguida |
| Reaction só recebe sent | Sem delivered/read | Não aguardar confirmação de leitura |
| Address Messages só India | +91 apenas | Feature não disponível no Brasil |
| Media Carousel exige mesmo header | Todos cards image OU video | Validar consistência antes de envio |

### Decisões de Arquitetura

1. **Lógica de fluxo no backend**: A API Meta é apenas canal de comunicação. Toda lógica (condições, loops, branches) é executada no servidor SmartZap.

2. **Estado de conversa (Redis + Turso)**: Redis como cache hot para leitura/escrita rápida durante conversa ativa. Turso como source of truth, sincronizado a cada mudança de nó do fluxo. Se Redis não tem o estado, sistema recupera do Turso. Isso garante resiliência a reinícios/falhas sem perder progresso do cliente.

3. **Seleção automática de tipo de mensagem**: O sistema escolhe Reply Buttons ou List Message baseado na quantidade de opções, sem intervenção do usuário.

4. **Fallback de mídia**: Bot de regras responde com fallback para áudio/imagem/documento. Agente IA pode processar se configurado.

5. **Retry pattern**: Falhas de API usam backoff exponencial (4^X segundos) conforme recomendação Meta.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Usuários conseguem criar bot de regras funcional com menu em menos de 5 minutos
- **SC-002**: 95% das mensagens de bots de regras são respondidas em menos de 2 segundos
- **SC-003**: Botões interativos do WhatsApp funcionam em 100% dos dispositivos compatíveis
- **SC-004**: Usuários conseguem criar fluxo visual básico (5 blocos) em menos de 10 minutos
- **SC-005**: Taxa de mensagens não reconhecidas (fallback) menor que 15% após ajustes de keywords
- **SC-006**: Operadores conseguem assumir conversa em menos de 3 cliques
- **SC-007**: Sistema suporta 100 conversas simultâneas sem degradação
- **SC-008**: Mensagens de agentes IA são entregues em menos de 15 segundos
- **SC-009**: 80% dos fluxos criados passam na validação na primeira tentativa

---

## Clarifications

### Session 2025-12-03

- Q: Quando conversa está no meio de um fluxo e sistema reinicia, qual comportamento? → A: **Persistir estado no Turso** - Redis como cache hot, Turso como source of truth. Sync a cada mudança de nó. Recovery do Turso se Redis não tem estado. Conversa retoma do ponto onde parou.
