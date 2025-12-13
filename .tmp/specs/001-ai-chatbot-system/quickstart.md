# Quickstart: Sistema de Chatbot SmartZap

## Pré-requisitos

- Node.js 20+
- npm
- Conta WhatsApp Business configurada (com template aprovado)
- Variáveis de ambiente configuradas (veja `.env.example`)

---

## 1. Setup do Ambiente

```bash
# Clone e instale dependências
git clone <repo>
cd smartzapv2
npm install

# Variáveis de ambiente
cp .env.example .env.local
# Preencha: TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, UPSTASH_REDIS_*, QSTASH_*

# Rode as migrações
npm run db:migrate

# Inicie o servidor
npm run dev
```

---

## 2. Criando Seu Primeiro Bot

### Via Dashboard

1. Acesse `/bots`
2. Clique em **"Novo Bot"**
3. Preencha:
   - Nome: "Bot de Boas-Vindas"
   - Phone Number ID: (selecione seu número)
   - Palavras-chave de gatilho: `oi, olá, hello`
4. Clique em **"Criar"**

### Via API

```bash
curl -X POST http://localhost:3000/api/bots \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bot de Boas-Vindas",
    "phoneNumberId": "SEU_PHONE_ID",
    "triggerKeywords": ["oi", "olá", "hello"]
  }'
```

---

## 3. Criando um Flow no Editor Visual

### Via Dashboard

1. Acesse `/bots/SEU_BOT_ID/editor`
2. No painel esquerdo (Paleta de Nós), arraste os blocos para o canvas:
   - **Start Node**: Ponto de entrada (obrigatório)
   - **Message Node**: Configure com "Olá! Bem-vindo 👋"
   - **Input Node**: Configure para coletar variável `nome` com pergunta "Qual seu nome?"
   - **Message Node**: Configure com "Prazer, {{nome}}!"
   - **End Node**: Finaliza o fluxo
3. Conecte os nós arrastando das handles de saída para entrada
4. Use o painel direito (Inspetor) para configurar cada nó
5. Clique em **"Publicar"** para ativar o fluxo

### Via API

```bash
# Salvar flow como rascunho
curl -X PUT http://localhost:3000/api/bots/SEU_BOT_ID/flows \
  -H "Content-Type: application/json" \
  -d '{
    "nodes": [
      {
        "id": "start-1",
        "type": "start",
        "data": {},
        "position": { "x": 100, "y": 100 }
      },
      {
        "id": "message-1",
        "type": "message",
        "data": {
          "messageType": "text",
          "content": { "body": "Olá! Bem-vindo 👋" }
        },
        "position": { "x": 100, "y": 200 }
      },
      {
        "id": "input-1",
        "type": "input",
        "data": {
          "variableName": "nome",
          "prompt": { "body": "Qual seu nome?" },
          "validationType": "text"
        },
        "position": { "x": 100, "y": 300 }
      },
      {
        "id": "message-2",
        "type": "message",
        "data": {
          "messageType": "text",
          "content": { "body": "Prazer, {{nome}}!" }
        },
        "position": { "x": 100, "y": 400 }
      },
      {
        "id": "end-1",
        "type": "end",
        "data": {},
        "position": { "x": 100, "y": 500 }
      }
    ],
    "edges": [
      { "id": "e1", "source": "start-1", "target": "message-1" },
      { "id": "e2", "source": "message-1", "target": "input-1" },
      { "id": "e3", "source": "input-1", "target": "message-2" },
      { "id": "e4", "source": "message-2", "target": "end-1" }
    ]
  }'

# Publicar flow
curl -X POST http://localhost:3000/api/bots/SEU_BOT_ID/flows/publish
```

---

## 4. Testando o Bot

### Ngrok para Webhook Local

```bash
# Terminal 1
npm run dev

# Terminal 2
ngrok http 3000

# Configure a URL do ngrok no Meta Developer Console:
# https://xxx.ngrok.io/api/webhook
```

### Enviando Mensagem de Teste

Envie "oi" para seu número WhatsApp Business. O bot deve responder!

---

## 5. Monitorando Conversas

### Via Dashboard

- `/conversations` - Lista conversas com paginação e filtros
- Clique em uma conversa para ver o histórico de mensagens
- Use **"Assumir"** para takeover manual (pausa o bot)
- Use **"Devolver"** para retornar ao bot

### Via API

```bash
# Listar conversas (com paginação)
curl "http://localhost:3000/api/conversations?limit=20&offset=0"

# Filtrar por status
curl "http://localhost:3000/api/conversations?status=active"

# Ver detalhes de uma conversa
curl http://localhost:3000/api/conversations/CONV_ID

# Assumir conversa (takeover)
curl -X POST http://localhost:3000/api/conversations/CONV_ID/takeover

# Enviar mensagem manual
curl -X POST http://localhost:3000/api/conversations/CONV_ID/messages \
  -H "Content-Type: application/json" \
  -d '{"text": "Olá, sou um atendente humano!"}'

# Devolver para bot
curl -X POST http://localhost:3000/api/conversations/CONV_ID/release
```

---

## 6. Tipos de Nós Disponíveis

| Tipo | Descrição | Uso |
|------|-----------|-----|
| **start** | Ponto de entrada do fluxo | Obrigatório, único por fluxo |
| **message** | Envia mensagem de texto | Mensagens informativas |
| **menu** | Botões ou lista interativa | Navegação por opções |
| **input** | Coleta informação do usuário | Captura dados (nome, email, etc.) |
| **condition** | Ramifica baseado em condições | Lógica condicional |
| **delay** | Aguarda tempo antes de continuar | Pausas programadas |
| **handoff** | Transfere para atendente | Escalar para humano |
| **ai-agent** | Resposta inteligente via IA | Perguntas abertas, FAQ |
| **cta-url** | Botão com URL externa | Links e CTAs |
| **image** | Envia imagem | Catálogos, fotos |
| **video** | Envia vídeo | Tutoriais, demos |
| **document** | Envia PDF/documento | Contratos, manuais |
| **audio** | Envia áudio | Mensagens de voz |
| **location** | Envia localização | Endereços, mapas |
| **carousel** | Múltiplos cards com imagens | Produtos, serviços |
| **end** | Finaliza o fluxo | Encerramento |

---

## 7. Estrutura de Arquivos

```
app/
├── (dashboard)/
│   ├── bots/              # Gestão de bots
│   │   ├── page.tsx       # Lista de bots
│   │   └── [id]/
│   │       ├── page.tsx   # Detalhes do bot
│   │       └── editor/
│   │           └── page.tsx  # Editor visual de flows
│   └── conversations/     # Inbox de conversas
│       └── page.tsx
├── api/
│   ├── bots/              # CRUD de bots
│   ├── conversations/     # API de conversas
│   ├── ai-agents/         # Configuração de agentes IA
│   └── webhook/           # Webhook Meta + Engine
│       ├── route.ts       # Recebe mensagens
│       ├── engine/        # Executa fluxos via QStash
│       └── schedule/      # Callbacks de delay
hooks/
├── useBots.ts             # Controller de bots
├── useFlowEditor.ts       # Estado do editor React Flow
├── useConversations.ts    # Controller de conversas (com paginação)
└── useAIAgents.ts         # Controller de agentes IA
lib/
├── flow-engine/           # Core do motor de fluxos
│   ├── executor.ts        # Execução de nós
│   ├── state.ts           # Gerenciamento de estado (Redis + Turso)
│   ├── variables.ts       # Substituição de {{variáveis}}
│   └── nodes/             # Handlers de cada tipo de nó
├── whatsapp/              # Builders de mensagens WhatsApp
│   ├── text.ts            # Mensagens de texto
│   ├── interactive.ts     # Botões e listas
│   ├── media.ts           # Imagens, vídeos, documentos
│   └── status.ts          # Typing indicator, mark as read
└── turso-db.ts            # Operações de banco de dados
```

---

## 8. Configurando Agentes de IA

### Criando um Agente

1. Via API:
```bash
curl -X POST http://localhost:3000/api/ai-agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Assistente de Vendas",
    "model": "gemini-1.5-flash",
    "systemPrompt": "Você é um assistente de vendas amigável. Responda de forma concisa.",
    "maxTokens": 500,
    "temperature": 0.7
  }'
```

2. No Editor Visual:
   - Arraste um **AI Agent Node** para o canvas
   - No Inspetor, selecione o agente criado
   - Configure condições de saída (ex: "encerrar", "falar com humano")

### Adicionando Tools ao Agente

```bash
curl -X POST http://localhost:3000/api/ai-agents/AGENT_ID/tools \
  -H "Content-Type: application/json" \
  -d '{
    "name": "consultar_estoque",
    "description": "Consulta o estoque de um produto",
    "webhookUrl": "https://sua-api.com/estoque",
    "method": "GET",
    "parameters": {
      "type": "object",
      "properties": {
        "produto_id": { "type": "string", "description": "ID do produto" }
      },
      "required": ["produto_id"]
    }
  }'
```

---

## 9. Troubleshooting

| Problema | Solução |
|----------|---------|
| Bot não responde | Verifique webhook no Meta Console e logs em `/api/debug/trace` |
| Erro 131056 | Aguarde 6s entre mensagens para mesmo contato (pair rate) |
| Erro 470 | Janela CSW expirada (24h), use template para reiniciar |
| Variável não substitui | Verifique sintaxe `{{variavel}}` e se o Input Node salvou |
| IA não responde | Verifique `GEMINI_API_KEY` e modelo configurado |
| Delay não funciona | Verifique `QSTASH_TOKEN` e configuração do QStash |

---

## 10. Links Úteis

- [Meta WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [React Flow Docs](https://reactflow.dev)
- [Turso Docs](https://docs.turso.tech)
- [Upstash QStash Docs](https://upstash.com/docs/qstash)
- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
