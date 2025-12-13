# WhatsApp Business API - Template Reference Guide

> **Versão da API:** v24.0  
> **Última atualização:** Dezembro 2025  
> **Fonte:** Meta Developer Documentation + Context7

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura do Template](#estrutura-do-template)
3. [Componentes](#componentes)
   - [HEADER](#header)
   - [BODY](#body)
   - [FOOTER](#footer)
   - [BUTTONS](#buttons)
4. [Tipos de Botões](#tipos-de-botões)
5. [Limites e Restrições](#limites-e-restrições)
6. [Exemplos Completos](#exemplos-completos)
7. [Erros Comuns](#erros-comuns)

---

## Visão Geral

### Endpoint para Criar Template

```
POST https://graph.facebook.com/v24.0/{WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates
```

### Headers Obrigatórios

```http
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json
```

### Categorias de Template

| Categoria | Uso | Aprovação |
|-----------|-----|-----------|
| `MARKETING` | Promoções, ofertas, newsletters | Requer aprovação manual |
| `UTILITY` | Transacional, alertas, confirmações | Aprovação mais rápida |
| `AUTHENTICATION` | OTP, códigos de verificação | Aprovação automática |

---

## Estrutura do Template

### Payload Básico

```json
{
  "name": "nome_do_template",
  "language": "pt_BR",
  "category": "UTILITY",
  "components": [
    { "type": "HEADER", ... },
    { "type": "BODY", ... },
    { "type": "FOOTER", ... },
    { "type": "BUTTONS", ... }
  ]
}
```

### Campos Obrigatórios

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | string | Nome único do template (snake_case, max 512 chars) |
| `language` | string | Código do idioma (ex: `pt_BR`, `en_US`) |
| `category` | string | Categoria: `MARKETING`, `UTILITY`, `AUTHENTICATION` |
| `components` | array | Array de componentes |

### Campos Opcionais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `message_send_ttl_seconds` | integer | TTL para templates de autenticação (60-600) |

---

## Componentes

### HEADER

O header é **opcional** e aparece no topo da mensagem.

#### Formatos Suportados

| Format | Descrição | Exemplo |
|--------|-----------|---------|
| `TEXT` | Texto simples (max 60 chars) | Título da mensagem |
| `IMAGE` | Imagem | Banner, produto |
| `VIDEO` | Vídeo | Demonstração |
| `DOCUMENT` | PDF/Doc | Boleto, contrato |
| `LOCATION` | Localização | Endereço de entrega |

#### Header de Texto

```json
{
  "type": "HEADER",
  "format": "TEXT",
  "text": "Confirmação de Pedido",
  "example": {
    "header_text": ["Pedido #12345"]
  }
}
```

#### Header com Variável

```json
{
  "type": "HEADER",
  "format": "TEXT",
  "text": "Olá, {{1}}!",
  "example": {
    "header_text": ["João"]
  }
}
```

#### Header de Mídia (Imagem)

```json
{
  "type": "HEADER",
  "format": "IMAGE",
  "example": {
    "header_handle": ["4::aW1hZ2UvanBlZw==:ARb..."]
  }
}
```

> ⚠️ **Nota:** Para mídia, você precisa fazer upload primeiro via Resumable Upload API e obter o `header_handle`.

---

### BODY

O body é **obrigatório** e contém o texto principal da mensagem.

#### Estrutura

```json
{
  "type": "BODY",
  "text": "Olá {{1}}! Seu pedido {{2}} foi confirmado.",
  "example": {
    "body_text": [["João", "#12345"]]
  }
}
```

#### Regras de Variáveis

| Regra | Correto ✅ | Incorreto ❌ |
|-------|-----------|-------------|
| Não iniciar com variável | "Olá! {{1}}, bem-vindo" | "{{1}}, bem-vindo" |
| Não terminar com variável | "Seu código é {{1}}." | "Seu código é {{1}}" |
| Máximo de variáveis | Até 10 | Mais de 10 |

#### Formatação de Texto

| Formato | Sintaxe | Resultado |
|---------|---------|-----------|
| Negrito | `*texto*` | **texto** |
| Itálico | `_texto_` | *texto* |
| Tachado | `~texto~` | ~~texto~~ |
| Monospace | ``` `texto` ``` | `texto` |

#### Para Templates de Autenticação

```json
{
  "type": "BODY",
  "text": "Seu código de verificação é {{1}}.",
  "add_security_recommendation": true,
  "example": {
    "body_text": [["123456"]]
  }
}
```

---

### FOOTER

O footer é **opcional** e aparece na parte inferior em texto menor.

```json
{
  "type": "FOOTER",
  "text": "Responda SAIR para não receber mais mensagens."
}
```

#### Para Templates de Autenticação

```json
{
  "type": "FOOTER",
  "text": "Este código expira em 10 minutos.",
  "code_expiration_minutes": 10
}
```

---

### BUTTONS

O componente de botões é **opcional** e permite até 10 botões.

#### Estrutura Geral

```json
{
  "type": "BUTTONS",
  "buttons": [
    { "type": "QUICK_REPLY", "text": "Confirmar" },
    { "type": "URL", "text": "Ver Detalhes", "url": "https://site.com" }
  ]
}
```

---

## Tipos de Botões

### 1. QUICK_REPLY (Resposta Rápida)

Botão que envia uma resposta pré-definida.

```json
{
  "type": "QUICK_REPLY",
  "text": "Confirmar"
}
```

**Limites:**
- Máximo 3 botões QUICK_REPLY por template
- Texto: máximo 25 caracteres

---

### 2. URL (Link)

Botão que abre uma URL.

```json
{
  "type": "URL",
  "text": "Acessar Site",
  "url": "https://www.exemplo.com"
}
```

#### URL com Variável Dinâmica

```json
{
  "type": "URL",
  "text": "Ver Pedido",
  "url": "https://site.com/pedido/{{1}}",
  "example": ["https://site.com/pedido/12345"]
}
```

**Limites:**
- Máximo 2 botões URL por template
- URL: máximo 2000 caracteres
- Texto: máximo 25 caracteres

---

### 3. PHONE_NUMBER (Ligar)

Botão que inicia uma chamada telefônica.

```json
{
  "type": "PHONE_NUMBER",
  "text": "Ligar para Suporte",
  "phone_number": "+5511999999999"
}
```

**Limites:**
- Máximo 1 botão PHONE_NUMBER por template
- Formato E.164 obrigatório
- Texto: máximo 25 caracteres

---

### 4. COPY_CODE (Copiar Código)

Botão que copia um código para a área de transferência.

```json
{
  "type": "COPY_CODE",
  "example": "DESCONTO20"
}
```

> 📌 Usado principalmente para cupons de desconto.

---

### 5. OTP (One-Time Password)

Para templates de autenticação.

#### Copy Code OTP

```json
{
  "type": "OTP",
  "otp_type": "COPY_CODE"
}
```

#### One-Tap Autofill

```json
{
  "type": "OTP",
  "otp_type": "ONE_TAP",
  "text": "Copiar Código",
  "autofill_text": "Preencher Automaticamente",
  "package_name": "com.exemplo.app",
  "signature_hash": "K8a/AINcGX7"
}
```

#### Zero-Tap (Automático)

```json
{
  "type": "OTP",
  "otp_type": "ZERO_TAP",
  "package_name": "com.exemplo.app",
  "signature_hash": "K8a/AINcGX7"
}
```

---

### 6. FLOW (WhatsApp Flows)

Para formulários interativos.

```json
{
  "type": "FLOW",
  "text": "Preencher Formulário",
  "flow_id": "123456789",
  "flow_action": "navigate",
  "navigate_screen": "SCREEN_1"
}
```

---

### 7. CATALOG (Ver Catálogo)

```json
{
  "type": "CATALOG",
  "text": "Ver Produtos"
}
```

---

### 8. MPM (Multi-Product Message)

```json
{
  "type": "MPM",
  "text": "Ver Seleção"
}
```

---

### 9. VOICE_CALL (Chamada de Voz)

```json
{
  "type": "VOICE_CALL",
  "text": "Iniciar Chamada"
}
```

---

## Limites e Restrições

### Caracteres

| Componente | Limite |
|------------|--------|
| Nome do template | 512 caracteres |
| Header (texto) | 60 caracteres |
| Body | 1024 caracteres |
| Footer | 60 caracteres |
| Texto do botão | 25 caracteres |
| URL do botão | 2000 caracteres |

### Quantidade de Botões

| Tipo | Máximo |
|------|--------|
| QUICK_REPLY | 3 |
| URL | 2 |
| PHONE_NUMBER | 1 |
| Total combinado | 10 |

### Regras de Combinação

- Não pode misturar QUICK_REPLY com CTA (URL/PHONE) no mesmo template
- Templates de autenticação só permitem botões OTP
- Botões CTA (URL + PHONE) podem ser combinados (máximo 2)

### Palavras Proibidas (UTILITY)

Templates UTILITY **não podem** conter:
- "promoção", "desconto", "oferta"
- "grátis", "imperdível", "aproveite"
- "compre", "adquira"
- Emojis excessivos

---

## Exemplos Completos

### Template de Lembrete com Botão URL

```json
{
  "name": "lembrete_aula_zoom",
  "language": "pt_BR",
  "category": "UTILITY",
  "components": [
    {
      "type": "BODY",
      "text": "Olá {{1}}! Sua aula ao vivo sobre {{2}} começa às {{3}}. Clique no botão abaixo para entrar.",
      "example": {
        "body_text": [["João", "Criação de Sistemas com IA", "19h"]]
      }
    },
    {
      "type": "FOOTER",
      "text": "Responda SAIR para cancelar lembretes."
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "URL",
          "text": "Entrar na Aula",
          "url": "https://zoom.us/j/123456789"
        },
        {
          "type": "QUICK_REPLY",
          "text": "Confirmar Presença"
        }
      ]
    }
  ]
}
```

### Template de Confirmação de Pedido

```json
{
  "name": "confirmacao_pedido",
  "language": "pt_BR",
  "category": "UTILITY",
  "components": [
    {
      "type": "HEADER",
      "format": "TEXT",
      "text": "Pedido Confirmado! ✅"
    },
    {
      "type": "BODY",
      "text": "Olá {{1}}! Seu pedido #{{2}} foi confirmado com sucesso. Valor total: R$ {{3}}. Previsão de entrega: {{4}}.",
      "example": {
        "body_text": [["Maria", "54321", "199,90", "15/12/2025"]]
      }
    },
    {
      "type": "FOOTER",
      "text": "Dúvidas? Responda esta mensagem."
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "URL",
          "text": "Rastrear Pedido",
          "url": "https://loja.com/rastreio/{{1}}",
          "example": ["https://loja.com/rastreio/54321"]
        },
        {
          "type": "PHONE_NUMBER",
          "text": "Falar com Suporte",
          "phone_number": "+5511999999999"
        }
      ]
    }
  ]
}
```

### Template de Autenticação (OTP)

```json
{
  "name": "codigo_verificacao",
  "language": "pt_BR",
  "category": "AUTHENTICATION",
  "message_send_ttl_seconds": 600,
  "components": [
    {
      "type": "BODY",
      "text": "Seu código de verificação é {{1}}.",
      "add_security_recommendation": true,
      "example": {
        "body_text": [["123456"]]
      }
    },
    {
      "type": "FOOTER",
      "code_expiration_minutes": 10
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "OTP",
          "otp_type": "COPY_CODE"
        }
      ]
    }
  ]
}
```

---

## Erros Comuns

### Erro 100 - Template já existe

```json
{
  "error": {
    "code": 100,
    "message": "Template with name 'nome_template' already exists"
  }
}
```
**Solução:** Use outro nome ou delete o template existente.

### Erro 100 - Parâmetros inválidos

```json
{
  "error": {
    "code": 100,
    "message": "Invalid parameter"
  }
}
```
**Soluções comuns:**
- Verifique se o texto do botão tem mais de 25 caracteres
- Verifique se o body tem mais de 1024 caracteres
- Verifique se há variáveis sem exemplo

### Erro 190 - Token inválido

```json
{
  "error": {
    "code": 190,
    "message": "Invalid OAuth access token"
  }
}
```
**Solução:** Renove o token de acesso.

### Erro 368 - Limite de templates

```json
{
  "error": {
    "code": 368,
    "message": "Template limit reached"
  }
}
```
**Solução:** Delete templates não utilizados ou solicite aumento de limite.

---

## Mapeamento SmartZap → Meta API

### Formato do Gerador AI

```typescript
// Formato gerado pela IA
{
  name: "template_name",
  content: "Texto do body",
  language: "pt_BR",
  header?: { format: "TEXT", text: "..." },
  footer?: { text: "..." },
  buttons?: [
    { type: "URL", text: "...", url: "..." },
    { type: "QUICK_REPLY", text: "..." }
  ]
}
```

### Conversão para Meta API

```typescript
// Formato enviado para Meta
{
  name: "template_name",
  language: "pt_BR",
  category: "UTILITY",
  components: [
    { type: "HEADER", format: "TEXT", text: "..." },
    { type: "BODY", text: "...", example: { body_text: [[...]] } },
    { type: "FOOTER", text: "..." },
    { type: "BUTTONS", buttons: [...] }
  ]
}
```

---

## Referências

- [Meta Developer Docs - Message Templates](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates)
- [Cloud API - Send Templates](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates)
- [Template Components](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/components)

---

> 📝 **Mantido por:** SmartZap Team  
> 📅 **Versão:** 1.0.0
