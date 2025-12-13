# WhatsApp Cloud API - Referência Completa

> **Versão da API**: v24.0  
> **Última Atualização**: Janeiro 2025  
> **Fonte Oficial**: [Meta for Developers - WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)

Este documento serve como **fonte da verdade** para toda a integração com a WhatsApp Cloud API no projeto SmartZap.

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Autenticação](#autenticação)
3. [Endpoint Base](#endpoint-base)
4. [Envio de Mensagens](#envio-de-mensagens)
   - [Estrutura Comum](#estrutura-comum-do-payload)
   - [Mensagens de Texto](#mensagens-de-texto)
   - [Mensagens de Mídia](#mensagens-de-mídia)
   - [Mensagens Interativas](#mensagens-interativas)
   - [Mensagens de Template](#mensagens-de-template)
   - [Mensagens de Reação](#mensagens-de-reação)
5. [API de Mídia](#api-de-mídia)
6. [Templates](#templates)
7. [Webhooks](#webhooks)
8. [Números de Telefone](#números-de-telefone)
9. [Códigos de Erro](#códigos-de-erro)
10. [Rate Limits](#rate-limits)
11. [Funcionalidades Avançadas](#funcionalidades-avançadas)
    - [Confirmações de Leitura](#confirmações-de-leitura)
    - [Indicadores de Digitação](#indicadores-de-digitação)
    - [Respostas Contextuais](#respostas-contextuais)
    - [Cache de Mídia](#cache-de-mídia)
    - [Tempo de Vida (TTL)](#tempo-de-vida-ttl)
12. [APIs Adicionais](#apis-adicionais)
    - [API de Grupos](#api-de-grupos-groups-api)
    - [API de Bloqueio de Usuários](#api-de-bloqueio-de-usuários-block-users-api)
    - [API de Comércio](#api-de-comércio-e-commercecatalog)
    - [API de Chamadas](#api-de-chamadas-calling-api)
    - [API de Pagamentos Brasil](#api-de-pagamentos-brasil-payments-api-br)

---

## Visão Geral

A WhatsApp Cloud API permite que empresas enviem e recebam mensagens via WhatsApp através de endpoints HTTP. A API é hospedada pela Meta e não requer infraestrutura própria.

### Principais Recursos

| Recurso | Descrição |
|---------|-----------|
| **Messages** | Envio de todos os tipos de mensagens |
| **Media** | Upload, download e gerenciamento de mídia |
| **Templates** | Mensagens pré-aprovadas para envio em massa |
| **Webhooks** | Recebimento de mensagens e status em tempo real |
| **Phone Numbers** | Gerenciamento de números de telefone comerciais |

---

## Autenticação

Todas as requisições devem incluir um **Access Token** no header:

```bash
Authorization: Bearer <ACCESS_TOKEN>
```

### Tipos de Token

| Tipo | Duração | Uso |
|------|---------|-----|
| **User Access Token** | Temporário | Desenvolvimento/Testes |
| **System User Token** | Permanente | Produção |

---

## Endpoint Base

```
POST https://graph.facebook.com/v24.0/<PHONE_NUMBER_ID>/messages
```

**Headers obrigatórios:**
```
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

---

## Envio de Mensagens

### Estrutura Comum do Payload

Toda mensagem segue esta estrutura base:

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<PHONE_NUMBER>",
  "type": "<MESSAGE_TYPE>",
  "<MESSAGE_TYPE>": { ... }
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `messaging_product` | string | ✅ | Sempre `"whatsapp"` |
| `recipient_type` | string | ❌ | `"individual"` (padrão) |
| `to` | string | ✅ | Número do destinatário (E.164) |
| `type` | string | ✅ | Tipo da mensagem |
| `context` | object | ❌ | Para responder a uma mensagem |

### Resposta de Sucesso

```json
{
  "messaging_product": "whatsapp",
  "contacts": [
    {
      "input": "+5511999999999",
      "wa_id": "5511999999999"
    }
  ],
  "messages": [
    {
      "id": "wamid.HBgLMTY0NjcwNDM1OTUVAgARGBI1RjQyNUE3NEYxMzAzMzQ5MkEA"
    }
  ]
}
```

---

### Mensagens de Texto

```json
{
  "messaging_product": "whatsapp",
  "to": "+5511999999999",
  "type": "text",
  "text": {
    "preview_url": true,
    "body": "Olá! Esta é uma mensagem de texto."
  }
}
```

| Campo | Tipo | Obrigatório | Limite |
|-------|------|-------------|--------|
| `body` | string | ✅ | 4096 caracteres |
| `preview_url` | boolean | ❌ | Renderiza preview de URLs |

---

### Mensagens de Mídia

#### Imagem

```json
{
  "messaging_product": "whatsapp",
  "to": "+5511999999999",
  "type": "image",
  "image": {
    "id": "<MEDIA_ID>",
    "caption": "Legenda opcional"
  }
}
```

Ou usando URL:

```json
{
  "messaging_product": "whatsapp",
  "to": "+5511999999999",
  "type": "image",
  "image": {
    "link": "https://example.com/image.jpg",
    "caption": "Legenda opcional"
  }
}
```

**Formatos suportados:** JPEG, PNG  
**Tamanho máximo:** 5MB  
**Requisitos:** 8-bit, RGB ou RGBA

---

#### Vídeo

```json
{
  "messaging_product": "whatsapp",
  "to": "+5511999999999",
  "type": "video",
  "video": {
    "id": "<MEDIA_ID>",
    "caption": "Legenda opcional"
  }
}
```

**Formatos suportados:** MP4, 3GPP  
**Tamanho máximo:** 16MB  
**Codec:** H.264 (Main profile), AAC audio  
**Nota:** H.264 "High" profile com B-frames não é suportado em Android

---

#### Áudio

```json
{
  "messaging_product": "whatsapp",
  "to": "+5511999999999",
  "type": "audio",
  "audio": {
    "id": "<MEDIA_ID>"
  }
}
```

**Formatos suportados:** AAC, MP4, MPEG, AMR, OGG (Opus)  
**Tamanho máximo:** 16MB

---

#### Documento

```json
{
  "messaging_product": "whatsapp",
  "to": "+5511999999999",
  "type": "document",
  "document": {
    "id": "<MEDIA_ID>",
    "filename": "documento.pdf",
    "caption": "Descrição opcional"
  }
}
```

**Formatos suportados:** PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT  
**Tamanho máximo:** 100MB

---

#### Sticker

```json
{
  "messaging_product": "whatsapp",
  "to": "+5511999999999",
  "type": "sticker",
  "sticker": {
    "id": "<MEDIA_ID>"
  }
}
```

**Formato:** WebP  
**Dimensões:** 512x512 pixels  
**Tamanho máximo:** 500KB (estático), 100KB (animado)

---

#### Localização

```json
{
  "messaging_product": "whatsapp",
  "to": "+5511999999999",
  "type": "location",
  "location": {
    "latitude": "-23.5505",
    "longitude": "-46.6333",
    "name": "São Paulo",
    "address": "Av. Paulista, 1000, São Paulo - SP"
  }
}
```

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `latitude` | string | ✅ |
| `longitude` | string | ✅ |
| `name` | string | ❌ |
| `address` | string | ❌ |

---

#### Contatos

```json
{
  "messaging_product": "whatsapp",
  "to": "+5511999999999",
  "type": "contacts",
  "contacts": [
    {
      "name": {
        "formatted_name": "João Silva",
        "first_name": "João",
        "last_name": "Silva"
      },
      "phones": [
        {
          "phone": "+5511999999999",
          "type": "CELL"
        }
      ],
      "emails": [
        {
          "email": "joao@example.com",
          "type": "WORK"
        }
      ],
      "org": {
        "company": "Empresa XYZ",
        "title": "Gerente"
      }
    }
  ]
}
```

---

### Mensagens Interativas

#### Botões de Resposta Rápida (Reply Buttons)

```json
{
  "messaging_product": "whatsapp",
  "to": "+5511999999999",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "header": {
      "type": "text",
      "text": "Título opcional"
    },
    "body": {
      "text": "Escolha uma opção:"
    },
    "footer": {
      "text": "Rodapé opcional"
    },
    "action": {
      "buttons": [
        {
          "type": "reply",
          "reply": {
            "id": "btn_1",
            "title": "Opção 1"
          }
        },
        {
          "type": "reply",
          "reply": {
            "id": "btn_2",
            "title": "Opção 2"
          }
        },
        {
          "type": "reply",
          "reply": {
            "id": "btn_3",
            "title": "Opção 3"
          }
        }
      ]
    }
  }
}
```

**Limite:** Máximo 3 botões  
**Título do botão:** Máximo 20 caracteres

---

#### Lista (List Message)

```json
{
  "messaging_product": "whatsapp",
  "to": "+5511999999999",
  "type": "interactive",
  "interactive": {
    "type": "list",
    "header": {
      "type": "text",
      "text": "Nosso Menu"
    },
    "body": {
      "text": "Selecione uma categoria:"
    },
    "footer": {
      "text": "Powered by SmartZap"
    },
    "action": {
      "button": "Ver Opções",
      "sections": [
        {
          "title": "Categoria 1",
          "rows": [
            {
              "id": "item_1",
              "title": "Item 1",
              "description": "Descrição do item 1"
            },
            {
              "id": "item_2",
              "title": "Item 2",
              "description": "Descrição do item 2"
            }
          ]
        },
        {
          "title": "Categoria 2",
          "rows": [
            {
              "id": "item_3",
              "title": "Item 3",
              "description": "Descrição do item 3"
            }
          ]
        }
      ]
    }
  }
}
```

**Limites:**
- Máximo 10 seções
- Máximo 10 itens por seção
- Título da seção: 24 caracteres
- Título do item: 24 caracteres
- Descrição do item: 72 caracteres

---

#### CTA URL Button

```json
{
  "messaging_product": "whatsapp",
  "to": "+5511999999999",
  "type": "interactive",
  "interactive": {
    "type": "cta_url",
    "header": {
      "type": "text",
      "text": "Confira nossa loja!"
    },
    "body": {
      "text": "Acesse nossa loja online para ver as novidades."
    },
    "footer": {
      "text": "Frete grátis acima de R$100"
    },
    "action": {
      "name": "cta_url",
      "parameters": {
        "display_text": "Visitar Loja",
        "url": "https://www.example.com/loja"
      }
    }
  }
}
```

---

#### Carrossel de Mídia (Media Carousel)

```json
{
  "messaging_product": "whatsapp",
  "to": "+5511999999999",
  "type": "interactive",
  "interactive": {
    "type": "carousel",
    "body": {
      "text": "Confira nossos produtos em destaque!"
    },
    "action": {
      "cards": [
        {
          "card_index": 0,
          "type": "cta_url",
          "header": {
            "type": "image",
            "image": {
              "link": "https://example.com/produto1.jpg"
            }
          },
          "body": {
            "text": "Produto 1 - R$ 99,90"
          },
          "action": {
            "name": "cta_url",
            "parameters": {
              "display_text": "Comprar",
              "url": "https://example.com/produto1"
            }
          }
        },
        {
          "card_index": 1,
          "type": "cta_url",
          "header": {
            "type": "image",
            "image": {
              "link": "https://example.com/produto2.jpg"
            }
          },
          "body": {
            "text": "Produto 2 - R$ 149,90"
          },
          "action": {
            "name": "cta_url",
            "parameters": {
              "display_text": "Comprar",
              "url": "https://example.com/produto2"
            }
          }
        }
      ]
    }
  }
}
```

**Limites:**
- Mínimo 2 cards, máximo 10 cards
- Header pode ser `image` ou `video`

---

#### Carrossel de Produtos (E-commerce)

```json
{
  "messaging_product": "whatsapp",
  "to": "+5511999999999",
  "type": "interactive",
  "interactive": {
    "type": "carousel",
    "body": {
      "text": "Confira nossos produtos!"
    },
    "action": {
      "cards": [
        {
          "card_index": 0,
          "type": "product",
          "action": {
            "product_retailer_id": "abc123xyz",
            "catalog_id": "123456789"
          }
        },
        {
          "card_index": 1,
          "type": "product",
          "action": {
            "product_retailer_id": "def456uvw",
            "catalog_id": "123456789"
          }
        }
      ]
    }
  }
}
```

**Requisito:** Catálogo de produtos configurado no Meta Business

---

#### Solicitação de Localização (Location Request)

```json
{
  "messaging_product": "whatsapp",
  "to": "+5511999999999",
  "type": "interactive",
  "interactive": {
    "type": "location_request_message",
    "body": {
      "text": "Por favor, compartilhe sua localização para entregarmos seu pedido."
    },
    "action": {
      "name": "send_location"
    }
  }
}
```

---

#### Mensagem de Endereço (Apenas Índia)

```json
{
  "messaging_product": "whatsapp",
  "to": "+91xxxxxxxxxx",
  "type": "interactive",
  "interactive": {
    "type": "address_message",
    "body": {
      "text": "Obrigado pelo pedido! Informe o endereço de entrega."
    },
    "action": {
      "name": "address_message",
      "parameters": {
        "country": "IN"
      }
    }
  }
}
```

---

### Mensagens de Template

Templates são mensagens pré-aprovadas que podem ser enviadas fora da janela de atendimento (24h).

#### Estrutura Básica

```json
{
  "messaging_product": "whatsapp",
  "to": "+5511999999999",
  "type": "template",
  "template": {
    "name": "nome_do_template",
    "language": {
      "code": "pt_BR"
    },
    "components": [
      {
        "type": "header",
        "parameters": [...]
      },
      {
        "type": "body",
        "parameters": [...]
      }
    ]
  }
}
```

#### Template com Parâmetros Nomeados

```json
{
  "messaging_product": "whatsapp",
  "to": "+5511999999999",
  "type": "template",
  "template": {
    "name": "confirmacao_pedido",
    "language": {
      "code": "pt_BR"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "parameter_name": "nome_cliente",
            "text": "João"
          },
          {
            "type": "text",
            "parameter_name": "numero_pedido",
            "text": "12345"
          }
        ]
      }
    ]
  }
}
```

#### Template com Header de Mídia

```json
{
  "messaging_product": "whatsapp",
  "to": "+5511999999999",
  "type": "template",
  "template": {
    "name": "promocao_black_friday",
    "language": {
      "code": "pt_BR"
    },
    "components": [
      {
        "type": "header",
        "parameters": [
          {
            "type": "image",
            "image": {
              "id": "<MEDIA_ID>"
            }
          }
        ]
      },
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "text": "50%"
          }
        ]
      }
    ]
  }
}
```

#### Template com Header de Localização

```json
{
  "messaging_product": "whatsapp",
  "to": "+5511999999999",
  "type": "template",
  "template": {
    "name": "atualizacao_entrega",
    "language": {
      "code": "pt_BR"
    },
    "components": [
      {
        "type": "header",
        "parameters": [
          {
            "type": "location",
            "location": {
              "latitude": "-23.5505",
              "longitude": "-46.6333",
              "name": "Centro de Distribuição",
              "address": "Rua das Flores, 123"
            }
          }
        ]
      }
    ]
  }
}
```

---

### Mensagens de Reação

Reações são emojis aplicados a mensagens recebidas.

```json
{
  "messaging_product": "whatsapp",
  "to": "+5511999999999",
  "type": "reaction",
  "reaction": {
    "message_id": "wamid.HBgLMTY0NjcwNDM1OTUVAgASGBQzQUZCMTY0MDc2MUYwNzBDNTY5MAA=",
    "emoji": "👍"
  }
}
```

**Para remover reação:** Envie com `emoji` como string vazia `""`

**Limitação:** Apenas webhook `sent` é disparado (não `delivered` ou `read`)

---

## API de Mídia

### Upload de Mídia

```bash
curl 'https://graph.facebook.com/v24.0/<PHONE_NUMBER_ID>/media' \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -F 'messaging_product=whatsapp' \
  -F 'file=@/path/to/file.jpg;type=image/jpeg'
```

**Resposta:**
```json
{
  "id": "1037543291543636"
}
```

### Obter URL da Mídia

```bash
curl 'https://graph.facebook.com/v24.0/<MEDIA_ID>?phone_number_id=<PHONE_NUMBER_ID>' \
  -H 'Authorization: Bearer <ACCESS_TOKEN>'
```

**Resposta:**
```json
{
  "messaging_product": "whatsapp",
  "url": "<MEDIA_URL>",
  "mime_type": "image/jpeg",
  "sha256": "<SHA256_HASH>",
  "file_size": "12345",
  "id": "<MEDIA_ID>"
}
```

**Nota:** URL expira em 5 minutos

### Download de Mídia

```bash
curl '<MEDIA_URL>' \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -o 'arquivo_baixado.jpg'
```

### Excluir Mídia

```bash
curl -X DELETE 'https://graph.facebook.com/v24.0/<MEDIA_ID>?phone_number_id=<PHONE_NUMBER_ID>' \
  -H 'Authorization: Bearer <ACCESS_TOKEN>'
```

### Limites de Mídia

| Tipo | Formatos | Tamanho Máximo |
|------|----------|----------------|
| **Imagem** | JPEG, PNG | 5MB |
| **Vídeo** | MP4, 3GPP | 16MB |
| **Áudio** | AAC, MP4, MPEG, AMR, OGG | 16MB |
| **Documento** | PDF, DOC, DOCX, etc. | 100MB |
| **Sticker** | WebP | 500KB (estático), 100KB (animado) |

**Nota:** IDs de mídia da API expiram em 30 dias. IDs de mídia de webhooks expiram em 7 dias.

---

## Templates

### Categorias

| Categoria | Uso | Preço |
|-----------|-----|-------|
| **MARKETING** | Promoções, novidades | Mais caro |
| **UTILITY** | Confirmações, atualizações | Médio |
| **AUTHENTICATION** | Códigos OTP, verificação | Mais barato |

### Criar Template

```bash
curl 'https://graph.facebook.com/v24.0/<WABA_ID>/message_templates' \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "promocao_verao",
    "language": "pt_BR",
    "category": "MARKETING",
    "parameter_format": "named",
    "components": [
      {
        "type": "HEADER",
        "format": "TEXT",
        "text": "Promoção de {{estacao}}!",
        "example": {
          "header_text_named_params": [
            {
              "param_name": "estacao",
              "example": "Verão"
            }
          ]
        }
      },
      {
        "type": "BODY",
        "text": "Olá {{nome}}! Aproveite {{desconto}} de desconto.",
        "example": {
          "body_text_named_params": [
            {
              "param_name": "nome",
              "example": "João"
            },
            {
              "param_name": "desconto",
              "example": "20%"
            }
          ]
        }
      },
      {
        "type": "FOOTER",
        "text": "Válido até o final do mês"
      },
      {
        "type": "BUTTONS",
        "buttons": [
          {
            "type": "QUICK_REPLY",
            "text": "Quero saber mais"
          },
          {
            "type": "URL",
            "text": "Ver ofertas",
            "url": "https://loja.com/ofertas"
          }
        ]
      }
    ]
  }'
```

### Componentes de Template

#### Header (Cabeçalho)

| Tipo | Formato | Descrição |
|------|---------|-----------|
| TEXT | `"format": "TEXT"` | Texto (1 parâmetro) |
| IMAGE | `"format": "IMAGE"` | Imagem |
| VIDEO | `"format": "VIDEO"` | Vídeo |
| DOCUMENT | `"format": "DOCUMENT"` | Documento |
| LOCATION | `"format": "LOCATION"` | Localização |

#### Body (Corpo)

Texto principal com suporte a múltiplos parâmetros.  
**Limite:** 1024 caracteres

#### Footer (Rodapé)

Texto opcional no final.  
**Limite:** 60 caracteres

#### Buttons (Botões)

| Tipo | Limite | Descrição |
|------|--------|-----------|
| QUICK_REPLY | 10 | Resposta rápida |
| URL | 2 | Abre URL |
| PHONE_NUMBER | 1 | Liga para número |
| COPY_CODE | 1 | Copia código |

### Status de Templates

| Status | Descrição |
|--------|-----------|
| `APPROVED` | Aprovado e pronto para uso |
| `PENDING` | Em análise |
| `REJECTED` | Rejeitado |
| `PAUSED` | Pausado por baixa qualidade |
| `DISABLED` | Desabilitado permanentemente |

### Limites

- 250 templates por WABA (não verificado)
- 6000 templates por WABA (verificado)
- 100 criações por hora

---

## Webhooks

### Configuração

1. Crie um endpoint HTTPS
2. Responda ao desafio de verificação
3. Configure no App Dashboard
4. Inscreva-se nos campos desejados

### Verificação do Webhook

Seu endpoint deve responder ao `GET` com o `hub.challenge`:

```javascript
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});
```

### Payload de Mensagem Recebida

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "<WABA_ID>",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15550783881",
              "phone_number_id": "106540352242922"
            },
            "contacts": [
              {
                "profile": {
                  "name": "Cliente"
                },
                "wa_id": "5511999999999"
              }
            ],
            "messages": [
              {
                "from": "5511999999999",
                "id": "wamid.xxx",
                "timestamp": "1749416383",
                "type": "text",
                "text": {
                  "body": "Olá!"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

### Status de Mensagem

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "<WABA_ID>",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15550783881",
              "phone_number_id": "106540352242922"
            },
            "statuses": [
              {
                "id": "wamid.xxx",
                "status": "delivered",
                "timestamp": "1749416383",
                "recipient_id": "5511999999999"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

### Status Possíveis

| Status | Descrição |
|--------|-----------|
| `sent` | Enviada ao servidor WhatsApp |
| `delivered` | Entregue ao dispositivo |
| `read` | Lida pelo usuário |
| `failed` | Falha no envio |

### Campos de Webhook

| Campo | Descrição |
|-------|-----------|
| `messages` | Mensagens e status |
| `message_template_status_update` | Mudanças em templates |
| `business_capability_update` | Capacidades da conta |
| `account_review_update` | Status de revisão |
| `phone_number_quality_update` | Qualidade do número |

### Configurações

- **Tamanho máximo do payload:** 3MB
- **Retry:** Até 7 dias com backoff exponencial
- **mTLS:** Suportado para segurança adicional

---

## Números de Telefone

### Verificar Número

#### Solicitar Código

```bash
curl -X POST 'https://graph.facebook.com/v24.0/<PHONE_NUMBER_ID>/request_code?code_method=SMS&language=pt_BR' \
  -H 'Authorization: Bearer <ACCESS_TOKEN>'
```

#### Verificar Código

```bash
curl -X POST 'https://graph.facebook.com/v24.0/<PHONE_NUMBER_ID>/verify_code' \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -F 'code=123456'
```

### Listar Números

```bash
curl 'https://graph.facebook.com/v24.0/<WABA_ID>/phone_numbers' \
  -H 'Authorization: Bearer <ACCESS_TOKEN>'
```

**Resposta:**
```json
{
  "data": [
    {
      "verified_name": "Minha Empresa",
      "display_phone_number": "+55 11 99999-9999",
      "id": "106540352242922",
      "quality_rating": "GREEN"
    }
  ]
}
```

### Obter Status do Número

```bash
curl 'https://graph.facebook.com/v24.0/<PHONE_NUMBER_ID>?fields=status,quality_rating' \
  -H 'Authorization: Bearer <ACCESS_TOKEN>'
```

### Quality Ratings

| Rating | Descrição |
|--------|-----------|
| `GREEN` | Alta qualidade |
| `YELLOW` | Qualidade média (atenção) |
| `RED` | Baixa qualidade (risco de restrição) |
| `NA` | Sem dados suficientes |

### Limites de Números

- 2 números por portfólio (não verificado)
- 20 números por portfólio (verificado ou tier 2000+)

---

## Códigos de Erro

### Estrutura de Erro

```json
{
  "error": {
    "message": "(#130429) Rate limit hit",
    "type": "OAuthException",
    "code": 130429,
    "error_data": {
      "messaging_product": "whatsapp",
      "details": "Cloud API message throughput has been reached."
    },
    "error_subcode": 2494055,
    "fbtrace_id": "Az8or2yhqkZfEZ-_4Qn_Bam"
  }
}
```

### Erros Comuns

| Código | Descrição | Ação |
|--------|-----------|------|
| **131042** | Problema de pagamento | Verificar método de pagamento |
| **131047** | Mais de 24h desde última mensagem | Usar template |
| **131051** | Tipo de mensagem não suportado | Verificar formato |
| **131052** | Arquivo muito grande | Reduzir tamanho |
| **131053** | MIME type incorreto | Verificar extensão |
| **131056** | Rate limit par (1 msg/6s) | Aguardar intervalo |
| **130429** | Rate limit throughput | Aguardar e retry |
| **133010** | Número não registrado no WhatsApp | Verificar número |
| **135000** | Usuário bloqueou negócio | Não reenviar |

### Categorias de Erro

| Categoria | Códigos | Descrição |
|-----------|---------|-----------|
| **Autorização** | 0, 3, 10 | Problemas com token/permissão |
| **Rate Limit** | 4, 130429 | Limite de taxa excedido |
| **Template** | 132xxx | Erros de template |
| **Pagamento** | 131042 | Problemas de cobrança |
| **Mídia** | 131052, 131053 | Erros de arquivo |

---

## Rate Limits

### Throughput

| Tier | Mensagens/segundo |
|------|-------------------|
| Standard | 80 msgs/s |
| High | 250 msgs/s |
| Enterprise | 1000 msgs/s |

### Pair Rate Limit

**1 mensagem a cada 6 segundos** para o mesmo par (número de origem → número de destino).

Erro: `131056`

### Message Limits (Tier System)

| Tier | Mensagens Únicas/24h |
|------|---------------------|
| Não verificado | 250 |
| Tier 1 | 1.000 |
| Tier 2 | 10.000 |
| Tier 3 | 100.000 |
| Tier 4 | Ilimitado |

### Boas Práticas

1. **Exponential Backoff**: Ao receber erro 429, aguarde 2^n segundos
2. **Batch Processing**: Agrupe envios com intervalo de 100ms
3. **Monitor Quality**: Mantenha quality rating GREEN
4. **Use Webhooks**: Não faça polling para status

---

## Funcionalidades Avançadas

### Janela de Atendimento ao Cliente (24h)

Quando você recebe uma mensagem ou ligação de um usuário do WhatsApp, uma **janela de atendimento de 24 horas** é aberta.

| Situação | O que pode enviar |
|----------|-------------------|
| **Janela aberta** (< 24h) | Qualquer tipo de mensagem |
| **Janela fechada** (> 24h) | Apenas mensagens de template |

**Importante:** 
- Só é possível enviar mensagens a usuários que aceitaram (opt-in) receber suas mensagens
- A janela é atualizada (renovada) a cada nova mensagem recebida do usuário

---

### Confirmações de Leitura

Marcar mensagens como lidas exibe dois tiques azuis abaixo da mensagem do usuário.

```bash
curl 'https://graph.facebook.com/v24.0/<PHONE_NUMBER_ID>/messages' \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "messaging_product": "whatsapp",
    "status": "read",
    "message_id": "wamid.HBgLMTY0NjcwNDM1OTUVAgASGBQzQUZCMTY0MDc2MUYwNzBDNTY5MAA="
  }'
```

---

### Indicadores de Digitação

Mostra ao usuário que você está digitando uma resposta.

```bash
curl 'https://graph.facebook.com/v24.0/<PHONE_NUMBER_ID>/messages' \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "+5511999999999",
    "type": "typing",
    "typing": {
      "action": "typing_on"
    }
  }'
```

**Valores de action:**
- `typing_on` - Mostra "digitando..."
- `typing_off` - Remove o indicador

---

### Respostas Contextuais

Responder citando uma mensagem anterior em um balão de contexto:

```json
{
  "messaging_product": "whatsapp",
  "to": "+5511999999999",
  "type": "text",
  "context": {
    "message_id": "wamid.HBgLMTY0NjcwNDM1OTUVAgASGBQzQUZCMTY0MDc2MUYwNzBDNTY5MAA="
  },
  "text": {
    "body": "Sim, confirmado! Obrigado pela preferência."
  }
}
```

---

### Cache de Mídia

Quando você usa um `link` (URL) para um ativo de mídia em vez de `id`, a API de Nuvem armazena em cache o ativo por **10 minutos**.

**Comportamento:**
1. 1ª requisição: Ativo baixado do seu servidor e cacheado
2. Requisições subsequentes (< 10 min): Usa cache
3. Após 10 min: Baixa novamente

**Para forçar atualização (evitar cache):**
```
https://example.com/image.jpg?v=123456
```

Adicionar uma query string única faz a API tratar como um novo ativo.

---

### Tempo de Vida (TTL)

Se uma mensagem não puder ser entregue, o sistema faz novas tentativas por um período conhecido como TTL (Time To Live).

#### TTL Padrão

| Tipo de Mensagem | TTL |
|------------------|-----|
| Mensagens normais | 30 dias |
| Templates de autenticação | 10 minutos |

#### TTL Customizado (Templates)

Você pode customizar o TTL para templates de autenticação e utilidade:

```json
{
  "messaging_product": "whatsapp",
  "to": "+5511999999999",
  "type": "template",
  "template": {
    "name": "codigo_verificacao",
    "language": { "code": "pt_BR" }
  },
  "ttl": "60"
}
```

**Valores permitidos:** 60 a 600 segundos (1 a 10 minutos) para autenticação.

#### Quando TTL Expira

- Mensagem é descartada (não entregue)
- Você **não** receberá webhook `delivered`
- Recomenda-se implementar lógica de timeout no seu sistema

---

### Qualidade da Mensagem

A qualidade é baseada no feedback dos usuários nos últimos **7 dias**.

#### Fatores Negativos

- Bloqueios
- Denúncias
- Silenciamentos
- Arquivamentos

#### Boas Práticas

| ✅ Fazer | ❌ Evitar |
|----------|----------|
| Mensagens personalizadas | Mensagens genéricas |
| Conteúdo útil e relevante | Spam e promoções excessivas |
| Respeitar opt-in | Enviar sem consentimento |
| Frequência moderada | Muitas mensagens/dia |
| Conteúdo otimizado | Mensagens muito longas |

---

### Formato de Números de Telefone

| Formato de Envio | Resultado |
|------------------|-----------|
| `+5511999999999` | ✅ Correto (E.164 completo) |
| `5511999999999` | ⚠️ Prefixo do seu país adicionado |
| `11999999999` | ⚠️ Prefixo do seu país adicionado |

**Recomendação:** Sempre use o formato E.164 completo com `+` e código do país.

**Nota para Brasil/México:** O prefixo extra do número pode ser modificado pela Cloud API (comportamento padrão).

---

### Sequência de Entrega

⚠️ **Importante:** Múltiplas mensagens podem **não ser entregues na ordem** em que foram enviadas.

**Para garantir ordem:**
1. Envie mensagem 1
2. Aguarde webhook com `status: delivered`
3. Envie mensagem 2
4. Repita o processo

---

### Grupos (Beta)

Envio para grupos usa `recipient_type: "group"`:

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "group",
  "to": "<GROUP_ID>",
  "type": "text",
  "text": {
    "body": "Mensagem para o grupo"
  }
}
```

**Resposta inclui `group_id`:**
```json
{
  "messages": [
    {
      "id": "wamid.xxx",
      "group_id": "<GROUP_ID>"
    }
  ]
}
```

---

---

## APIs Adicionais

As seguintes APIs estão documentadas para referência futura. Algumas podem ser implementadas no SmartZap conforme a necessidade do produto.

---

### API de Grupos (Groups API)

> **Status:** 🔮 Futuro (possível feature)  
> **Requisitos:** Conta com limite de 100k+ mensagens + Official Business Account (OBA)

A Groups API permite criar e gerenciar grupos do WhatsApp via API.

#### Limitações

| Limite | Valor |
|--------|-------|
| Máximo de participantes por grupo | 8 |
| Máximo de grupos por número | 10.000 |
| Máximo de empresas por grupo | 1 |

#### Tipos de Mensagem Suportados em Grupos

- ✅ Texto
- ✅ Mídia (imagem, vídeo, áudio, documento)
- ✅ Templates de texto
- ✅ Templates de mídia

#### Tipos de Mensagem NÃO Suportados

- ❌ Chamadas
- ❌ Mensagens efêmeras (view once)
- ❌ Templates de autenticação
- ❌ Mensagens de comércio/catálogo
- ❌ Mensagens interativas (botões, listas)

#### Criar Grupo

```bash
POST /<BUSINESS_PHONE_NUMBER_ID>/groups
```

```json
{
  "messaging_product": "whatsapp",
  "subject": "Nome do Grupo",
  "description": "Descrição do grupo",
  "join_approval_mode": "ON"
}
```

**Valores de `join_approval_mode`:**
- `ON`: Requer aprovação para entrar
- `OFF`: Entrada imediata via link

**Resposta:** Webhook `group_lifecycle_update` com `invite_link`

#### Obter Link de Convite

```bash
GET /<GROUP_ID>/invite_link
```

**Resposta:**
```json
{
  "messaging_product": "whatsapp",
  "invite_link": "https://chat.whatsapp.com/<LINK_ID>"
}
```

#### Resetar Link de Convite

```bash
POST /<GROUP_ID>/invite_link
```

```json
{
  "messaging_product": "whatsapp"
}
```

> ⚠️ Links anteriores ficam inválidos após reset.

#### Enviar Mensagem para Grupo

```bash
POST /<BUSINESS_PHONE_NUMBER_ID>/messages
```

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "group",
  "to": "<GROUP_ID>",
  "type": "text",
  "text": {
    "preview_url": true,
    "body": "Mensagem para o grupo com link: https://exemplo.com"
  }
}
```

#### Receber Mensagens de Grupo

Webhook com `group_id` no objeto `messages`:

```json
{
  "messages": [{
    "from": "<PHONE_NUMBER>",
    "group_id": "<GROUP_ID>",
    "id": "wamid.xxx",
    "timestamp": "1671644824",
    "text": { "body": "Mensagem do participante" },
    "type": "text"
  }]
}
```

#### Fixar/Desafixar Mensagem

```bash
POST /<BUSINESS_PHONE_NUMBER_ID>/messages
```

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "group",
  "to": "<GROUP_ID>",
  "type": "pin",
  "pin": {
    "type": "pin",
    "message_id": "<MESSAGE_ID>",
    "expiration_days": 7
  }
}
```

**Limites:**
- Máximo 3 mensagens fixadas simultaneamente
- Apenas admin pode fixar/desafixar

#### Remover Participantes

```bash
DELETE /<GROUP_ID>/participants
```

```json
{
  "messaging_product": "whatsapp",
  "participants": [
    { "user": "+5511999999999" },
    { "user": "+5511888888888" }
  ]
}
```

> ⚠️ Participantes removidos não podem mais entrar via link de convite.

#### Deletar Grupo

```bash
DELETE /<GROUP_ID>
```

Remove todos os participantes e deleta o grupo.

#### Obter Informações do Grupo

```bash
GET /<GROUP_ID>?fields=subject,description,participants,total_participant_count,creation_timestamp,suspended,join_approval_mode
```

**Resposta:**
```json
{
  "messaging_product": "whatsapp",
  "id": "<GROUP_ID>",
  "subject": "Nome do Grupo",
  "description": "Descrição",
  "total_participant_count": 5,
  "participants": [
    { "wa_id": "5511999999999" },
    { "wa_id": "5511888888888" }
  ],
  "creation_timestamp": "1671644824",
  "suspended": false,
  "join_approval_mode": "ON"
}
```

#### Listar Grupos Ativos

```bash
GET /<BUSINESS_PHONE_NUMBER_ID>/groups?limit=25
```

**Resposta:**
```json
{
  "data": {
    "groups": [
      { "id": "GROUP_ID_1", "subject": "Grupo 1", "created_at": "1671644824" },
      { "id": "GROUP_ID_2", "subject": "Grupo 2", "created_at": "1671644900" }
    ]
  },
  "paging": {
    "cursors": { "after": "xxx", "before": "yyy" }
  }
}
```

#### Webhooks de Grupos

Inscrever-se nos seguintes campos:
- `group_lifecycle_update` - Criação/deleção de grupos
- `group_participants_update` - Entrada/saída de participantes
- `group_settings_update` - Alterações de configuração
- `group_status_update` - Status do grupo

---

### API de Bloqueio de Usuários (Block Users API)

> **Status:** 🔮 Futuro (útil para opt-out)  
> **Limite de blocklist:** 64.000 usuários

Permite bloquear usuários que enviaram spam ou solicitaram opt-out.

#### Limitações

- Só pode bloquear usuários que enviaram mensagem nas **últimas 24 horas**
- Limite de 64k usuários bloqueados

#### Bloquear Usuários

```bash
POST /<PHONE_NUMBER_ID>/block_users
```

```json
{
  "messaging_product": "whatsapp",
  "block_users": [
    { "user": "+5511999999999" },
    { "user": "+5511888888888" }
  ]
}
```

**Resposta de sucesso:**
```json
{
  "messaging_product": "whatsapp",
  "block_users": {
    "added_users": [
      { "input": "+5511999999999", "wa_id": "5511999999999" }
    ]
  }
}
```

**Resposta parcial (alguns falharam):**
```json
{
  "messaging_product": "whatsapp",
  "block_users": {
    "added_users": [
      { "input": "+5511999999999", "wa_id": "5511999999999" }
    ],
    "failed_users": [
      { 
        "input": "+5511888888888",
        "errors": [{
          "code": 139100,
          "message": "Failed to block user"
        }]
      }
    ]
  }
}
```

#### Desbloquear Usuários

```bash
DELETE /<PHONE_NUMBER_ID>/block_users
```

```json
{
  "messaging_product": "whatsapp",
  "block_users": [
    { "user": "+5511999999999" }
  ]
}
```

#### Listar Usuários Bloqueados

```bash
GET /<PHONE_NUMBER_ID>/block_users?limit=25
```

**Resposta:**
```json
{
  "data": [{
    "block_users": [
      { "input": "+5511999999999", "wa_id": "5511999999999" }
    ]
  }],
  "paging": {
    "cursors": { "after": "xxx", "before": "yyy" }
  }
}
```

#### Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 139100 | Falha ao bloquear/desbloquear |
| 139102 | Blocklist atualizada durante consulta (retry necessário) |

#### Comportamento ao Bloquear

- O usuário **não pode** contatar seu negócio
- Seu negócio **não pode** enviar mensagens ao usuário
- O usuário **não vê** que você está online
- Não é possível bloquear outro WhatsApp Business

---

### API de Comércio (E-commerce/Catalog)

> **Status:** 🔮 Futuro  
> **Requisito:** Catálogo de e-commerce conectado à WABA

Permite enviar mensagens com produtos do catálogo.

#### Mensagem de Catálogo Completo

```bash
POST /<PHONE_NUMBER_ID>/messages
```

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "+5511999999999",
  "type": "interactive",
  "interactive": {
    "type": "catalog_message",
    "body": {
      "text": "Confira nosso catálogo de produtos!"
    },
    "action": {
      "name": "catalog_message",
      "parameters": {
        "thumbnail_product_retailer_id": "SKU123"
      }
    },
    "footer": {
      "text": "Melhores ofertas do WhatsApp!"
    }
  }
}
```

#### Link do Catálogo

Monte um link wa.me para o catálogo:

```
https://wa.me/c/5511999999999
```

Envie como mensagem de texto com `preview_url: true`.

#### Mensagem de Produto Único (Single-Product)

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "+5511999999999",
  "type": "interactive",
  "interactive": {
    "type": "product",
    "body": {
      "text": "Produto recomendado para você!"
    },
    "footer": {
      "text": "Oferta por tempo limitado"
    },
    "action": {
      "catalog_id": "123456789",
      "product_retailer_id": "SKU123"
    }
  }
}
```

#### Mensagem Multi-Produto (Multi-Product)

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "+5511999999999",
  "type": "interactive",
  "interactive": {
    "type": "product_list",
    "header": {
      "type": "text",
      "text": "Nossos Destaques"
    },
    "body": {
      "text": "Veja os produtos mais vendidos!"
    },
    "footer": {
      "text": "Entrega grátis acima de R$100"
    },
    "action": {
      "catalog_id": "123456789",
      "sections": [
        {
          "title": "Eletrônicos",
          "product_items": [
            { "product_retailer_id": "SKU001" },
            { "product_retailer_id": "SKU002" }
          ]
        },
        {
          "title": "Acessórios",
          "product_items": [
            { "product_retailer_id": "SKU003" },
            { "product_retailer_id": "SKU004" }
          ]
        }
      ]
    }
  }
}
```

#### Comportamento do Carrinho

- Único por thread de conversa
- **Não sincroniza** entre dispositivos do usuário
- Sem data de expiração
- Máximo 99 unidades por item
- Sem limite de itens distintos

#### Receber Pedidos (Webhook)

O usuário pode adicionar itens ao carrinho e enviar. O webhook retorna o carrinho:

```json
{
  "messages": [{
    "type": "order",
    "order": {
      "catalog_id": "123456789",
      "product_items": [
        {
          "product_retailer_id": "SKU001",
          "quantity": 2,
          "item_price": 5000,
          "currency": "BRL"
        }
      ]
    }
  }]
}
```

---

### API de Chamadas (Calling API)

> **Status:** ❌ Fora do Escopo  
> **Requisito:** Limite de 2.000 conversas/dia + número Cloud API (não WhatsApp Business App)

Permite fazer e receber chamadas de voz via WhatsApp.

#### Disponibilidade

**Chamadas iniciadas pelo usuário:** Todos os países com Cloud API

**Chamadas iniciadas pela empresa:** Não disponível em:
- Estados Unidos
- Canadá
- Turquia
- Egito
- Vietnã
- Nigéria

#### Configurar Calling

```bash
POST /<PHONE_NUMBER_ID>/settings
```

```json
{
  "calling": {
    "status": "ENABLED",
    "call_icon_visibility": "DEFAULT",
    "callback_permission_status": "ENABLED",
    "call_hours": {
      "status": "ENABLED",
      "timezone_id": "America/Sao_Paulo",
      "weekly_operating_hours": [
        {
          "day_of_week": "MONDAY",
          "open_time": "0900",
          "close_time": "1800"
        },
        {
          "day_of_week": "TUESDAY",
          "open_time": "0900",
          "close_time": "1800"
        }
      ],
      "holiday_schedule": [
        {
          "date": "2025-12-25",
          "start_time": "0000",
          "end_time": "2359"
        }
      ]
    }
  }
}
```

**Opções de `call_icon_visibility`:**
- `DEFAULT`: Botão de ligação visível
- `DISABLE_ALL`: Botão oculto (só via CTA)

#### Iniciar Chamada

Requer permissão prévia do usuário.

```bash
POST /<PHONE_NUMBER_ID>/calls
```

```json
{
  "messaging_product": "whatsapp",
  "to": "+5511999999999",
  "action": "connect",
  "session": {
    "sdp_type": "offer",
    "sdp": "<<SDP_OFFER_RFC_8866>>"
  },
  "biz_opaque_callback_data": "tracking_id_123"
}
```

**Resposta:**
```json
{
  "messaging_product": "whatsapp",
  "calls": [{
    "id": "wacid.ABGGFjFVU2AfAgo6V"
  }]
}
```

#### Aceitar Chamada (User-Initiated)

```json
{
  "messaging_product": "whatsapp",
  "call_id": "wacid.ABGGFjFVU2AfAgo6V-Hc5eCgK5Gh",
  "action": "accept",
  "session": {
    "sdp_type": "answer",
    "sdp": "<<SDP_ANSWER>>"
  }
}
```

#### Rejeitar Chamada

```json
{
  "messaging_product": "whatsapp",
  "call_id": "wacid.ABGGFjFVU2AfAgo6V-Hc5eCgK5Gh",
  "action": "reject"
}
```

#### Encerrar Chamada

```json
{
  "messaging_product": "whatsapp",
  "call_id": "wacid.ABGGFjFVU2AfAgo6V-Hc5eCgK5Gh",
  "action": "terminate"
}
```

#### Webhooks de Chamadas

**Call Connect:**
```json
{
  "calls": [{
    "id": "wacid.xxx",
    "to": "+5511999999999",
    "from": "+5511888888888",
    "event": "connect",
    "timestamp": "1671644824",
    "direction": "BUSINESS_INITIATED",
    "session": {
      "sdp_type": "answer",
      "sdp": "<<SDP>>"
    }
  }]
}
```

**Call Status:**
```json
{
  "statuses": [{
    "id": "wacid.xxx",
    "type": "call",
    "status": "RINGING|ACCEPTED|REJECTED",
    "timestamp": "1671644824",
    "recipient_id": "+5511999999999"
  }]
}
```

**Call Terminate:**
```json
{
  "calls": [{
    "id": "wacid.xxx",
    "event": "terminate",
    "status": "COMPLETED",
    "start_time": "1671644824",
    "end_time": "1671644944",
    "duration": 120
  }]
}
```

#### Limites de Chamadas (Produção)

| Limite | Valor |
|--------|-------|
| Chamadas conectadas/24h | 10 por par business+usuário |
| Pedidos de permissão/dia | 1 por par |
| Pedidos de permissão/semana | 2 por par |
| Chamadas não atendidas para revogação | 4 consecutivas |

---

### API de Pagamentos Brasil (Payments API BR)

> **Status:** ❌ Fora do Escopo (beta limitado)  
> **Métodos:** Pix, Boleto, Payment Links, Cartão (one-click)

Permite enviar cobranças diretamente pelo WhatsApp.

#### Integrações Disponíveis

| Método | Descrição |
|--------|-----------|
| **Pix Dinâmico** | Código Pix gerado por PSP |
| **Payment Links** | Links de pagamento externos |
| **Boleto** | Boleto bancário |
| **One-click Card** | Pagamento com cartão salvo |

#### Enviar Pedido (order_details)

```bash
POST /<PHONE_NUMBER_ID>/messages
```

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "+5511999999999",
  "type": "interactive",
  "interactive": {
    "type": "order_details",
    "body": {
      "text": "Seu pedido está pronto para pagamento!"
    },
    "action": {
      "name": "review_and_pay",
      "parameters": {
        "reference_id": "pedido-12345",
        "type": "digital-goods",
        "payment_type": "br",
        "payment_settings": [
          {
            "type": "payment_link",
            "payment_link": {
              "uri": "https://pagamento.exemplo.com/12345"
            }
          }
        ],
        "currency": "BRL",
        "total_amount": {
          "value": 15000,
          "offset": 100
        },
        "order": {
          "status": "pending",
          "tax": {
            "value": 0,
            "offset": 100
          },
          "items": [
            {
              "retailer_id": "PROD001",
              "name": "Camiseta M",
              "amount": {
                "value": 5000,
                "offset": 100
              },
              "quantity": 2
            },
            {
              "retailer_id": "PROD002",
              "name": "Frete",
              "amount": {
                "value": 5000,
                "offset": 100
              },
              "quantity": 1
            }
          ],
          "subtotal": {
            "value": 15000,
            "offset": 100
          }
        }
      }
    }
  }
}
```

> 💡 **Nota:** O `offset: 100` significa que o valor está em centavos. `15000` com offset 100 = R$ 150,00.

#### Atualizar Status do Pedido (order_status)

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "+5511999999999",
  "type": "interactive",
  "interactive": {
    "type": "order_status",
    "body": {
      "text": "Pagamento recebido! Seu pedido está em processamento."
    },
    "action": {
      "name": "review_order",
      "parameters": {
        "reference_id": "pedido-12345",
        "order": {
          "status": "processing"
        },
        "payment": {
          "status": "captured",
          "timestamp": 1722445231
        }
      }
    }
  }
}
```

#### Status de Pedido Suportados

| Status | Descrição |
|--------|-----------|
| `pending` | Aguardando pagamento |
| `processing` | Pagamento recebido, processando |
| `shipped` | Enviado |
| `completed` | Entregue/Finalizado |
| `canceled` | Cancelado |

#### Status de Pagamento Suportados

| Status | Descrição |
|--------|-----------|
| `pending` | Aguardando |
| `captured` | Capturado/Pago |
| `canceled` | Cancelado |
| `failed` | Falhou |

#### Fluxo Típico

1. Empresa envia `order_details` com link de pagamento
2. Cliente abre link e paga (Pix, cartão, etc.)
3. PSP notifica a empresa
4. Empresa envia `order_status` com `status: processing`
5. Após envio, atualiza para `status: shipped`
6. Após entrega, atualiza para `status: completed`

> ⚠️ **Importante:** A Meta **não faz reconciliação** de pagamentos. Use o `reference_id` para reconciliar com seu PSP.

---

### Resumo de Relevância para SmartZap

| API | Prioridade | Justificativa |
|-----|------------|---------------|
| **Grupos** | 🟡 Média | Possível feature para campanhas em grupos |
| **Bloquear Usuários** | 🟢 Alta | Útil para gerenciar opt-out automaticamente |
| **E-commerce** | 🟡 Média | Se clientes tiverem catálogo |
| **Calling** | 🔴 Baixa | Fora do escopo de automação de mensagens |
| **Pagamentos** | 🔴 Baixa | Beta limitado, complexidade alta |

---

## Referências Oficiais

- [WhatsApp Cloud API Overview](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Send Messages Guide](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages)
- [Messages Reference](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages)
- [Media Reference](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media)
- [Templates](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates)
- [Webhooks Reference](https://developers.facebook.com/docs/whatsapp/webhooks/reference)
- [Error Codes](https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes)
- [Phone Numbers](https://developers.facebook.com/docs/whatsapp/cloud-api/phone-numbers)
- [Mark as Read](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/mark-message-as-read)
- [Typing Indicators](https://developers.facebook.com/docs/whatsapp/cloud-api/typing-indicators)
- [Contextual Replies](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages/contextual-replies)
- [Groups API](https://developers.facebook.com/docs/whatsapp/cloud-api/groups)
- [Groups Messaging](https://developers.facebook.com/docs/whatsapp/cloud-api/groups/groups-messaging)
- [Block Users API](https://developers.facebook.com/docs/whatsapp/cloud-api/block-users)
- [Sell Products & Services](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/sell-products-and-services)
- [Calling API](https://developers.facebook.com/docs/whatsapp/cloud-api/calling)
- [Calling Reference](https://developers.facebook.com/docs/whatsapp/cloud-api/calling/reference)
- [Payments API Brazil](https://developers.facebook.com/docs/whatsapp/cloud-api/payments-api/payments-br)
- [Payments Orders](https://developers.facebook.com/docs/whatsapp/cloud-api/payments-api/payments-br/orders)

---

## Changelog deste Documento

| Data | Alteração |
|------|-----------|
| 2025-01 | Criação inicial com todas as seções da Cloud API |
| 2025-01 | Adicionado seção APIs Adicionais: Grupos, Bloqueio, E-commerce, Calling, Pagamentos BR |
