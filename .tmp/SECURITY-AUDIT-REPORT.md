# 🔒 SmartZap - Relatório de Auditoria de Segurança v2

**Data:** 30 de Novembro de 2025  
**Auditor:** GitHub Copilot (Claude Opus 4.5)  
**Versão:** 2.0 - Auditoria Completa  
**Classificação:** CONFIDENCIAL

---

## 📋 Sumário Executivo

Realizei uma auditoria de segurança abrangente do SmartZap, uma aplicação SaaS de automação de marketing WhatsApp. A análise cobriu autenticação, autorização, validação de entrada, proteção de dados, headers de segurança, e potenciais vetores de ataque.

### Resumo de Achados

| Severidade | Quantidade | Status |
|------------|------------|--------|
| 🔴 CRÍTICA | 3 | Requer ação imediata |
| 🟠 ALTA | 5 | Requer ação prioritária |
| 🟡 MÉDIA | 4 | Recomendado corrigir |
| 🟢 BAIXA | 3 | Boas práticas |
| ✅ OK | 8 | Bem implementado |

---

## 🔴 Vulnerabilidades CRÍTICAS

### 1. [CRÍTICA] Endpoints de Debug Acessíveis em Produção

**Arquivos Afetados:**
- `app/api/debug/domain-check/route.ts`
- `app/api/debug/realtime/route.ts`
- `app/api/debug/reset-setup/route.ts`

**Descrição:**  
Os endpoints de debug estão expostos em produção sem qualquer proteção. Eles estão listados em `PUBLIC_API_ROUTES` no middleware:

```typescript
// middleware.ts - linha 28
const PUBLIC_API_ROUTES = ['/api/auth', '/api/webhook', '/api/health', '/api/system', '/api/setup', '/api/debug', '/api/database/init']
```

**Impacto Crítico:**
1. **`/api/debug/reset-setup`** - Permite **RESETAR TODO O SETUP** da aplicação, deletando empresa, sessão e dados críticos:
```typescript
// Qualquer pessoa pode fazer POST para resetar tudo!
await turso.execute({
  sql: `DELETE FROM settings WHERE key IN (?, ?, ?, ?, ?, ?)`,
  args: ['company_id', 'company_name', 'company_email', 'company_phone', 'company_created_at', 'session_token']
})
```

2. **`/api/debug/domain-check`** - Aceita Vercel TOKEN e faz chamadas à API Vercel, expondo informações do projeto
3. **`/api/debug/realtime`** - Expõe dados de campanhas e mapeamentos de mensagens do Redis

**Risco:** Um atacante pode:
- Forçar logout de todos os usuários resetando o setup
- Obter informações sobre projetos Vercel
- Visualizar dados de campanhas ativas

**Correção Imediata:**
```typescript
// middleware.ts - REMOVER /api/debug da lista pública
const PUBLIC_API_ROUTES = ['/api/auth', '/api/webhook', '/api/health', '/api/system', '/api/setup']

// OU deletar completamente os endpoints de debug em produção
```

---

### 2. [CRÍTICA] Comparação de Senha Sem Timing-Safe

**Arquivo:** `lib/user-auth.ts` linha 211

**Código Vulnerável:**
```typescript
// Simple comparison with env var
const isValid = password === masterPassword
```

**Descrição:**  
A comparação direta de strings com `===` é vulnerável a **timing attacks**. Um atacante pode medir o tempo de resposta para descobrir caractere por caractere da senha.

**Correção:**
```typescript
import { timingSafeEqual } from 'crypto'

const isValid = timingSafeEqual(
  Buffer.from(password),
  Buffer.from(masterPassword)
)
```

---

### 3. [CRÍTICA] Token de Webhook Logado no Console

**Arquivos:**
- `app/api/webhook/route.ts` linha 18
- `app/api/webhook/info/route.ts` linha 16

**Código Vulnerável:**
```typescript
console.log('🔑 Generated new webhook verify token:', newToken)
```

**Descrição:**  
O token de verificação do webhook está sendo logado em produção. Logs em serviços como Vercel são visíveis para desenvolvedores e podem ser indexados por ferramentas de monitoramento.

**Impacto:** Um atacante com acesso aos logs pode:
- Configurar webhooks maliciosos
- Interceptar eventos de mensagens WhatsApp

**Correção:**
```typescript
// Remover completamente ou usar apenas em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  console.log('🔑 Generated new webhook verify token:', newToken)
}
```

---

## 🟠 Vulnerabilidades ALTAS

### 4. [ALTA] /api/database/init Sem Proteção de Admin

**Arquivo:** `app/api/database/init/route.ts`

**Descrição:**  
Apesar de estar listado em `ADMIN_ENDPOINTS` no `lib/auth.ts`, ele também está em `PUBLIC_API_ROUTES` no middleware, o que ANULA a proteção:

```typescript
// lib/auth.ts - Tenta proteger
export const ADMIN_ENDPOINTS = [
  '/api/database/init',
  '/api/database/cleanup',
  ...
]

// middleware.ts - MAS está como público!
const PUBLIC_API_ROUTES = [..., '/api/database/init']
```

**Impacto:** Qualquer pessoa pode:
- Re-inicializar o banco de dados
- Potencialmente corromper dados existentes

**Correção:** Remover de `PUBLIC_API_ROUTES`:
```typescript
const PUBLIC_API_ROUTES = ['/api/auth', '/api/webhook', '/api/health', '/api/system', '/api/setup']
// /api/database/init deve requerer autenticação!
```

---

### 5. [ALTA] Validação de Sessão Apenas no Cliente

**Arquivos:**
- `middleware.ts`
- API routes em geral

**Descrição:**  
O middleware apenas verifica se o **cookie existe**, mas não valida se ele é válido:

```typescript
// middleware.ts - linha 56
const sessionCookie = request.cookies.get('smartzap_session')
if (sessionCookie?.value) {
  // Session exists, allow request (validation happens in API route)
  return NextResponse.next()
}
```

O comentário diz "validation happens in API route", mas **NENHUMA API route faz essa validação!**

**Verificação:**
```bash
grep -r "validateSession" app/api/
# Resultado: NENHUMA chamada a validateSession nas rotas de API
```

**Impacto:** Um atacante pode criar um cookie falso `smartzap_session=qualquer_coisa` e acessar todas as APIs.

**Correção:** Adicionar middleware que valida sessão:
```typescript
// Em cada API route protegida
import { validateSession } from '@/lib/user-auth'

export async function GET() {
  if (!(await validateSession())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ... resto do código
}
```

---

### 6. [ALTA] MASTER_PASSWORD Pode Ser Fraca

**Arquivo:** `lib/user-auth.ts`

**Descrição:**  
Não há validação de força da senha. O usuário pode configurar `MASTER_PASSWORD=123` e comprometer toda a segurança.

**Recomendação:**
```typescript
// No setup, validar força da senha
function validatePasswordStrength(password: string): boolean {
  if (password.length < 12) return false
  if (!/[A-Z]/.test(password)) return false
  if (!/[a-z]/.test(password)) return false
  if (!/[0-9]/.test(password)) return false
  if (!/[^A-Za-z0-9]/.test(password)) return false
  return true
}
```

---

### 7. [ALTA] Rate Limiting Armazenado em Banco Lento

**Arquivo:** `lib/user-auth.ts` linhas 319-366

**Descrição:**  
O rate limiting de login usa Turso (SQLite), que é significativamente mais lento que Redis. Para cada tentativa de login:
1. SELECT para verificar tentativas
2. INSERT/UPDATE para registrar tentativa

**Problema:** Um atacante pode fazer muitas requisições antes do rate limit ser registrado, especialmente com requests paralelos.

**Correção:** Usar Redis (já disponível) para rate limiting:
```typescript
import { redis, isRedisAvailable } from './redis'

async function checkRateLimiting(ip: string): Promise<boolean> {
  if (!isRedisAvailable()) return false // fallback
  
  const key = `ratelimit:login:${ip}`
  const attempts = await redis.incr(key)
  
  if (attempts === 1) {
    await redis.expire(key, 900) // 15 minutos
  }
  
  return attempts > MAX_LOGIN_ATTEMPTS
}
```

---

### 8. [ALTA] API Test Sem Autenticação

**Arquivo:** `app/api/test/send-message/route.ts`

**Descrição:**  
Endpoint de teste que **envia mensagens WhatsApp reais** sem autenticação. Não está listado como `PUBLIC_API_ROUTES`, mas a validação de sessão não está sendo feita nas APIs.

**Impacto:**
- Consumo de créditos WhatsApp ($$$)
- Envio de spam através da conta do cliente
- Possível banimento do número WhatsApp

**Correção:** Restringir a desenvolvimento OU exigir autenticação:
```typescript
export async function POST(request: NextRequest) {
  // Bloquear em produção
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }
  // ... ou validar sessão
}
```

---

## 🟡 Vulnerabilidades MÉDIAS

### 9. [MÉDIA] Logs Excessivos com Dados Potencialmente Sensíveis

**Arquivos Múltiplos**

**Exemplos encontrados:**
```typescript
// app/api/setup/save-env/route.ts
console.log('Request body keys:', Object.keys(body))
console.log('Token present:', !!token)
console.log('Env var keys to save:', envVarsToSave.map(e => e.key))

// app/api/webhook/route.ts
console.log('📨 Webhook received:', JSON.stringify(body))
```

**Risco:** Logs podem conter:
- Informações sobre chaves de ambiente
- Dados de contatos (LGPD/GDPR)
- Estrutura interna da aplicação

**Correção:**
```typescript
// Usar logger estruturado com níveis
import { logger } from '@/lib/logger'

// Em produção, só logar erros
if (process.env.NODE_ENV !== 'production') {
  logger.debug('Request body keys:', Object.keys(body))
}
```

---

### 10. [MÉDIA] Sessão Única Compartilhada

**Arquivo:** `lib/user-auth.ts` linhas 248-266

**Descrição:**  
O sistema armazena apenas UMA sessão no banco (`settings.session_token`). Se um novo login é feito, a sessão anterior é invalidada:

```typescript
await turso.execute({
  sql: `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  args: ['session_token', sessionToken, now]
})
```

**Impacto:**
- Apenas um dispositivo/browser pode estar logado por vez
- Login em novo dispositivo desconecta o anterior sem aviso

**Consideração:** Para single-tenant DaaS, isso pode ser intencional, mas deve ser documentado.

---

### 11. [MÉDIA] Sem Validação de Origin no Webhook

**Arquivo:** `app/api/webhook/route.ts`

**Descrição:**  
O webhook aceita POSTs de qualquer origem. Idealmente deveria validar que veio da Meta:

**Correção Recomendada:**
```typescript
// Verificar assinatura do webhook (Meta X-Hub-Signature)
const signature = request.headers.get('x-hub-signature-256')
const expectedSignature = crypto
  .createHmac('sha256', process.env.WEBHOOK_APP_SECRET!)
  .update(rawBody)
  .digest('hex')

if (signature !== `sha256=${expectedSignature}`) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
}
```

---

### 12. [MÉDIA] Credenciais Vercel em Query String

**Arquivo:** `app/api/setup/save-env/route.ts` linhas 153-160

**Código:**
```typescript
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')  // Token na URL!
  const deploymentId = searchParams.get('deploymentId')
```

**Risco:** Tokens em query strings:
- Ficam logados em access logs do servidor
- Podem ser capturados por proxies
- Ficam no histórico do browser

**Correção:** Usar headers ou POST body:
```typescript
const token = request.headers.get('x-vercel-token')
```

---

## 🟢 Vulnerabilidades BAIXAS

### 13. [BAIXA] Cookie SameSite=Lax (não Strict)

**Arquivo:** `lib/user-auth.ts` linha 264

```typescript
cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',  // Poderia ser 'strict'
  maxAge: SESSION_MAX_AGE,
  path: '/'
})
```

**Análise:** `Lax` é adequado para a maioria dos casos, mas `strict` ofereceria proteção CSRF ainda maior. Manter `lax` se precisar de navegação via links externos.

---

### 14. [BAIXA] Session Token com UUID v4

**Arquivo:** `lib/user-auth.ts` linha 250

```typescript
const sessionToken = crypto.randomUUID()
```

**Análise:** UUID v4 tem 122 bits de entropia, que é suficiente. Para máxima segurança, poderia usar:
```typescript
const sessionToken = crypto.randomBytes(32).toString('base64url')
// 256 bits de entropia
```

---

### 15. [BAIXA] Falta de Content Security Policy

**Arquivo:** `vercel.json`

**Headers presentes (✅):**
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security
- Referrer-Policy
- Permissions-Policy

**Faltando:**
```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
}
```

---

## ✅ O QUE ESTÁ BEM IMPLEMENTADO

### 1. ✅ Cookies Seguros
```typescript
cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
  httpOnly: true,    // ✅ Protege contra XSS
  secure: true,      // ✅ Apenas HTTPS em prod
  sameSite: 'lax',   // ✅ Proteção CSRF básica
  maxAge: 7 * 24 * 60 * 60, // ✅ Expiração definida
})
```

### 2. ✅ Rate Limiting de Login
Implementado com lockout de 15 minutos após 5 tentativas.

### 3. ✅ SQL Injection Prevenido
Todas as queries usam prepared statements com placeholders:
```typescript
await turso.execute({
  sql: 'SELECT * FROM settings WHERE key = ?',
  args: [key]  // ✅ Parametrizado
})
```

### 4. ✅ Headers de Segurança Básicos
`vercel.json` inclui headers importantes:
- HSTS
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff

### 5. ✅ Sem dangerouslySetInnerHTML
Nenhum uso encontrado no código, React escapa automaticamente.

### 6. ✅ Arquivos .env no .gitignore
```gitignore
.env
.env*.local
```

### 7. ✅ Validação de Input com Zod
```typescript
// lib/api-validation.ts
export const CreateContactSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().regex(/^[\d+\-\s()]+$/),
  email: z.string().email().optional(),
})
```

### 8. ✅ CORS Configurado (com ressalvas)
```typescript
// next.config.ts
const allowedOrigin = process.env.FRONTEND_URL || 'https://smartzap.vercel.app'
// ✅ Não usa wildcard em produção
```

---

## 📊 Matriz de Risco

| Vulnerabilidade | Impacto | Probabilidade | Risco |
|-----------------|---------|---------------|-------|
| Debug endpoints expostos | CRÍTICO | ALTA | 🔴 CRÍTICO |
| Timing attack na senha | MÉDIO | BAIXA | 🟡 MÉDIO |
| Token no log | ALTO | MÉDIA | 🟠 ALTA |
| /api/database/init público | ALTO | MÉDIA | 🟠 ALTA |
| Sessão não validada nas APIs | CRÍTICO | ALTA | 🔴 CRÍTICO |
| Rate limit lento | MÉDIO | MÉDIA | 🟡 MÉDIO |
| API test sem auth | ALTO | MÉDIA | 🟠 ALTA |

---

## 🛠️ Plano de Correção Prioritário

### Imediato (Hoje)
1. ⚠️ Remover `/api/debug` de `PUBLIC_API_ROUTES` no middleware
2. ⚠️ Remover `/api/database/init` de `PUBLIC_API_ROUTES`
3. ⚠️ Remover console.log do token de webhook

### Curto Prazo (Esta Semana)
4. Implementar validação de sessão em todas as API routes
5. Usar `timingSafeEqual` para comparação de senha
6. Mover rate limiting para Redis

### Médio Prazo (Este Mês)
7. Adicionar validação de assinatura no webhook
8. Implementar CSP header
9. Mover tokens de query string para headers
10. Bloquear endpoint de teste em produção

---

## 📝 Notas Adicionais

### Arquitetura de Segurança Atual
- **Single-tenant DaaS:** Cada cliente tem sua instância
- **Sem multi-tenancy:** Simplifica modelo de segurança
- **Credentials em Vercel:** Tokens armazenados como env vars (bom)

### Recomendações de Monitoramento
1. Implementar logging estruturado (sem dados sensíveis)
2. Alertas para tentativas de login falhadas
3. Monitorar endpoints de debug (devem ter 0 requests)

### Conformidade
- **LGPD:** Dados de contatos precisam de política de retenção
- **WhatsApp Business Policy:** Opt-in deve ser verificável

---

**Fim do Relatório**

*Auditoria realizada automaticamente. Recomenda-se revisão manual adicional.*
