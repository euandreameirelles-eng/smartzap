# 🏗️ SmartZap - Auditoria de Arquitetura Completa

**Data:** 30 de novembro de 2025  
**Arquiteto:** GitHub Copilot (Claude Opus 4.5)  
**Stack:** React 19 + Next.js 15 + Turso + Upstash Redis + QStash

---

## 📊 Resumo Executivo

| Categoria | Crítico | Alto | Médio | Baixo | OK |
|-----------|---------|------|-------|-------|-----|
| Estrutura de Pastas | 0 | 1 | 2 | 1 | 3 |
| Padrão Arquitetural | 0 | 1 | 1 | 1 | 4 |
| Backend Architecture | 1 | 2 | 2 | 0 | 2 |
| Database Design | 0 | 1 | 2 | 1 | 2 |
| State Management | 0 | 0 | 1 | 1 | 3 |
| Performance | 0 | 1 | 2 | 1 | 2 |
| Escalabilidade | 0 | 2 | 1 | 0 | 2 |
| Integrações | 0 | 0 | 1 | 1 | 3 |
| Resiliência | 0 | 1 | 2 | 0 | 2 |
| Dependências | 0 | 0 | 1 | 2 | 3 |
| **TOTAL** | **1** | **9** | **15** | **8** | **26** |

---

## 1. 📁 Estrutura de Pastas

### ✅ OK: Organização Geral Sólida

```
smartzapv2/
├── app/                    # Next.js 15 App Router ✅
│   ├── (auth)/             # Route groups corretos
│   ├── (dashboard)/        # Layout compartilhado
│   └── api/                # API routes
├── components/
│   ├── features/           # Feature-based ✅
│   └── ui/                 # Reusáveis
├── hooks/                  # Custom hooks centralizados ✅
├── lib/                    # Utilitários internos ✅
├── services/               # API layer ✅
└── types.ts                # Types centralizados ✅
```

### ✅ OK: Route Groups

Uso correto de `(auth)` e `(dashboard)` para layouts distintos.

### ✅ OK: Feature-based Components

```
components/features/
├── campaigns/              # CampaignListView, CampaignDetailsView, etc.
├── contacts/
├── dashboard/
├── settings/
└── templates/
```

### 🟡 MÉDIO: `lib/` Está Inchado

```
lib/
├── auth.ts                 # ← Autenticação
├── turso.ts                # ← Database
├── turso-db.ts             # ← Database (duplicado?)
├── redis.ts                # ← Cache
├── realtime.ts             # ← Websockets
├── whatsapp-credentials.ts # ← Integração
├── whatsapp-pricing.ts     # ← Integração
├── vercel-api.ts           # ← Integração
├── phone-formatter.ts      # ← Util
├── csv-parser.ts           # ← Util
├── rate-limiter.ts         # ← Util
├── errors.ts               # ← Util
├── logger.ts               # ← Util
├── api-validation.ts       # ← Util
└── ... (22 arquivos)
```

**Recomendação:** Subdividir em:
```
lib/
├── db/                     # turso.ts, turso-db.ts, redis.ts
├── integrations/           # whatsapp-*.ts, vercel-api.ts
├── utils/                  # phone-formatter, csv-parser, etc.
└── core/                   # auth, errors, logger
```

### 🟡 MÉDIO: Duplicação `services/*.ts` vs `lib/turso-db.ts`

Existem dois arquivos de serviço para campaigns:
- `services/campaignService.ts` - Calls `/api/campaigns`
- `services/campaignService.turso.ts` - Parece deprecated

E a lógica de DB está em `lib/turso-db.ts` (usado nas API routes).

**Problema:** Três camadas para a mesma coisa.

**Recomendação:**
```
Frontend → services/campaignService.ts → /api/campaigns → lib/turso-db.ts
                     ↑ único!                                ↑ único!
```
Remover `campaignService.turso.ts`.

### 🟠 ALTO: Onde Colocar Novos Recursos?

Não está claro onde adicionar:
- Jobs de background? (workflows já estão em `/api/campaign/workflow`)
- Filas? (não existe `/queues`)
- Schedulers? (não existe `/cron`)

**Recomendação:** Documentar em ARCHITECTURE.md ou criar:
```
app/
├── api/
│   ├── _jobs/              # Background jobs (QStash workflows)
│   └── _cron/              # Scheduled tasks
```

### 🟢 BAIXO: Componentes Órfãos

`components/UsagePanel.tsx` está fora de `features/`. Deveria estar em `features/dashboard/` ou `features/billing/`.

---

## 2. 🎯 Padrão Arquitetural (Page → Hook → Service → Storage)

### Fluxo Atual

```
┌──────────────────────────────────────────────────────────────────┐
│                          FRONTEND                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   Page (thin)                                                     │
│   app/(dashboard)/campaigns/page.tsx                              │
│        │                                                          │
│        ▼                                                          │
│   Controller Hook                                                 │
│   hooks/useCampaigns.ts                                           │
│   - UI state (filter, search)                                     │
│   - Business logic (filtering)                                    │
│   - Mutations (optimistic updates)                                │
│        │                                                          │
│        ▼                                                          │
│   Service Layer                                                   │
│   services/campaignService.ts                                     │
│   - fetch() calls to /api/*                                       │
│        │                                                          │
└────────│─────────────────────────────────────────────────────────┘
         │
         ▼ HTTP
┌──────────────────────────────────────────────────────────────────┐
│                          BACKEND                                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   API Route                                                       │
│   app/api/campaigns/route.ts                                      │
│        │                                                          │
│        ▼                                                          │
│   DB Layer                                                        │
│   lib/turso-db.ts (campaignDb)                                    │
│        │                                                          │
│        ▼                                                          │
│   Turso (SQLite)                                                  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### ✅ OK: Pages São Thin

```tsx
// app/(dashboard)/campaigns/page.tsx ✅
export default function CampaignsPage() {
  const controller = useCampaignsController()  // Hook faz tudo
  return <CampaignListView {...controller} />  // View recebe props
}
```

### ✅ OK: Controller Hook Pattern

```typescript
// hooks/useCampaigns.ts ✅
export const useCampaignsController = () => {
  const { data } = useCampaignsQuery()           // React Query
  const [filter, setFilter] = useState('All')    // UI state
  const filteredCampaigns = useMemo(() => ...)   // Derived state
  return { campaigns, filter, setFilter, ... }   // Controller API
}
```

### ✅ OK: Components São Presentational

```tsx
// components/features/campaigns/CampaignListView.tsx ✅
interface Props {
  campaigns: Campaign[]
  onDelete: (id: string) => void  // Events as callbacks
  onRowClick: (id: string) => void
}
// Zero lógica de negócio, apenas renderização
```

### ✅ OK: Service Layer Abstrai API

```typescript
// services/campaignService.ts ✅
export const campaignService = {
  getAll: () => fetch('/api/campaigns').then(r => r.json()),
  create: (input) => fetch('/api/campaigns', { method: 'POST', ... }),
  // Abstração clara sobre HTTP
}
```

### 🟠 ALTO: lib/storage.ts é Legacy (localStorage)

O arquivo `lib/storage.ts` ainda existe com lógica de localStorage:

```typescript
// lib/storage.ts ⚠️
export const storage = {
  campaigns: {
    getAll: () => get<Campaign[]>(KEYS.CAMPAIGNS, []),  // localStorage!
    add: (campaign) => { ... set(KEYS.CAMPAIGNS, ...) },
  }
}
```

**Problema:** Este arquivo não deveria mais ser usado. O Turso é a source of truth.

**Status:** Parece ser código legado, mas ainda está no projeto e pode causar confusão.

**Recomendação:** 
1. Verificar se ainda é usado em algum lugar
2. Se não, remover completamente
3. Se sim, migrar para usar services

### 🟡 MÉDIO: Services Duplicados

```
services/
├── campaignService.ts        # Usa /api (correto)
├── campaignService.turso.ts  # Também usa /api (redundante?)
├── contactService.ts         # Usa /api
├── contactService.turso.ts   # Outro duplicado
```

**Recomendação:** Manter apenas os `.ts` sem sufixo turso.

### 🟢 BAIXO: Hook `useCampaigns` Poderia Ser Split

O `useCampaigns.ts` tem:
- `useCampaignsQuery` (data fetching)
- `useCampaignMutations` (mutations)
- `useCampaignsController` (combines both + UI state)

Isso está bom, mas `useCampaignMutations` poderia ser reusado em outros contextos.

---

## 3. 🖥️ Backend Architecture

### Arquitetura Atual

```
┌─────────────────────────────────────────────────────────────────────┐
│                        API LAYER                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   /api/campaigns/route.ts          GET, POST                         │
│   /api/campaigns/[id]/route.ts     GET, PATCH, DELETE                │
│   /api/campaign/dispatch/route.ts  POST → triggers QStash           │
│   /api/campaign/workflow/route.ts  QStash workflow (sends messages)  │
│   /api/webhook/route.ts            Meta webhooks                     │
│                                                                      │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   lib/turso-db.ts              CRUD operations (campaignDb, etc.)   │
│   lib/turso.ts                 Raw client + schema init             │
│   lib/redis.ts                 Cache + message mappings              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 🔴 CRÍTICO: Lógica de Negócio nas API Routes

```typescript
// app/api/campaign/dispatch/route.ts ⚠️
export async function POST(request: NextRequest) {
  // ... 80+ linhas de lógica
  // - Busca contatos do DB
  // - Valida credenciais (3 fallbacks!)
  // - Salva contatos no DB
  // - Trigga workflow
}
```

```typescript
// app/api/webhook/route.ts ⚠️
export async function POST(request: NextRequest) {
  // ... 150+ linhas de lógica
  // - Parsing de webhooks
  // - Deduplicação
  // - Update de stats
  // - Emit realtime
}
```

**Problema:** API routes devem ser thin. Lógica de negócio deveria estar em:
- `lib/services/` ou
- `lib/use-cases/` ou  
- `lib/handlers/`

**Recomendação:**
```typescript
// app/api/webhook/route.ts (thin)
export async function POST(request: NextRequest) {
  const body = await request.json()
  return handleWebhookEvent(body)  // ← toda lógica em lib/
}

// lib/handlers/webhook-handler.ts (business logic)
export async function handleWebhookEvent(body: WebhookPayload) {
  // 150 linhas aqui
}
```

### 🟠 ALTO: Falta Camada de Use Cases

Não existe uma camada de use cases separada. A lógica está espalhada entre:
- API routes (dispatch, webhook)
- turso-db.ts (CRUD)
- workflow/route.ts (sending)

**Arquitetura Sugerida:**
```
lib/
├── use-cases/
│   ├── dispatch-campaign.ts     # Orquestra dispatch
│   ├── process-webhook.ts       # Processa webhooks
│   ├── sync-templates.ts        # Sincroniza templates
│   └── create-campaign.ts       # Cria + valida
├── repositories/                 # Abstração sobre Turso
│   ├── campaign.repository.ts
│   └── contact.repository.ts
└── services/                     # Serviços externos
    ├── whatsapp.service.ts
    └── qstash.service.ts
```

### 🟠 ALTO: API Routes Inconsistentes

```
/api/campaigns/           # CRUD campanhas
/api/campaigns/[id]/      # Campanha específica
/api/campaign/dispatch/   # ← singular! deveria ser /campaigns/{id}/dispatch
/api/campaign/workflow/   # ← deveria ser /campaigns/workflow ou interno
/api/campaign/[id]/       # ← duplicado com /campaigns/[id]??
```

**Recomendação:** Padronizar para RESTful:
```
/api/campaigns            GET, POST
/api/campaigns/{id}       GET, PATCH, DELETE
/api/campaigns/{id}/dispatch  POST (start campaign)
/api/campaigns/{id}/pause     POST
/api/campaigns/{id}/resume    POST
/api/internal/workflow        POST (QStash only)
```

### 🟡 MÉDIO: Validação Inconsistente

Algumas routes usam Zod:
```typescript
// /api/campaigns/route.ts ✅
const validation = validateBody(CreateCampaignSchema, body)
```

Outras não:
```typescript
// /api/campaign/dispatch/route.ts ⚠️
const { campaignId, templateName } = body  // sem validação!
```

**Recomendação:** Criar middleware de validação ou usar Zod em todas as routes.

### 🟡 MÉDIO: Error Handling Inconsistente

```typescript
// Alguns lugares:
return NextResponse.json({ error: 'Mensagem' }, { status: 500 })

// Outros:
throw new Error('Mensagem')  // não tratado

// lib/errors.ts existe mas não é usado nas API routes!
```

### ✅ OK: Middleware de Autenticação

O `middleware.ts` está bem estruturado:
- Verifica session cookie para pages
- Verifica API key para API routes
- Endpoints públicos definidos
- Admin endpoints protegidos

### ✅ OK: Separação Auth/Public/Admin

```typescript
const PUBLIC_PAGES = ['/login', '/setup']
const PUBLIC_API_ROUTES = ['/api/auth', '/api/webhook', '/api/health', ...]
const ADMIN_ENDPOINTS = ['/api/database/init', ...]
```

---

## 4. 🗄️ Database Design

### Schema Atual (Turso/SQLite)

```sql
-- campaigns
CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Rascunho',
  template_name TEXT,
  template_id TEXT,
  scheduled_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT,
  started_at TEXT,
  completed_at TEXT,
  total_recipients INTEGER DEFAULT 0,
  sent INTEGER DEFAULT 0,
  delivered INTEGER DEFAULT 0,
  read INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0
);

-- contacts
CREATE TABLE contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  status TEXT DEFAULT 'Opt-in',
  tags TEXT,  -- JSON string
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

-- campaign_contacts (junction)
CREATE TABLE campaign_contacts (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  contact_id TEXT,
  phone TEXT NOT NULL,
  name TEXT,
  status TEXT DEFAULT 'pending',
  message_id TEXT,
  sent_at TEXT,
  delivered_at TEXT,
  read_at TEXT,
  error TEXT,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  UNIQUE(campaign_id, phone)
);

-- templates (cache)
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  language TEXT DEFAULT 'pt_BR',
  status TEXT,
  components TEXT,  -- JSON
  created_at TEXT NOT NULL,
  updated_at TEXT
);

-- settings (key-value)
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT
);

-- Índices
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_campaign_contacts_campaign ON campaign_contacts(campaign_id);
CREATE INDEX idx_campaign_contacts_status ON campaign_contacts(status);
```

### ✅ OK: Índices Essenciais Existem

- `idx_campaigns_status` - Para filtrar por status
- `idx_contacts_phone` - Para lookup de telefone
- `idx_campaign_contacts_campaign` - Para JOIN
- `idx_campaign_contacts_status` - Para filtrar mensagens por status

### ✅ OK: Cascade Delete

`ON DELETE CASCADE` em campaign_contacts garante limpeza.

### 🟠 ALTO: Falta Multi-tenant

**Problema:** Não existe `user_id` ou `organization_id` nas tabelas.

```sql
-- Atual:
SELECT * FROM campaigns  -- retorna TODAS as campanhas

-- Deveria ser:
SELECT * FROM campaigns WHERE organization_id = ?
```

**Impacto:** Impossível ter múltiplos clientes usando o mesmo banco.

**Recomendação:** Adicionar coluna `organization_id` ou usar database per tenant (Turso suporta).

### 🟡 MÉDIO: `tags` Como JSON String

```sql
tags TEXT,  -- JSON string como '["vip", "cliente"]'
```

**Problema:** Não é possível fazer queries como:
```sql
SELECT * FROM contacts WHERE tags CONTAINS 'vip'  -- não funciona
```

**Alternativas:**
1. Tabela separada `contact_tags(contact_id, tag)`
2. Usar JSON functions do SQLite (limitado)
3. Aceitar a limitação (ok para MVP)

### 🟡 MÉDIO: Timestamps Como TEXT

```sql
created_at TEXT NOT NULL,
scheduled_date TEXT,
```

**Problema:** SQLite não tem tipo DATE nativo, mas TEXT é menos eficiente para ordenação/comparação.

**Impacto:** Queries de range podem ser mais lentas.

**Recomendação:** Aceitar (comum em SQLite) ou usar INTEGER (Unix timestamp).

### 🟢 BAIXO: Falta Índice em `created_at`

Para `ORDER BY created_at DESC` frequente:
```sql
CREATE INDEX idx_campaigns_created ON campaigns(created_at DESC);
CREATE INDEX idx_contacts_created ON contacts(created_at DESC);
```

---

## 5. 📦 State Management

### Configuração React Query

```typescript
// app/providers.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,        // 1 minuto
      refetchOnWindowFocus: false,  // Desativado
    },
  },
})
```

### ✅ OK: StaleTime Razoável

1 minuto é adequado para dados que mudam moderadamente.

### ✅ OK: RefetchOnWindowFocus Desativado

Evita requests desnecessários para SaaS.

### ✅ OK: Optimistic Updates Implementados

```typescript
// hooks/useCampaigns.ts
const deleteMutation = useMutation({
  onMutate: async (id) => {
    await queryClient.cancelQueries(['campaigns'])
    const previousData = queryClient.getQueryData(['campaigns'])
    queryClient.setQueryData(['campaigns'], old => 
      old?.filter(c => c.id !== id)
    )
    return { previousData }
  },
  onError: (_, __, context) => {
    queryClient.setQueryData(['campaigns'], context.previousData)  // Rollback
  },
})
```

### 🟡 MÉDIO: Cache Keys Não Padronizadas

```typescript
// Exemplos encontrados:
['campaigns']
['campaign', id]
['contacts']
['templates']
['dashboard']
['settings']
```

**Recomendação:** Criar factory de keys:
```typescript
export const queryKeys = {
  campaigns: {
    all: ['campaigns'] as const,
    detail: (id: string) => ['campaigns', id] as const,
    messages: (id: string) => ['campaigns', id, 'messages'] as const,
  },
  contacts: {
    all: ['contacts'] as const,
    // ...
  },
}
```

### 🟢 BAIXO: Falta Garbage Collection Config

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 5 * 60 * 1000,  // 5 min (era cacheTime)
    },
  },
})
```

### ✅ OK: Realtime Integration

```typescript
<RealtimeProvider api={{ url: '/api/realtime' }}>
  {children}
</RealtimeProvider>
```

Upstash Realtime está integrado para updates de status.

---

## 6. ⚡ Performance

### 🟠 ALTO: Possíveis N+1 Queries

```typescript
// lib/turso-db.ts - campaignDb.duplicate()
const existingContacts = await turso.execute({
  sql: 'SELECT ... FROM campaign_contacts WHERE campaign_id = ?',
  args: [id]
})

for (const row of existingContacts.rows) {
  await turso.execute({  // ⚠️ N queries!
    sql: 'INSERT INTO campaign_contacts ...',
    args: [...]
  })
}
```

**Solução:** Usar batch insert:
```typescript
await turso.batch(
  contacts.map(c => ({
    sql: 'INSERT INTO campaign_contacts ...',
    args: [...]
  })),
  'write'
)
```

### 🟡 MÉDIO: Sem Lazy Loading de Rotas

Next.js 15 já faz code splitting automático por página, mas componentes pesados não estão lazy:

```typescript
// Poderia usar:
const CampaignWizardView = dynamic(
  () => import('@/components/features/campaigns/CampaignWizardView'),
  { loading: () => <Spinner /> }
)
```

### 🟡 MÉDIO: Bundle Size - Recharts

```json
"recharts": "^3.5.0"  // ~500KB minified
```

**Alternativa:** Usar chart library menor ou importar apenas módulos necessários.

### 🟢 BAIXO: Sem Prefetch de Links

```tsx
// Poderia prefetch campanhas ao hover no nav:
<Link href="/campaigns" prefetch={true}>
```

O componente `PrefetchLink.tsx` existe mas não vi uso.

### ✅ OK: Cache Headers Nas API Routes

```typescript
return NextResponse.json(campaigns, {
  headers: {
    'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30'
  }
})
```

### ✅ OK: Next.js 15 + Turbopack

Turbopack no dev mode para builds rápidos.

---

## 7. 📈 Escalabilidade

### Arquitetura de Filas

```
┌─────────────────┐    ┌───────────────┐    ┌──────────────────┐
│   Frontend      │───▶│  API Route    │───▶│     QStash       │
│  (dispatch)     │    │  /dispatch    │    │  (durável)       │
└─────────────────┘    └───────────────┘    └────────┬─────────┘
                                                      │
                                                      ▼
                                            ┌──────────────────┐
                                            │   Workflow       │
                                            │  /workflow       │
                                            │  (batches de 40) │
                                            └────────┬─────────┘
                                                      │
                                                      ▼
                                            ┌──────────────────┐
                                            │  WhatsApp API    │
                                            │  (Meta Cloud)    │
                                            └──────────────────┘
```

### ✅ OK: QStash Para Background Jobs

- Batches de 40 contatos
- Retries automáticos (3x)
- Bypassa timeout do Vercel (10s)

### ✅ OK: Upstash Redis Para Cache/Mappings

- Message ID → Campaign mapping
- Webhook deduplication
- Credentials cache

### 🟠 ALTO: Single Point of Failure - Redis

```typescript
// lib/redis.ts
if (!REDIS_URL || !REDIS_TOKEN) {
  return null  // ⚠️ Sistema continua sem Redis, mas perde funcionalidades
}
```

**Problema:** Se Redis falha:
- Webhooks não atualizam stats
- Message mappings perdidos
- Credentials não resolvem

**Recomendação:** 
1. Fallback para Turso em cenários críticos
2. Health check que alerta sobre Redis down

### 🟠 ALTO: Sem Rate Limiting Global

O `TokenBucketRateLimiter` existe mas não é usado nas API routes:

```typescript
// lib/rate-limiter.ts existe mas...
// middleware.ts não aplica rate limiting
```

**Risco:** Um cliente pode fazer milhares de requests e derrubar o sistema.

**Recomendação:** Usar Upstash Ratelimit:
```typescript
import { Ratelimit } from "@upstash/ratelimit"

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
})
```

### 🟡 MÉDIO: Workflows Não São Pausáveis de Verdade

```typescript
// workflow/route.ts
const isPaused = await redis.get(`campaign:${campaignId}:paused`)
if (isPaused === 'true') {
  console.log('⏸️ Campaign is paused, skipping remaining')
  break  // ⚠️ Só pula o batch atual, próximo step já está scheduled
}
```

**Problema:** Uma vez que workflow inicia, steps já estão enfileirados no QStash.

**Recomendação:** Usar QStash's job cancellation ou redesenhar para polling.

---

## 8. 🔌 Integrações

### WhatsApp API

```typescript
// lib/whatsapp-credentials.ts ✅
export async function getWhatsAppCredentials(): Promise<WhatsAppCredentials | null> {
  // 1. Try Redis first (user-configured)
  // 2. Fallback to env vars
}
```

**Abstração boa:** Credenciais centralizadas com fallback.

### Vercel API

```typescript
// lib/vercel-api.ts ✅
export async function findProjectByDomain(token, domain)
export async function upsertEnvVar(token, projectId, envVar)
export async function redeployLatest(token, projectId)
```

**Abstração boa:** Funções claras e bem tipadas.

### ✅ OK: Acoplamento Frouxo

Integrações estão em arquivos separados:
- `lib/whatsapp-credentials.ts`
- `lib/whatsapp-pricing.ts`
- `lib/vercel-api.ts`

### 🟡 MÉDIO: Sem Interface/Abstração WhatsApp

```typescript
// Chamadas diretas ao fetch:
const response = await fetch(
  `https://graph.facebook.com/v24.0/${phoneNumberId}/messages`,
  { ... }
)
```

**Recomendação:** Criar `WhatsAppClient` class:
```typescript
class WhatsAppClient {
  constructor(private credentials: WhatsAppCredentials) {}
  
  async sendTemplate(to: string, template: string, params: any[]) { ... }
  async getTemplates() { ... }
}
```

### 🟢 BAIXO: Versão API Hardcoded

```typescript
`https://graph.facebook.com/v24.0/${phoneNumberId}/messages`
//                          ^^^^^^ hardcoded
```

**Recomendação:** Configurar via env var ou constante centralizada.

### ✅ OK: Error Classification

`lib/errors.ts` classifica erros do WhatsApp:
```typescript
export function classifyWhatsAppError(error): ErrorType {
  if (err.error?.code === 190) return ErrorType.AUTHENTICATION_ERROR
  if (err.error?.code === 4) return ErrorType.RATE_LIMIT_ERROR
  // ...
}
```

---

## 9. 🛡️ Resiliência

### 🟠 ALTO: Retry Logic Existe Mas Não É Usada

```typescript
// lib/errors.ts
export function isRetryableError(error: AppError): boolean { ... }
export function getRetryDelay(attemptNumber: number): number { ... }
```

Mas nas API routes:
```typescript
// app/api/campaign/workflow/route.ts
const response = await fetch(...)  // ⚠️ Sem retry!
if (!response.ok) {
  // Marca como failed, não tenta novamente
}
```

**O QStash tem retry (3x)**, mas isso re-executa o step inteiro, não mensagens individuais.

### 🟡 MÉDIO: Sem Circuit Breaker

Se a Meta API está fora:
```typescript
for (const contact of batch) {
  await fetch(whatsappApi)  // ⚠️ Continua tentando mesmo se API está down
}
```

**Recomendação:**
```typescript
const breaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 30000,
})

await breaker.execute(() => fetch(whatsappApi))
```

### 🟡 MÉDIO: Webhook Deduplication Funciona

```typescript
const dedupeKey = `webhook:processed:${messageId}:${msgStatus}`
const alreadyProcessed = await redis.get(dedupeKey)
if (alreadyProcessed) continue
await redis.set(dedupeKey, '1', { ex: 7 * 24 * 60 * 60 })
```

**Mas:** Se Redis está down, dedup não funciona.

### ✅ OK: Graceful Degradation em Redis

```typescript
export const redis = {
  get: (...args) => getRedis()?.get(...args) ?? Promise.resolve(null),
  // Retorna null em vez de throw se Redis não disponível
}
```

### ✅ OK: QStash Retries

```typescript
export const { POST } = serve<CampaignWorkflowInput>(..., {
  retries: 3,  // ✅
})
```

---

## 10. 📦 Dependências

### package.json Analysis

```json
{
  "dependencies": {
    "@google/genai": "^1.30.0",           // AI generation
    "@libsql/client": "^0.15.15",         // Turso
    "@tailwindcss/postcss": "^4.1.17",    // Styling
    "@tanstack/react-query": "^5.0.0",    // State
    "@upstash/realtime": "^1.0.0",        // Realtime
    "@upstash/redis": "^1.34.3",          // Cache
    "@upstash/workflow": "^0.2.22",       // Background jobs
    "babel-plugin-react-compiler": "^1.0.0", // React 19
    "bcryptjs": "^3.0.3",                 // Auth
    "clsx": "^2.1.0",                     // Classnames
    "libphonenumber-js": "^1.12.29",      // Phone validation
    "lucide-react": "^0.554.0",           // Icons
    "next": "^16.0.5",                    // Framework
    "papaparse": "^5.5.3",                // CSV parsing
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "recharts": "^3.5.0",                 // Charts
    "sonner": "^2.0.7",                   // Toasts
    "zod": "^4.1.13"                      // Validation
  },
  "devDependencies": {
    "@playwright/test": "^1.49.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.0.1",
    // ... outras dev deps
  }
}
```

### ✅ OK: Stack Moderna e Consistente

- React 19 + Next.js 16 (canary/latest)
- Upstash ecosystem (Redis, QStash, Realtime)
- Turso para persistence
- Zod para validation

### ✅ OK: Deps de Produção Mínimas

13 dependências principais - não está inchado.

### ✅ OK: Testing Setup

Playwright + Vitest + Testing Library - cobertura completa.

### 🟡 MÉDIO: Recharts Pesado

```json
"recharts": "^3.5.0"  // ~500KB
```

**Alternativa mais leve:** `@nivo/line` ou `chart.js` (se precisar)

### 🟢 BAIXO: babel-plugin-react-compiler

```json
"babel-plugin-react-compiler": "^1.0.0"
```

React Compiler ainda é experimental. Monitorar breaking changes.

### 🟢 BAIXO: Versões ^major

```json
"next": "^16.0.5"  // Pode pegar 17.x.x automaticamente
```

**Recomendação:** Pin major versions:
```json
"next": "~16.0.5"  // Apenas patches
```

---

## 📐 Diagramas de Arquitetura

### Fluxo de Criação de Campanha

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│   1. User clicks "Create Campaign"                                        │
│        ↓                                                                  │
│   CampaignWizard (View)                                                   │
│        ↓                                                                  │
│   useCampaignWizard (Hook)                                                │
│        ↓                                                                  │
│   campaignService.create({name, template, contacts})                      │
│        ↓                                                                  │
│   POST /api/campaigns                                                     │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│   2. /api/campaigns (POST)                                                │
│        ↓                                                                  │
│   campaignDb.create() → Turso (INSERT campaign)                           │
│   campaignContactDb.addContacts() → Turso (INSERT contacts)               │
│        ↓                                                                  │
│   Return campaign {id, status: 'Enviando'}                                │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                           DISPATCH FLOW                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│   3. campaignService.dispatchToBackend()                                  │
│        ↓                                                                  │
│   POST /api/campaign/dispatch                                             │
│        ↓                                                                  │
│   QStash.trigger({url: '/api/campaign/workflow', body: {...}})            │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                           QSTASH WORKFLOW                                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│   4. /api/campaign/workflow (Upstash Workflow)                            │
│                                                                           │
│   Step 1: init-campaign                                                   │
│        → Update status = 'Enviando' in Turso                              │
│                                                                           │
│   Step 2-N: send-batch-{n}                                                │
│        → For each contact in batch (40):                                  │
│            → POST graph.facebook.com/.../messages                         │
│            → Store messageId → campaignId in Redis                        │
│            → Update campaign_contacts.status in Turso                     │
│                                                                           │
│   Step Final: complete-campaign                                           │
│        → Update status = 'Concluído' in Turso                             │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                           WEBHOOK FLOW                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│   5. Meta sends webhook to /api/webhook                                   │
│        ↓                                                                  │
│   Lookup messageId in Redis → get campaignId, phone                       │
│        ↓                                                                  │
│   Update Turso:                                                           │
│        - campaign_contacts.status = 'delivered'/'read'                    │
│        - campaigns.delivered/read++                                       │
│        ↓                                                                  │
│   emitCampaignStats() → Upstash Realtime → Frontend                       │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### Camadas de Dados

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TURSO (Source of Truth)                          │
│                                                                          │
│   campaigns              contacts              campaign_contacts          │
│   ├─ id                  ├─ id                 ├─ id                      │
│   ├─ name                ├─ name               ├─ campaign_id (FK)        │
│   ├─ status              ├─ phone (UNIQUE)     ├─ phone                   │
│   ├─ template_name       ├─ status             ├─ status                  │
│   ├─ sent                ├─ tags               ├─ message_id              │
│   ├─ delivered           └─ created_at         ├─ sent_at                 │
│   ├─ read                                      ├─ delivered_at            │
│   └─ failed                                    └─ read_at                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ (TTL cache, mappings)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         UPSTASH REDIS (Cache)                            │
│                                                                          │
│   settings:whatsapp:credentials        Credentials JSON                  │
│   message:{messageId}                  {campaignId, phone}               │
│   webhook:processed:{id}:{status}      Deduplication flag                │
│   campaign:{id}:paused                 Pause flag                        │
│   webhook:verify_token                 Auto-generated token              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Plano de Ação Prioritizado

### Semana 1: Crítico + Alto Impacto

1. **[ ] Extrair lógica de API routes para lib/handlers/**
   - `webhook-handler.ts`
   - `dispatch-handler.ts`

2. **[ ] Adicionar rate limiting global**
   - Usar `@upstash/ratelimit` no middleware

3. **[ ] Padronizar API routes**
   - `/api/campaign/*` → `/api/campaigns/{id}/*`

4. **[ ] Remover código legado**
   - `lib/storage.ts` (se não usado)
   - `services/*Service.turso.ts`

### Semana 2: Médio Impacto

5. **[ ] Reorganizar lib/**
   ```
   lib/
   ├── db/
   ├── integrations/
   ├── handlers/
   └── utils/
   ```

6. **[ ] Adicionar validação Zod em todas API routes**

7. **[ ] Implementar retry para mensagens individuais**

8. **[ ] Query keys factory**

### Semana 3: Baixo Impacto + Docs

9. **[ ] Criar ARCHITECTURE.md**

10. **[ ] Adicionar índices created_at**

11. **[ ] Avaliar substituição de Recharts**

12. **[ ] Preparar para multi-tenant** (planejamento)

---

## ✅ Pontos Fortes do Projeto

1. **Stack moderna e consistente** - React 19, Next.js 15, Upstash ecosystem
2. **Padrão Page → Hook → Service seguido corretamente**
3. **Components são realmente presentational**
4. **Optimistic updates implementados**
5. **QStash para background jobs durável**
6. **Autenticação bem estruturada**
7. **Cache headers nas API routes**
8. **Realtime updates com Upstash**
9. **Webhook deduplication**
10. **Error classification system**

---

**Nota Final:** O projeto tem uma arquitetura sólida para um SaaS em estágio inicial. Os problemas identificados são principalmente de organização/padronização e não de design fundamental. A stack escolhida (Turso + Upstash + QStash) é excelente para escalabilidade serverless.
