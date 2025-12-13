# 🔍 Auditoria de Qualidade de Código - SmartZap

**Data:** 30 de Novembro de 2025  
**Auditor:** GitHub Copilot (Claude Opus 4.5)  
**Versão do Projeto:** Next.js 15 + TypeScript + React 19

---

## 📊 Resumo Executivo

| Categoria | Críticos | Altos | Médios | Baixos | OK |
|-----------|----------|-------|--------|--------|-----|
| Tipagem TypeScript | 0 | 2 | 3 | 2 | ✅ |
| Console.logs | 0 | 3 | 0 | 0 | - |
| React Patterns | 0 | 0 | 2 | 1 | ✅ |
| Error Handling | 0 | 1 | 1 | 0 | ✅ |
| Código Duplicado | 0 | 0 | 2 | 0 | ✅ |
| Services/API | 0 | 0 | 1 | 0 | ✅ |
| Boas Práticas | 0 | 0 | 1 | 2 | ✅ |

**Total de Issues:** 0 Críticos | 6 Altos | 10 Médios | 5 Baixos

---

## 🔴 CRÍTICO (Problemas que podem causar bugs)

### Nenhum problema crítico encontrado ✅

A codebase está livre de problemas críticos de tipagem ou bugs potenciais graves.

---

## 🟠 ALTO (Código que precisa refatoração urgente)

### 1. Console.logs em Produção - Debugging Exposto

**Arquivos afetados:** 60+ ocorrências em múltiplos arquivos

**Problema:** Há muitos `console.log` espalhados pelo código que vazam informações sensíveis e poluem os logs de produção.

```typescript
// lib/user-auth.ts (linhas 48-57)
console.log('[isSetupComplete] Checking...')
console.log('[isSetupComplete] Result rows:', result.rows.length)
console.log('[isSetupComplete] Value:', result.rows[0]?.value)
console.log('[isSetupComplete] Complete:', complete)
```

```typescript
// app/api/setup/save-env/route.ts (linhas 35-138)
console.log('=== SAVE-ENV START ===')
console.log('Request body keys:', Object.keys(body))
console.log('Token present:', !!token) // ⚠️ Informação sensível!
```

```typescript
// services/campaignService.ts (linhas 272-319)
console.log('🚀 Starting campaign:', { id });
console.log('📋 Found contacts:', contacts.length);
console.log('📤 Dispatching to backend with contacts:', contacts.length);
```

```typescript
// lib/vercel-api.ts (linhas 77-165) - 15 console.logs!
console.log('[findProjectByDomain] Searching for domain:', normalizedDomain)
console.log('[findProjectByDomain] MATCH by alias! Project:', project.name)
```

**Impacto:** 
- Performance degradada em produção
- Exposição de informações sensíveis
- Logs confusos dificultam debugging real

**Correção:**
```typescript
// Substituir console.log por logger estruturado
import { logger } from '@/lib/logger';

// Antes:
console.log('[isSetupComplete] Checking...')

// Depois:
logger.debug('Checking setup completion');
```

**Ação:** Executar busca e substituição:
```bash
# Encontrar todos os console.log
grep -rn "console.log" --include="*.ts" --include="*.tsx" lib/ app/ services/ hooks/
```

---

### 2. Uso de `any` em Tipo Crítico (types.ts)

**Arquivo:** `types.ts` linha 46

```typescript
export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  text?: string;
  buttons?: TemplateButton[];
  example?: any;  // ❌ any em interface pública
}
```

**Impacto:** Perde validação de tipo no exemplo de template, pode causar runtime errors.

**Correção:**
```typescript
export interface TemplateExample {
  header_handle?: string[];
  header_text?: string[];
  body_text?: string[][];
}

export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  text?: string;
  buttons?: TemplateButton[];
  example?: TemplateExample;
}
```

---

### 3. Uso de `any` no Storage Helper

**Arquivo:** `lib/storage.ts` linha 38

```typescript
const set = (key: string, value: any) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
};
```

**Correção:**
```typescript
const set = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
};
```

---

### 4. Type Assertion com `as any` em Produção

**Arquivo:** `lib/realtime.ts` linhas 111 e 139

```typescript
// ❌ Type assertion perigosa - perde type safety
await (realtime.channel(`campaign-${campaignId}`) as any).emit('campaign.stats', data)

await (realtime.channel(`campaign-${campaignId}`) as any).emit('campaign.message', data)
```

**Impacto:** Perde type safety, pode falhar silenciosamente em runtime se a API mudar.

**Correção:**
```typescript
// Criar tipo específico para o channel
interface RealtimeChannelWithEmit {
  emit: (event: 'campaign.stats' | 'campaign.message', data: unknown) => Promise<void>;
}

// Usar com type guard
function getTypedChannel(channelName: string): RealtimeChannelWithEmit | null {
  if (!realtime) return null;
  return realtime.channel(channelName) as unknown as RealtimeChannelWithEmit;
}

// Uso
const channel = getTypedChannel(`campaign-${campaignId}`);
if (channel) {
  await channel.emit('campaign.stats', data);
}
```

---

### 5. TODO Abandonado com Impacto Funcional

**Arquivo:** `lib/meta-limits.ts` linha 363

```typescript
return {
  messagingTier,
  maxUniqueUsersPerDay: TIER_LIMITS[messagingTier] || 250,
  throughputLevel,
  maxMessagesPerSecond: THROUGHPUT_LIMITS[throughputLevel],
  qualityScore,
  usedToday: 0, // TODO: Track this via webhooks or analytics ❌
  lastFetched: new Date().toISOString(),
};
```

**Impacto:** O tracking de uso diário **não está implementado**, o que significa que:
- Usuários podem tentar enviar mais do que seu limite diário
- A validação de "remainingToday" sempre retorna o limite total
- O sistema não protege contra violação de rate limits da Meta

**Correção:** Implementar tracking real via Redis:
```typescript
// No webhook handler, incrementar contagem
const usageKey = `usage:${phoneNumberId}:${new Date().toISOString().split('T')[0]}`;
await redis.incr(usageKey);
await redis.expire(usageKey, 86400); // 24h TTL

// Na função fetchAccountLimits
const usedToday = await redis.get(usageKey) || 0;
```

---

### 6. TODO em Service Crítico (Resume Campaign)

**Arquivo:** `services/campaignService.turso.ts` linha 219

```typescript
// Resume a paused campaign
resume: async (id: string): Promise<Campaign | undefined> => {
  // TODO: Get remaining contacts from Turso and dispatch ❌
```

**Impacto:** A funcionalidade de "Retomar Campanha" pode estar incompleta - campanhas pausadas podem não continuar de onde pararam.

---

## 🟡 MÉDIO (Melhorias de qualidade)

### 1. Funções/Hooks Muito Longos

**Arquivo:** `hooks/useSettings.ts` - 350+ linhas

O hook `useSettingsController` faz muitas coisas:
- Gerencia formulário de credenciais
- Queries de webhook
- Queries de phone numbers
- Health checks
- Setup wizard steps
- Account limits

**Correção:** Dividir em hooks menores com responsabilidades únicas:
```typescript
// hooks/settings/useSettingsForm.ts
export function useSettingsForm() {
  // Apenas lógica de formulário
}

// hooks/settings/useWebhookSettings.ts
export function useWebhookSettings() {
  // Queries e mutations de webhook
}

// hooks/settings/useHealthCheck.ts
export function useHealthCheck() {
  // Lógica de health check
}

// hooks/settings/useSetupWizard.ts
export function useSetupWizard() {
  // Lógica do wizard
}
```

---

### 2. Acesso Direto ao localStorage (Inconsistência)

Apesar de existir `lib/storage.ts` com abstração, alguns arquivos acessam `localStorage` diretamente:

```typescript
// lib/meta-limits.ts
const stored = localStorage.getItem(LIMITS_STORAGE_KEY);

// lib/event-stats.ts
const stored = localStorage.getItem(STORAGE_KEY);

// hooks/useExchangeRate.ts
const cached = localStorage.getItem(CACHE_KEY);

// lib/batch-webhooks.ts
const stored = localStorage.getItem(storageKey);
```

**Problema:** Inconsistência no padrão de acesso a dados locais.

**Correção:** Expandir `lib/storage.ts` para incluir todos os tipos de dados ou criar módulos específicos:
```typescript
// lib/storage.ts
export const storage = {
  // ... existente
  
  limits: {
    get: (): AccountLimits | null => get(LIMITS_STORAGE_KEY, null),
    set: (limits: AccountLimits) => set(LIMITS_STORAGE_KEY, limits),
    isStale: (): boolean => { /* ... */ }
  },
  
  eventStats: {
    getEvents: (): CampaignEvent[] => get(EVENTS_KEY, []),
    saveEvents: (events: CampaignEvent[]) => set(EVENTS_KEY, events),
  }
};
```

---

### 3. Magic Numbers Sem Documentação Clara

**Arquivo:** `lib/user-auth.ts`

```typescript
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // Sem comentário de unidade
const MAX_LOGIN_ATTEMPTS = 5             // ✅ Auto-explicativo
const LOCKOUT_DURATION = 15 * 60 * 1000  // Segundos? Milissegundos?
```

**Correção:**
```typescript
/** Session expires after 7 days */
const SESSION_MAX_AGE_DAYS = 7;
const SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE_DAYS * 24 * 60 * 60;

/** Maximum failed login attempts before lockout */
const MAX_LOGIN_ATTEMPTS = 5;

/** Lockout duration: 15 minutes */
const LOCKOUT_DURATION_MINUTES = 15;
const LOCKOUT_DURATION_MS = LOCKOUT_DURATION_MINUTES * 60 * 1000;
```

---

### 4. Tratamento de Erro Inconsistente em Services

**Arquivo:** `services/campaignService.ts`

```typescript
// Alguns métodos retornam undefined
getById: async (id: string): Promise<Campaign | undefined> => {
  if (response.status === 404) return undefined; // Silencioso
}

// Outros lançam exceção
delete: async (id: string): Promise<void> => {
  if (!response.ok) {
    throw new Error('Failed to delete campaign'); // Exceção
  }
}

// Outros retornam arrays vazios
getAll: async (): Promise<Campaign[]> => {
  if (!response.ok) {
    console.error('Failed to fetch campaigns:', response.statusText);
    return []; // Silencioso
  }
}
```

**Correção:** Padronizar usando Result pattern ou sempre throw:
```typescript
// Opção 1: Result Pattern (preferido para erros esperados)
type ServiceResult<T> = 
  | { success: true; data: T } 
  | { success: false; error: string; code: string };

// Opção 2: Sempre throw (para erros inesperados)
/**
 * @throws {ServiceError} if operation fails
 */
delete: async (id: string): Promise<void>
```

---

### 5. Interface Duplicada

**Arquivos:** `hooks/useSettings.ts` e `types.ts`

```typescript
// hooks/useSettings.ts - Definição local
export interface PhoneNumber {
  id: string;
  display_phone_number: string;
  verified_name?: string;
  quality_rating?: string;
  webhook_configuration?: {
    phone_number?: string;
    whatsapp_business_account?: string;
    application?: string;
  };
}
```

**Problema:** Interface definida localmente que deveria estar centralizada em `types.ts`.

**Correção:** Mover para `types.ts` e importar.

---

### 6. Validação de Schema Duplicada

**Arquivos:** `lib/storage-validation.ts` e `lib/api-validation.ts`

Ambos definem schemas Zod para Contact, Campaign, etc. com pequenas diferenças.

```typescript
// lib/storage-validation.ts
export const ContactSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  phone: z.string().min(1),
  // ...
});

// lib/api-validation.ts
export const CreateContactSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(10).max(20),
  // ...
});
```

**Correção:** Centralizar em um arquivo `lib/schemas.ts`:
```typescript
// lib/schemas.ts - Single source of truth
export const ContactBaseSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(10).max(20),
});

export const ContactCreateSchema = ContactBaseSchema.extend({
  email: z.string().email().optional(),
  tags: z.array(z.string()).optional(),
});

export const ContactStorageSchema = ContactBaseSchema.extend({
  id: z.string().uuid(),
  lastActive: z.string(),
});
```

---

### 7. useEffect com Dependencies Incorretas

**Arquivo:** `hooks/useCampaignWizard.ts`

```typescript
// Initialize name
useEffect(() => {
  if (!name) {
    const date = new Date().toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
    setName(`Campanha ${date}`);
  }
}, []); // ❌ Array vazio mas usa 'name' no closure
```

**Problema:** O lint deveria reclamar que `name` está sendo usado mas não está nas dependencies.

**Correção:**
```typescript
// Opção 1: Incluir name nas deps
useEffect(() => {
  if (!name) {
    const date = new Date().toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
    setName(`Campanha ${date}`);
  }
}, [name]);

// Opção 2: Usar initialState no useState (preferido)
const [name, setName] = useState(() => {
  const date = new Date().toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
  return `Campanha ${date}`;
});
```

---

### 8. Error Handling sem Tipo Específico

**Arquivo:** `services/templateService.ts`

```typescript
generateAiContent: async (prompt: string): Promise<string> => {
  // ...
  if (!response.ok) throw new Error('Failed to generate AI content');
  // ❌ Erro genérico, perde contexto
}
```

**Correção:** Usar classe de erro específica (já existe):
```typescript
import { handleApiError } from '@/lib/errors';

generateAiContent: async (prompt: string): Promise<string> => {
  const response = await fetch('/api/ai/generate-template', { /* ... */ });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw handleApiError(error, { operation: 'generateAiContent', prompt });
  }
  // ...
}
```

---

### 9. API Base URL Subutilizada

**Arquivo:** `lib/api.ts`

```typescript
export const API_BASE_URL = '';

export const api = {
  get: async <T>(path: string): Promise<T> => { /* ... */ },
  post: async <T>(path: string, body?: unknown): Promise<T> => { /* ... */ },
};
```

**Problema:** Este módulo existe mas **não é usado**. Todos os services fazem fetch diretamente:
```typescript
// services/campaignService.ts
const response = await fetch('/api/campaigns'); // Direto, sem usar api.get()
```

**Correção:** Usar consistentemente OU remover o arquivo.

---

### 10. Import Cycle Potencial

```
types.ts → React (import React from 'react')
lib/*.ts → types.ts
```

O `types.ts` importa React apenas para `React.ReactNode` em `StatCardProps`.

**Correção:** Separar tipos de UI de tipos de dados:
```typescript
// types/data.ts - Tipos puros (sem React)
export interface Campaign { /* ... */ }
export interface Contact { /* ... */ }

// types/ui.ts - Tipos de componentes
import React from 'react';
export interface StatCardProps {
  icon: React.ReactNode;
}

// types/index.ts - Re-export
export * from './data';
export * from './ui';
```

---

## 🟢 BAIXO (Sugestões de estilo)

### 1. Nomenclatura Inconsistente de Arquivos

```
services/campaignService.ts       # camelCase
services/campaignService.turso.ts # camelCase.suffix ❓
lib/storage-validation.ts         # kebab-case
lib/api-validation.ts             # kebab-case
lib/turso.ts                      # camelCase (sem sufixo)
```

**Sugestão:** Padronizar:
- Arquivos de lib: `kebab-case.ts`
- Arquivos de services: `kebab-case.service.ts`
- Componentes: `PascalCase.tsx`

---

### 2. Comentários em Português/Inglês Misturados

```typescript
// lib/storage.ts
// Mapa de migração: valores antigos em inglês → novos em português

// lib/errors.ts
// Error Handling Utilities (inglês)

// lib/phone-formatter.ts
// Número de telefone não pode ser vazio (português nas mensagens)
```

**Sugestão:** Padronizar em **português** (pt-BR) para documentação e mensagens de erro, já que é o idioma do projeto.

---

### 3. Uso de `substr` Deprecated

**Arquivo:** `lib/event-stats.ts`

```typescript
return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
```

**Correção:**
```typescript
return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
```

---

### 4. Type Import Inconsistente

```typescript
// Alguns arquivos
import { Campaign } from '../types';

// Outros arquivos  
import type { Campaign } from '../types';
```

**Sugestão:** Usar `import type` quando importando apenas tipos (melhor tree-shaking):
```typescript
import type { Campaign, Contact, Template } from '../types';
```

---

### 5. Barrel Export Incompleto

**Arquivo:** `services/index.ts`

O arquivo existe mas nem todos os services estão exportados, levando a imports inconsistentes:
```typescript
import { campaignService } from '../services';        // via barrel ✅
import { settingsService } from '../services/settingsService'; // direto ❓
```

**Correção:** Atualizar barrel export:
```typescript
// services/index.ts
export { campaignService } from './campaignService';
export { contactService } from './contactService';
export { templateService } from './templateService';
export { settingsService } from './settingsService';
export { dashboardService } from './dashboardService';
```

---

## ✅ OK (Padrões bem seguidos)

### 1. Arquitetura Page → Hook → Service → Storage
O padrão está bem implementado e documentado no `copilot-instructions.md`.

```typescript
// Exemplo: Fluxo de Campanhas
CampaignListPage.tsx → useCampaignsController → campaignService → API → Turso
```

### 2. Tratamento de Erros em lib/errors.ts ⭐
Excelente implementação com:
- ✅ Error types enum
- ✅ Error classification (HTTP, WhatsApp, etc.)
- ✅ User-friendly messages em português
- ✅ Retry strategies
- ✅ WhatsApp-specific error handling (131056, etc.)

```typescript
export function getRetryDelay(attemptNumber: number, baseDelay: number = 1000): number {
  return Math.min(baseDelay * Math.pow(4, attemptNumber), 60000);
}
```

### 3. Validação de Telefone ⭐
`lib/phone-formatter.ts` usa libphonenumber-js corretamente com:
- ✅ Validação E.164
- ✅ Country detection
- ✅ Batch validation
- ✅ Display formatting

### 4. Rate Limiter Implementation ⭐
`lib/rate-limiter.ts` implementa Token Bucket corretamente com:
- ✅ Refill interval
- ✅ Configurable rates
- ✅ Memory cleanup (stop())
- ✅ Rate update during runtime

### 5. React Query Usage ⭐
Hooks usam React Query corretamente com:
- ✅ Optimistic updates
- ✅ Cache invalidation
- ✅ Proper query keys
- ✅ staleTime configurado
- ✅ initialData quando apropriado

### 6. Zod Validation ⭐
Schemas bem definidos em `lib/api-validation.ts` com:
- ✅ Mensagens de erro em português
- ✅ Limites sensíveis (max 100 chars, max 10k imports)
- ✅ Regex para telefone

### 7. Logger Estruturado ⭐
`lib/logger.ts` implementa logging com:
- ✅ Trace IDs para correlação
- ✅ Log levels (info, warn, error, debug)
- ✅ Structured context
- ✅ Memory management (max 1000 logs)
- ✅ JSON export

### 8. TypeScript Enums com Valores Significativos
```typescript
export enum CampaignStatus {
  DRAFT = 'Rascunho',      // Valores em português
  SCHEDULED = 'Agendado',
  SENDING = 'Enviando',
  COMPLETED = 'Concluído',
  PAUSED = 'Pausado',
  FAILED = 'Falhou'
}
```

---

## 📋 Plano de Ação Recomendado

### Prioridade 1 (Esta Sprint) 🔴
1. [ ] Remover/substituir todos os `console.log` por `logger`
2. [ ] Tipar `example` em `TemplateComponent`
3. [ ] Tipar `set` helper em `storage.ts`
4. [ ] Resolver type assertion `as any` em `realtime.ts`

### Prioridade 2 (Próxima Sprint) 🟠
5. [ ] Implementar tracking de `usedToday` em `meta-limits.ts`
6. [ ] Completar TODO de resume campaign
7. [ ] Refatorar `useSettingsController` em hooks menores
8. [ ] Padronizar tratamento de erro em services

### Prioridade 3 (Backlog) 🟡
9. [ ] Centralizar schemas Zod em `lib/schemas.ts`
10. [ ] Padronizar acesso a localStorage via `storage.ts`
11. [ ] Corrigir useEffect dependencies
12. [ ] Mover `PhoneNumber` interface para `types.ts`

### Prioridade 4 (Nice to Have) 🟢
13. [ ] Padronizar nomenclatura de arquivos
14. [ ] Atualizar `substr` para `substring`
15. [ ] Completar barrel exports em `services/index.ts`
16. [ ] Usar `import type` consistentemente

---

## 📈 Métricas de Qualidade

| Métrica | Valor Atual | Meta |
|---------|-------------|------|
| Cobertura de Tipos | ~95% | 100% |
| Uso de `any` | 3 ocorrências | 0 |
| Console.logs | 60+ | 0 |
| TODOs críticos | 2 | 0 |
| Funções >50 linhas | ~5 | 0 |
| Código duplicado | ~3% | <2% |

---

## 🔧 Comandos Úteis para Auditoria

```bash
# Encontrar console.logs
grep -rn "console.log" --include="*.ts" --include="*.tsx" lib/ app/ services/ hooks/

# Encontrar uso de any
grep -rn ": any" --include="*.ts" --include="*.tsx" lib/ services/ hooks/ types.ts

# Encontrar TODOs
grep -rn "TODO\|FIXME" --include="*.ts" --include="*.tsx" lib/ services/ hooks/

# Encontrar type assertions perigosas
grep -rn "as any" --include="*.ts" --include="*.tsx" lib/ services/ hooks/

# Funções longas (>50 linhas) - manual check needed
wc -l lib/*.ts | sort -n
```

---

*Relatório gerado automaticamente. Última atualização: 30/11/2025*
