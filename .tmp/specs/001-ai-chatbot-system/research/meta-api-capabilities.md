# Análise Completa: WhatsApp Cloud API - Capacidades e Limitações

**Data**: 2 de dezembro de 2025  
**Versão API**: v24.0  
**Fonte**: Documentação oficial da Meta (developers.facebook.com)  
**Última Atualização**: Dezembro 2025 - 100% documentação lida

---

## 📋 Resumo Executivo

Este documento analisa **exatamente** o que a WhatsApp Cloud API permite fazer para construção de chatbots, baseado **exclusivamente** na documentação oficial da Meta. **TODAS** as páginas de tipos de mensagem foram lidas.

### ✅ O que É POSSÍVEL fazer
### ❌ O que NÃO É POSSÍVEL fazer
### ⚠️ Limitações importantes

---

## 📚 Índice Completo de Tipos de Mensagem

| # | Tipo | Página Documentação | Status |
|---|------|---------------------|--------|
| 1 | Text Messages | `/messages/text-messages` | ✅ Lido |
| 2 | Interactive Reply Buttons | `/messages/interactive-reply-buttons-messages` | ✅ Lido |
| 3 | Interactive List Messages | `/messages/interactive-list-messages` | ✅ Lido |
| 4 | Interactive CTA URL | `/messages/interactive-cta-url-messages` | ✅ Lido |
| 5 | Interactive Media Carousel | `/messages/interactive-media-carousel-messages` | ✅ Lido |
| 6 | Interactive Product Carousel | `/messages/interactive-product-carousel-messages` | ✅ Lido |
| 7 | Image Messages | `/messages/image-messages` | ✅ Lido |
| 8 | Video Messages | `/messages/video-messages` | ✅ Lido |
| 9 | Audio Messages | `/messages/audio-messages` | ✅ Lido |
| 10 | Document Messages | `/messages/document-messages` | ✅ Lido |
| 11 | Sticker Messages | `/messages/sticker-messages` | ✅ Lido |
| 12 | Location Messages | `/messages/location-messages` | ✅ Lido |
| 13 | Location Request Messages | `/guides/send-messages/location-request-messages` | ✅ Lido |
| 14 | Address Messages | `/messages/address-messages` | ✅ Lido (India only) |
| 15 | Contacts Messages | `/messages/contacts-messages` | ✅ Lido |
| 16 | Reaction Messages | `/messages/reaction-messages` | ✅ Lido |
| 17 | Template Messages | `/guides/send-message-templates` | ✅ Lido |
| 18 | WhatsApp Flows | Flow Builder Docs | ✅ Lido |
| 19 | Contextual Replies | `/guides/send-messages/contextual-replies` | ✅ Lido |
| 20 | Mark as Read | `/guides/mark-message-as-read` | ✅ Lido |
| 21 | Typing Indicators | `/typing-indicators` | ✅ Lido |

## 📚 Índice de APIs Adicionais

| # | API/Feature | Página Documentação | Status |
|---|-------------|---------------------|--------|
| 22 | Calling API | `/calling` | ✅ Lido |
| 23 | Groups API | `/groups` | ✅ Lido |
| 24 | Block Users API | `/block-users` | ✅ Lido |
| 25 | Phone Numbers | `/phone-numbers` | ✅ Lido |
| 26 | Sell Products & Services | `/guides/sell-products-and-services` | ✅ Lido |
| 27 | Payments API - Brasil | `/payments-api/payments-br` | ✅ Lido |
| 28 | Error Codes | `/support/error-codes` | ✅ Lido |
| 29 | Webhooks | `/webhooks` | ✅ Lido |
| 30 | Overview | `/overview` | ✅ Lido |
| 31 | API Reference | `/reference` | ✅ Lido |
| 32 | Support/Troubleshooting | `/support` | ✅ Lido |

---

## 1. Mensagens de Texto (Text Messages)

### 1.1 Schema de Envio

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<WHATSAPP_USER_PHONE_NUMBER>",
  "type": "text",
  "text": {
    "preview_url": true,
    "body": "<BODY_TEXT>"
  }
}
```

### 1.2 Capacidades

| Feature | Suportado | Detalhes |
|---------|-----------|----------|
| Texto livre | ✅ | Dentro da janela de 24h |
| Link Preview | ✅ | `preview_url: true` - renderiza preview do primeiro URL |
| URLs clicáveis | ✅ | Devem começar com `http://` ou `https://` |
| Emojis | ✅ | Suportados nativamente |
| Múltiplos URLs | ⚠️ | Apenas o primeiro URL terá preview |

### 1.3 Limitações

| Limite | Valor |
|--------|-------|
| Tamanho máximo body | Não documentado oficialmente (recomendado < 4096 chars) |
| Preview de URL | Apenas primeiro link |

---

## 2. Interactive Reply Buttons (Botões de Resposta)

### 2.1 Schema de Envio

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<WHATSAPP_USER_PHONE_NUMBER>",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "header": {
      "type": "image",
      "image": { "id": "<MEDIA_ID>" }
    },
    "body": {
      "text": "<BODY_TEXT>"
    },
    "footer": {
      "text": "<FOOTER_TEXT>"
    },
    "action": {
      "buttons": [
        {
          "type": "reply",
          "reply": {
            "id": "<BUTTON_ID>",
            "title": "<BUTTON_TITLE>"
          }
        }
      ]
    }
  }
}
```

### 2.2 Limites EXATOS

| Elemento | Limite | Obrigatório |
|----------|--------|-------------|
| Número de botões | **Máximo 3** | Mínimo 1 |
| Título do botão | **20 caracteres** | Sim |
| ID do botão | **256 caracteres** | Sim |
| Header | Opcional | Não |
| Body | **1024 caracteres** | Sim |
| Footer | **60 caracteres** | Não |

### 2.3 Header Options

| Tipo | Formatos Aceitos |
|------|-----------------|
| `text` | Texto simples |
| `image` | JPEG, PNG (5MB max) |
| `video` | MP4, 3GPP (16MB max) |
| `document` | PDF, DOC, etc (100MB max) |

### 2.4 Webhook de Resposta

```json
{
  "type": "interactive",
  "interactive": {
    "type": "button_reply",
    "button_reply": {
      "id": "<BUTTON_ID>",
      "title": "<BUTTON_TITLE>"
    }
  }
}
```

---

## 3. Interactive List Messages (Listas)

### 3.1 Schema de Envio

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<WHATSAPP_USER_PHONE_NUMBER>",
  "type": "interactive",
  "interactive": {
    "type": "list",
    "header": {
      "type": "text",
      "text": "<HEADER_TEXT>"
    },
    "body": {
      "text": "<BODY_TEXT>"
    },
    "footer": {
      "text": "<FOOTER_TEXT>"
    },
    "action": {
      "button": "<BUTTON_TEXT>",
      "sections": [
        {
          "title": "<SECTION_TITLE>",
          "rows": [
            {
              "id": "<ROW_ID>",
              "title": "<ROW_TITLE>",
              "description": "<ROW_DESCRIPTION>"
            }
          ]
        }
      ]
    }
  }
}
```

### 3.2 Limites EXATOS

| Elemento | Limite | Obrigatório |
|----------|--------|-------------|
| Número de seções | **Máximo 10** | Mínimo 1 |
| Número total de rows | **Máximo 10** (todas seções) | Mínimo 1 |
| Título da seção | **24 caracteres** | Não |
| Título do row | **24 caracteres** | Sim |
| Descrição do row | **72 caracteres** | Não |
| ID do row | **200 caracteres** | Sim |
| Texto do botão | **20 caracteres** | Sim |
| Header (texto only) | **60 caracteres** | Não |
| Body | **1024 caracteres** | Sim |
| Footer | **60 caracteres** | Não |

### 3.3 Webhook de Resposta

```json
{
  "type": "interactive",
  "interactive": {
    "type": "list_reply",
    "list_reply": {
      "id": "<ROW_ID>",
      "title": "<ROW_TITLE>",
      "description": "<ROW_DESCRIPTION>"
    }
  }
}
```

---

## 4. Interactive CTA URL Button

### 4.1 Schema de Envio

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<WHATSAPP_USER_PHONE_NUMBER>",
  "type": "interactive",
  "interactive": {
    "type": "cta_url",
    "header": {
      "type": "image",
      "image": { "link": "<IMAGE_URL>" }
    },
    "body": {
      "text": "<BODY_TEXT>"
    },
    "footer": {
      "text": "<FOOTER_TEXT>"
    },
    "action": {
      "name": "cta_url",
      "parameters": {
        "display_text": "<BUTTON_TEXT>",
        "url": "<TARGET_URL>"
      }
    }
  }
}
```

### 4.2 Limites

| Elemento | Limite |
|----------|--------|
| Número de botões | **Exatamente 1** |
| Display text | **20 caracteres** |
| URL | Deve ser `http://` ou `https://` |

---

## 5. Interactive Media Carousel (NOVO - Nov 2024)

### 5.1 Schema de Envio

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<PHONE_NUMBER>",
  "type": "interactive",
  "interactive": {
    "type": "carousel",
    "body": {
      "text": "<MESSAGE_BODY>"
    },
    "action": {
      "cards": [
        {
          "card_index": 0,
          "type": "cta_url",
          "header": {
            "type": "image",
            "image": { "link": "<IMAGE_URL>" }
          },
          "body": {
            "text": "<CARD_BODY>"
          },
          "action": {
            "name": "cta_url",
            "parameters": {
              "display_text": "<BUTTON_TEXT>",
              "url": "<TARGET_URL>"
            }
          }
        }
      ]
    }
  }
}
```

### 5.2 Limites EXATOS

| Elemento | Limite |
|----------|--------|
| Número de cards | **Mínimo 2, Máximo 10** |
| Card index | 0-9 |
| Tipo de card | Todos devem ser `cta_url` |
| Header type | Todos iguais: `image` ou `video` |
| Body da mensagem | **1024 caracteres** |

### 5.3 Características

- ✅ Cards rolam horizontalmente
- ✅ Cada card tem imagem/vídeo + texto + botão CTA
- ⚠️ **Não permite header, footer ou botões fora dos cards**
- ⚠️ Todos os cards devem ter mesmo tipo de header (image OU video)

---

## 6. Interactive Product Carousel (NOVO - Nov 2024)

### 6.1 Schema de Envio

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<PHONE_NUMBER>",
  "type": "interactive",
  "interactive": {
    "type": "carousel",
    "body": {
      "text": "<MESSAGE_BODY>"
    },
    "action": {
      "cards": [
        {
          "card_index": 0,
          "type": "product",
          "action": {
            "product_retailer_id": "<PRODUCT_ID>",
            "catalog_id": "<CATALOG_ID>"
          }
        }
      ]
    }
  }
}
```

### 6.2 Limites

| Elemento | Limite |
|----------|--------|
| Número de cards | **Mínimo 2, Máximo 10** |
| Tipo de card | Todos devem ser `product` |
| Catalog ID | Mesmo para todos os cards |

### 6.3 Requisitos

- ✅ Requer catálogo de produtos configurado
- ✅ Integra com Single Product Message (SPM)
- ⚠️ Não permite header, footer ou botões fora dos cards

---

## 7. Image Messages

### 7.1 Schema de Envio

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<PHONE_NUMBER>",
  "type": "image",
  "image": {
    "id": "<MEDIA_ID>",
    "caption": "<CAPTION_TEXT>"
  }
}
```

**OU por link:**

```json
{
  "image": {
    "link": "<IMAGE_URL>",
    "caption": "<CAPTION_TEXT>"
  }
}
```

### 7.2 Limites e Formatos

| Especificação | Valor |
|--------------|-------|
| Formatos | **JPEG, PNG** |
| Tamanho máximo | **5 MB** |
| Bit depth | 8-bit |
| Color space | RGB ou RGBA |
| Caption | Opcional |

---

## 8. Video Messages

### 8.1 Schema de Envio

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<PHONE_NUMBER>",
  "type": "video",
  "video": {
    "id": "<MEDIA_ID>",
    "caption": "<CAPTION_TEXT>"
  }
}
```

### 8.2 Limites e Formatos

| Especificação | Valor |
|--------------|-------|
| Formatos | **MP4, 3GPP** |
| Tamanho máximo | **16 MB** |
| Codec de vídeo | **H.264** |
| Codec de áudio | **AAC** |
| Profile | Main profile |
| Caption | Opcional |

### 8.3 Nota Importante

> Apenas H.264 codec é suportado. Outros codecs como H.265/HEVC **não funcionam**.

---

## 9. Audio Messages

### 9.1 Schema de Envio

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<PHONE_NUMBER>",
  "type": "audio",
  "audio": {
    "id": "<MEDIA_ID>"
  }
}
```

### 9.2 Tipos de Áudio

| Tipo | Formato | Comportamento |
|------|---------|---------------|
| **Voice Message** | `.ogg` com codec **OPUS** | Mostra ícone de play e waveform |
| **Basic Audio** | MP3, M4A, AAC, AMR, OGG | Mostra player de áudio genérico |

### 9.3 Limites

| Especificação | Valor |
|--------------|-------|
| Tamanho máximo | **16 MB** |
| Duração máxima (com ícone de play) | **512 KB** para .ogg OPUS |

### 9.4 Nota sobre Voice Messages

> Para que o áudio apareça como "voice message" com o ícone de play e waveform similar ao gravado no app, deve ser formato `.ogg` com codec **OPUS**.

---

## 10. Document Messages

### 10.1 Schema de Envio

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<PHONE_NUMBER>",
  "type": "document",
  "document": {
    "id": "<MEDIA_ID>",
    "filename": "<FILENAME>",
    "caption": "<CAPTION_TEXT>"
  }
}
```

### 10.2 Limites e Formatos

| Especificação | Valor |
|--------------|-------|
| Formatos | PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, etc. |
| Tamanho máximo | **100 MB** |
| Filename | Obrigatório |
| Caption | Opcional |

---

## 11. Sticker Messages

### 11.1 Schema de Envio

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<PHONE_NUMBER>",
  "type": "sticker",
  "sticker": {
    "id": "<MEDIA_ID>"
  }
}
```

### 11.2 Limites e Formatos

| Especificação | Valor |
|--------------|-------|
| Formato | **WebP apenas** |
| Tamanho (estático) | **100 KB** máximo |
| Tamanho (animado) | **500 KB** máximo |
| Dimensões recomendadas | 512x512 pixels |

---

## 12. Location Messages

### 12.1 Schema de Envio

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<PHONE_NUMBER>",
  "type": "location",
  "location": {
    "latitude": "<LATITUDE>",
    "longitude": "<LONGITUDE>",
    "name": "<LOCATION_NAME>",
    "address": "<ADDRESS>"
  }
}
```

### 12.2 Campos

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| latitude | float | Sim |
| longitude | float | Sim |
| name | string | Não |
| address | string | Não |

---

## 13. Location Request Messages

### 13.1 Schema de Envio

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<PHONE_NUMBER>",
  "type": "interactive",
  "interactive": {
    "type": "location_request_message",
    "body": {
      "text": "<BODY_TEXT>"
    },
    "action": {
      "name": "send_location"
    }
  }
}
```

### 13.2 Comportamento

- ✅ Mostra botão "Send Location" para o usuário
- ✅ Usuário pode enviar localização atual ou escolher no mapa
- ⚠️ Usuário pode recusar compartilhar localização

### 13.3 Webhook de Resposta

```json
{
  "type": "location",
  "location": {
    "latitude": "<LATITUDE>",
    "longitude": "<LONGITUDE>",
    "name": "<LOCATION_NAME>",
    "address": "<ADDRESS>"
  }
}
```

---

## 14. Address Messages (INDIA ONLY)

### 14.1 Disponibilidade

> ⚠️ **APENAS disponível para números de telefone da Índia (+91)**

### 14.2 Schema de Envio

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<INDIA_PHONE_NUMBER>",
  "type": "interactive",
  "interactive": {
    "type": "address_message",
    "body": {
      "text": "<BODY_TEXT>"
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

### 14.3 Webhook de Resposta

```json
{
  "type": "interactive",
  "interactive": {
    "type": "nfm_reply",
    "nfm_reply": {
      "name": "address_message",
      "body": "...",
      "response_json": "{...}"
    }
  }
}
```

---

## 15. Contacts Messages

### 15.1 Schema de Envio

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<PHONE_NUMBER>",
  "type": "contacts",
  "contacts": [
    {
      "addresses": [
        {
          "street": "<STREET>",
          "city": "<CITY>",
          "state": "<STATE>",
          "zip": "<ZIP>",
          "country": "<COUNTRY>",
          "country_code": "<COUNTRY_CODE>",
          "type": "<ADDRESS_TYPE>"
        }
      ],
      "birthday": "<YYYY-MM-DD>",
      "emails": [
        {
          "email": "<EMAIL>",
          "type": "<EMAIL_TYPE>"
        }
      ],
      "name": {
        "formatted_name": "<FULL_NAME>",
        "first_name": "<FIRST_NAME>",
        "last_name": "<LAST_NAME>",
        "middle_name": "<MIDDLE_NAME>",
        "suffix": "<SUFFIX>",
        "prefix": "<PREFIX>"
      },
      "org": {
        "company": "<COMPANY>",
        "department": "<DEPARTMENT>",
        "title": "<JOB_TITLE>"
      },
      "phones": [
        {
          "phone": "<PHONE>",
          "type": "<PHONE_TYPE>",
          "wa_id": "<WHATSAPP_ID>"
        }
      ],
      "urls": [
        {
          "url": "<URL>",
          "type": "<URL_TYPE>"
        }
      ]
    }
  ]
}
```

### 15.2 Limites

| Especificação | Valor |
|--------------|-------|
| Número de contatos | **Máximo 257** (recomendado menos) |
| Campo obrigatório | `name.formatted_name` |

### 15.3 Comportamento de Botões

| Condição | Botões exibidos |
|----------|-----------------|
| Inclui `wa_id` | "Message" + "Save contact" |
| Não inclui `wa_id` | "Invite to WhatsApp" |

---

## 16. Reaction Messages

### 16.1 Schema de Envio

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<PHONE_NUMBER>",
  "type": "reaction",
  "reaction": {
    "message_id": "<WAMID_TO_REACT_TO>",
    "emoji": "<EMOJI>"
  }
}
```

### 16.2 Remover Reação

```json
{
  "reaction": {
    "message_id": "<WAMID>",
    "emoji": ""
  }
}
```

### 16.3 Limitações

- ⚠️ **Apenas webhook `sent`** - Não recebe `delivered` nem `read`
- ✅ Pode reagir a mensagens recebidas do usuário
- ✅ Qualquer emoji suportado

---

## 17. Contextual Replies (Respostas Contextuais)

### 17.1 Schema de Envio

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<PHONE_NUMBER>",
  "context": {
    "message_id": "<WAMID_TO_REPLY_TO>"
  },
  "type": "text",
  "text": {
    "body": "<REPLY_TEXT>"
  }
}
```

### 17.2 Comportamento

- ✅ Mostra "bolha contextual" com a mensagem original
- ✅ Funciona com qualquer tipo de mensagem (text, image, etc.)

### 17.3 Limitações

| Situação | Comportamento |
|----------|---------------|
| Mensagem original deletada | Bolha não aparece |
| Mensagem > 30 dias | Pode não aparecer (long-term storage) |
| Reply com audio/image/video em KaiOS | Bolha não aparece |
| Reply com template | Bolha **nunca** aparece |
| Reply com reaction | **NÃO PERMITIDO** |

---

## 18. Mark Messages as Read

### 18.1 Schema de Envio

```json
{
  "messaging_product": "whatsapp",
  "status": "read",
  "message_id": "<WAMID_TO_MARK_READ>"
}
```

### 18.2 Comportamento

- ✅ Marca mensagem como lida (ticks azuis)
- ✅ Marca automaticamente mensagens anteriores como lidas
- ⚠️ Boa prática: marcar dentro de 30 dias

---

## 19. Typing Indicators

### 19.1 Schema de Envio

```json
{
  "messaging_product": "whatsapp",
  "status": "read",
  "message_id": "<WAMID>",
  "typing_indicator": {
    "type": "text"
  }
}
```

### 19.2 Comportamento

- ✅ Mostra "digitando..." para o usuário
- ✅ Marca mensagem como lida simultaneamente
- ⚠️ **Desaparece após 25 segundos** ou quando você responder
- ⚠️ Só use se for responder em seguida

---

## 20. WhatsApp Flows (Formulários Nativos)

### 20.1 Schema de Envio

```json
{
  "messaging_product": "whatsapp",
  "to": "<PHONE_NUMBER>",
  "type": "interactive",
  "interactive": {
    "type": "flow",
    "header": {
      "type": "text",
      "text": "<HEADER>"
    },
    "body": {
      "text": "<BODY>"
    },
    "footer": {
      "text": "<FOOTER>"
    },
    "action": {
      "name": "flow",
      "parameters": {
        "flow_message_version": "3",
        "flow_id": "<FLOW_ID>",
        "flow_cta": "<BUTTON_TEXT>",
        "flow_action": "navigate",
        "flow_action_payload": {
          "screen": "<INITIAL_SCREEN>",
          "data": {}
        }
      }
    }
  }
}
```

### 20.2 Flow JSON Structure

```json
{
  "version": "7.2",
  "data_api_version": "3.0",
  "routing_model": {
    "SCREEN_1": ["SCREEN_2"],
    "SCREEN_2": []
  },
  "screens": [
    {
      "id": "SCREEN_1",
      "title": "Screen Title",
      "layout": {
        "type": "SingleColumnLayout",
        "children": [...]
      }
    }
  ]
}
```

### 20.3 Componentes Disponíveis

| Componente | Descrição |
|------------|-----------|
| TextHeading | Título grande |
| TextSubheading | Subtítulo |
| TextBody | Texto do corpo |
| TextCaption | Texto pequeno |
| TextInput | Campo de texto (text, email, phone, password, number) |
| TextArea | Área de texto multilinha |
| DatePicker | Seletor de data |
| RadioButtonsGroup | Botões de opção |
| CheckboxGroup | Checkboxes |
| Dropdown | Dropdown select |
| Image | Imagem |
| OptIn | Checkbox com link |
| EmbeddedLink | Link inline |
| Footer | Botão de ação |

### 20.4 Ações em Flows

| Ação | Descrição |
|------|-----------|
| `navigate` | Ir para outra tela |
| `complete` | Finalizar e enviar dados |
| `data_exchange` | Comunicar com servidor |
| `update_data` | Atualizar dados na tela |
| `open_url` | Abrir URL externa |

### 20.5 Limites

| Elemento | Limite |
|----------|--------|
| Tamanho do JSON | **10 MB** |
| Branches no routing_model | **10** |
| Requer aprovação | ✅ Sim |

---

## 21. Template Messages (Fora da Janela 24h)

### 21.1 Quando Usar

| Situação | Mensagem Livre | Template Obrigatório |
|----------|----------------|----------------------|
| Usuário mandou msg há < 24h | ✅ | ✅ |
| Usuário mandou msg há > 24h | ❌ | ✅ |
| Primeira mensagem ao usuário | ❌ | ✅ |
| Click-to-WhatsApp Ad (< 24h) | ✅ | ✅ |

### 21.2 Componentes de Template

| Componente | Limite |
|------------|--------|
| Header (texto) | 60 caracteres |
| Header (media) | Image, Video, Document |
| Body | **1024 caracteres** |
| Footer | 60 caracteres |
| Botões total | Máximo 10 |

### 21.3 Tipos de Botões em Templates

| Tipo | Limite | Descrição |
|------|--------|-----------|
| QUICK_REPLY | 10 total | Envia payload de volta |
| URL | 2 | Abre URL (pode ter variável) |
| PHONE_NUMBER | 1 | Liga para número |
| COPY_CODE | 1 | Copia código |
| FLOW | 1 | Inicia WhatsApp Flow |

---

## 22. Webhooks - Tipos de Mensagem Recebida

### 22.1 Estrutura Base

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "<WABA_ID>",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "<DISPLAY_PHONE>",
          "phone_number_id": "<PHONE_NUMBER_ID>"
        },
        "contacts": [{
          "profile": { "name": "<USER_NAME>" },
          "wa_id": "<USER_WA_ID>"
        }],
        "messages": [{
          "from": "<USER_PHONE>",
          "id": "<WAMID>",
          "timestamp": "<UNIX_TIMESTAMP>",
          "type": "<MESSAGE_TYPE>",
          ...
        }]
      },
      "field": "messages"
    }]
  }]
}
```

### 22.2 Tabela de Tipos de Mensagem Recebida

| type | Descrição | Campos principais |
|------|-----------|-------------------|
| `text` | Texto livre | `text.body` |
| `interactive.button_reply` | Resposta de botão | `interactive.button_reply.id`, `.title` |
| `interactive.list_reply` | Resposta de lista | `interactive.list_reply.id`, `.title`, `.description` |
| `interactive.nfm_reply` | Resposta de Flow/Address | `interactive.nfm_reply.response_json` |
| `button` | Quick reply de template | `button.text`, `button.payload` |
| `image` | Imagem | `image.id`, `image.caption`, `image.mime_type` |
| `document` | Documento | `document.id`, `document.filename`, `document.mime_type` |
| `audio` | Áudio | `audio.id`, `audio.mime_type` |
| `video` | Vídeo | `video.id`, `video.caption`, `video.mime_type` |
| `sticker` | Sticker | `sticker.id`, `sticker.mime_type` |
| `location` | Localização | `location.latitude`, `location.longitude`, `location.name` |
| `contacts` | Contato(s) | `contacts[]` |
| `reaction` | Reação | `reaction.emoji`, `reaction.message_id` |
| `order` | Pedido de catálogo | `order.catalog_id`, `order.product_items[]` |

### 22.3 Status de Mensagens Enviadas

```json
{
  "statuses": [{
    "id": "<WAMID>",
    "status": "sent|delivered|read|failed",
    "timestamp": "<UNIX_TIMESTAMP>",
    "recipient_id": "<USER_PHONE>",
    "conversation": {
      "id": "<CONVERSATION_ID>",
      "origin": { "type": "service|marketing|utility|authentication" }
    },
    "pricing": {
      "billable": true,
      "pricing_model": "CBP",
      "category": "service"
    }
  }]
}
```

---

## 23. Rate Limits e Janelas de Conversa

### 23.1 Pair Rate Limit (por destinatário)

| Métrica | Valor |
|---------|-------|
| Mensagens/segundo por par | **0.17** (1 msg cada 6 segundos) |
| Burst máximo | **45 mensagens** |
| Erro ao exceder | **131056** |

### 23.2 Retry Strategy

```
Após burst de N mensagens:
1. Aguardar N * 6 segundos
2. Retry com backoff exponencial: 4^X segundos (X começa em 0)
```

### 23.3 Customer Service Window (CSW)

| Evento | Janela |
|--------|--------|
| Usuário envia mensagem | **24 horas** (rolling) |
| Cada nova mensagem do usuário | Renova para 24h |
| Click-to-WhatsApp Ad + resposta em 24h | **72 horas** (Free Entry Point) |

### 23.4 Conversation Pricing

| Tipo | Quando abre | Duração | Custo |
|------|-------------|---------|-------|
| Service | Mensagem não-template na CSW | 24h | Grátis (1000/mês) |
| Marketing | Template marketing enviado | 24h | $$ |
| Utility | Template utility fora CSW | 24h | $ |
| Authentication | Template auth enviado | 24h | $ |
| Free Entry Point | Resposta a CTWA dentro 24h | 72h | Grátis |

---

## 24. O que NÃO é Possível Fazer

### 24.1 Limitações de Interactive Messages

| Limitação | Alternativa |
|-----------|-------------|
| ❌ Mais de 3 botões | Use list message (até 10 items) |
| ❌ Combinar buttons + list | São mutuamente exclusivos |
| ❌ Botões com ações programáticas | Apenas reply, URL, phone |
| ❌ Botões inline no texto | Botões são sempre no footer |
| ❌ Header diferente de text em list | Apenas texto permitido |

### 24.2 Limitações de Flows

| Limitação | Detalhe |
|-----------|---------|
| ❌ Flows sem aprovação | Precisa publicar antes de usar |
| ❌ Código customizado no Flow | Apenas lógica declarativa |
| ❌ Mais de 10 branches | Limite no routing_model |
| ❌ APIs externas direto do Flow | Precisa endpoint intermediário |

### 24.3 Limitações Gerais

| Limitação | Detalhe |
|-----------|---------|
| ❌ Enviar para não-WhatsApp | Sem fallback SMS nativo |
| ❌ Verificar se tem WhatsApp | API descontinuada |
| ❌ Editar mensagem enviada | Apenas status de leitura |
| ❌ Deletar mensagem do usuário | Apenas do seu lado |
| ❌ Áudio/vídeo em tempo real | Apenas mídia pré-gravada |
| ❌ Criar grupos via API | Apenas 1:1 |
| ❌ Address Messages fora India | Apenas +91 |

### 24.4 Limitações de Contextual Replies

| Limitação | Detalhe |
|-----------|---------|
| ❌ Reaction como reply | Não permitido |
| ❌ Template como reply | Bolha não aparece |
| ❌ Reply de msg > 30 dias | Pode não funcionar |

---

## 22. Calling API (Chamadas de Voz)

### 22.1 Visão Geral

A WhatsApp Business Calling API permite iniciar e receber chamadas de voz usando VoIP.

### 22.2 Pré-requisitos

| Requisito | Detalhes |
|-----------|----------|
| Número registrado | Cloud API (não WhatsApp Business App) |
| Webhook `calls` | Subscrito no app |
| Messaging limit | Mínimo 2.000 conversas/24h |
| Calling habilitado | Configurar nas settings do número |

### 22.3 Tipos de Chamada

| Tipo | Disponibilidade | Limites |
|------|-----------------|---------|
| User-initiated | Todos os países Cloud API | - |
| Business-initiated | Exceto USA, Canadá, Turquia, Egito, Vietnã, Nigéria | Ver detalhes |

### 22.4 Limites (por par business+user)

**Produção:**
| Limite | Valor |
|--------|-------|
| Chamadas conectadas | 10/24h |
| Call permissions enviados | 1/dia, 2/semana |
| Chamadas não atendidas consecutivas | 2 → reconsiderar permissão |
| Chamadas não atendidas consecutivas | 4 → permissão revogada |

**Sandbox (testes):**
| Limite | Valor |
|--------|-------|
| Chamadas conectadas | 100/24h |
| Call permissions enviados | 25/dia, 100/semana |
| Chamadas não atendidas para reconsiderar | 5 |
| Chamadas não atendidas para revogar | 10 |

### 22.5 Recursos Adicionais

- **Inbound call control**: Prevenir chamadas de entrada
- **Business call hours**: Horário comercial
- **Callback requests**: Usuário pode solicitar retorno
- **SIP**: Integração via Session Initiation Protocol

### 22.6 Relevância para Chatbot

📋 **PÓS-FEATURE** - Chamadas VoIP como extensão futura para atendimento humano ou escalação de suporte.

---

## 23. Groups API (Mensagens em Grupo)

### 23.1 Visão Geral

Permite criar e gerenciar grupos de WhatsApp via Cloud API.

### 23.2 Pré-requisitos CRÍTICOS

| Requisito | Detalhes |
|-----------|----------|
| Status | **Official Business Account (OBA)** obrigatório |
| Messaging limit | **100.000+ mensagens** |
| Webhook `group_update` | Subscrito no app |

### 23.3 Limites

| Limite | Valor |
|--------|-------|
| Participantes por grupo | **Máximo 8** |
| Grupos por número | 10.000 |

### 23.4 Mensagens Suportadas em Grupos

| Tipo | Suportado |
|------|-----------|
| Text | ✅ |
| Image | ✅ |
| Video | ✅ |
| Audio | ✅ |
| Document | ✅ |
| Sticker | ✅ |
| Location | ✅ |
| Template | ✅ |
| **Interactive (buttons/lists)** | ❌ NÃO |
| **Flows** | ❌ NÃO |
| **Calling** | ❌ NÃO |

### 23.5 Relevância para Chatbot

📋 **PÓS-FEATURE** - Grupos para atendimento em equipe ou broadcasts segmentados. Requisitos: OBA + 100k limit. Limitação: sem botões interativos em grupos.

---

## 24. Block Users API (Bloqueio de Usuários)

### 24.1 Visão Geral

Permite bloquear usuários problemáticos de contatar o business.

### 24.2 Comportamento do Bloqueio

- Usuário não pode contatar o business
- Business não pode enviar mensagens ao usuário
- Usuário não vê status online do business
- Não pode bloquear outro WhatsApp Business

### 24.3 Endpoints

```
POST /<PHONE_NUMBER_ID>/block_users    # Bloquear
DELETE /<PHONE_NUMBER_ID>/block_users  # Desbloquear
GET /<PHONE_NUMBER_ID>/block_users     # Listar bloqueados
```

### 24.4 Limites

| Limite | Valor |
|--------|-------|
| Tempo para bloqueio | Usuário deve ter enviado msg nas últimas 24h |
| Tamanho da blocklist | **64.000 usuários** |

### 24.5 Schema de Bloqueio

```json
{
  "messaging_product": "whatsapp",
  "block_users": [
    { "user": "<PHONE_NUMBER>" }
  ]
}
```

### 24.6 Relevância para Chatbot

✅ **Útil** - Para gerenciar opt-outs forçados e usuários abusivos.

---

## 25. Phone Numbers (Números de Telefone)

### 25.1 Requisitos de Registro

| Requisito | Detalhes |
|-----------|----------|
| Ownership | Deve ser seu número |
| Formato | Código país + código área (short codes não suportados) |
| Capacidade | Deve receber chamadas de voz OU SMS |
| Escala | Deve ter scaled capabilities |

### 25.2 Limites de Números

| Status | Limite de Números |
|--------|-------------------|
| Business novo | 2 números |
| Business verificado OU 2k msg limit | 20 números |

### 25.3 Quality Rating

| Status | Significado |
|--------|-------------|
| GREEN | Qualidade alta |
| YELLOW | Qualidade média - monitorar |
| RED | Qualidade baixa - risco de restrição |
| UNKNOWN | Sem dados suficientes |

### 25.4 Throughput

| Tier | Mensagens/segundo |
|------|-------------------|
| Padrão | 80 mps |
| Auto-upgrade | Até 1000 mps |

### 25.5 Two-Step Verification

Obrigatório definir PIN no registro. Necessário para:
- Alterar PIN
- Deletar número

### 25.6 Identity Check (Opcional)

Permite verificar identidade do usuário antes de entregar mensagem:
```json
{
  "recipient_identity_key_hash": "DF2lS5v2W6x=",
  "type": "text",
  "text": { "body": "..." }
}
```

### 25.7 Formato de Números (Recomendação)

Sempre incluir `+` e código do país:
- ✅ `+5511999999999`
- ⚠️ `11999999999` (adiciona código do país do business)

**Nota Brasil/México:** O prefixo extra pode ser modificado automaticamente.

---

## 26. Sell Products & Services (Catálogo)

### 26.1 Visão Geral

Permite compartilhar produtos do catálogo Meta Commerce Manager.

### 26.2 Fluxo

1. Upload do inventário para Meta (API ou Commerce Manager)
2. Conectar catálogo E-commerce ao WABA
3. Configurar commerce settings no número
4. Compartilhar produtos via mensagens
5. Receber respostas/pedidos via webhook

### 26.3 Tipos de Mensagem

| Tipo | Uso |
|------|-----|
| Single Product Message | 1 produto |
| Multi-Product Message | Múltiplos produtos |

### 26.4 Políticas

- Itens rejeitados são flaggados automaticamente
- Usuários podem reportar produtos
- Appeals via Commerce Manager

### 26.5 Relevância para Chatbot

✅ **Útil para e-commerce** - Integração com catálogo para chatbots de vendas.

---

## 27. Payments API - Brasil

### 27.1 Visão Geral

Permite aceitar pagamentos de clientes via WhatsApp no Brasil.

### 27.2 Métodos Suportados

| Método | Descrição |
|--------|-----------|
| **Pix Dinâmico** | Código Pix gerado dinamicamente |
| **Payment Links** | Links de pagamento externos |
| **Boleto** | Boleto bancário |
| **One-click card** | Pagamento com cartão salvo |
| **Order Details Template** | Template com detalhes do pedido |

### 27.3 Fluxo

1. Business envia mensagem `order_details` com `reference_id`
2. Cliente vê o pedido no WhatsApp
3. Cliente paga (Pix no app banco, link externo, etc.)
4. Business recebe webhook de status
5. Business envia `order_status` como `processing`

### 27.4 Importante

- WhatsApp **NÃO FAZ** reconciliação de pagamentos
- Business deve reconciliar com PSP usando `reference_id`

### 27.5 Relevância para Chatbot

✅ **Útil para e-commerce Brasil** - Pagamentos integrados ao fluxo de conversa.

---

## 28. Error Codes (Códigos de Erro)

### 28.1 Categorias de Erro

| Categoria | Códigos | Descrição |
|-----------|---------|-----------|
| Authorization | 0, 3, 10, 190, etc. | Token/permissões inválidos |
| Integrity | 368, 131049, etc. | Violação de políticas |
| Template Creation | 130000-131000 | Erros de criação de template |
| Template Sending | 131xxx | Erros de envio de template |
| Rate Limiting | 130429, 131056 | Limites de taxa |
| Throttling | 131047, 131056 | Throughput/pair limit |

### 28.2 Erros Críticos para Tratamento

| Código | Descrição | Ação |
|--------|-----------|------|
| 130429 | Rate limit hit | Aguardar + exponential backoff |
| 131042 | Payment issue | Banner para usuário |
| 131047 | Re-engagement required | Enviar template |
| 131049 | Marketing limit reached | Aguardar 24h |
| 131051 | Unsupported message type | Verificar compatibilidade |
| 131056 | Pair rate limit | 1 msg/6s para mesmo usuário |

### 28.3 Webhooks de Erro

Erros podem vir:
- **Síncronos**: Resposta da Graph API
- **Assíncronos**: Via webhook `messages`

### 28.4 Países Restritos

❌ **Não podem usar WhatsApp Business Platform:**
- Cuba
- Irã
- Coreia do Norte
- Síria
- Ucrânia (Crimeia, Donetsk, Luhansk)

✅ **Turquia liberada** desde 15 de maio de 2024.

---

## 29. Matriz de Compatibilidade para Chatbot

### 29.1 Mapeamento Nó → API Feature

| Tipo de Nó no Builder | Feature da API | Limitações |
|----------------------|----------------|------------|
| Mensagem de texto | `type: text` | Precisa CSW ou template |
| Menu de botões (≤3) | `type: interactive.button` | 3 botões max, 20 chars cada |
| Menu extenso (≤10) | `type: interactive.list` | 10 items max, header só texto |
| Coletar dado único | Aguardar `type: text` | Input livre do usuário |
| Formulário complexo | `type: interactive.flow` | Precisa aprovação Meta |
| Carousel de ofertas | `type: interactive.carousel` | 2-10 cards, todos CTA |
| Carousel de produtos | `type: interactive.carousel.product` | Precisa catálogo |
| Enviar imagem | `type: image` | 5MB max, JPEG/PNG |
| Enviar PDF | `type: document` | 100MB max |
| Enviar vídeo | `type: video` | 16MB, H.264 only |
| Enviar áudio/voice | `type: audio` | 16MB, .ogg OPUS para voice |
| Enviar sticker | `type: sticker` | WebP only, 500KB max |
| Direcionar para URL | `type: interactive.cta_url` | 1 botão, 20 chars |
| Pedir localização | `type: interactive.location_request_message` | Usuário pode recusar |
| Enviar localização | `type: location` | lat/long + name/address |
| Enviar contato | `type: contacts` | Max 257 contatos |
| Reagir mensagem | `type: reaction` | Qualquer emoji |
| Responder contextual | `context.message_id` | Não funciona com template |
| Indicar digitando | `typing_indicator` | Max 25 segundos |
| Marcar como lido | `status: read` | Marca anteriores também |
| Template inicial | `type: template` | Precisa aprovação |
| Bloquear usuário | Block Users API | Só após msg recebida 24h |
| Delay/espera | Backend | N/A |
| Condição/branch | Backend | N/A |
| Variáveis | Backend | N/A |

---

## 30. Conclusão

### 30.1 Pontos Fortes da API

- ✅ Botões e listas interativos nativos
- ✅ WhatsApp Flows para formulários complexos
- ✅ Carousels para showcase de produtos/ofertas
- ✅ Webhooks em tempo real
- ✅ Templates para reengajamento
- ✅ Suporte a múltiplos tipos de mídia
- ✅ Typing indicators para UX

### 30.2 Considerações Críticas

- ⚠️ Limite de 3 botões por mensagem
- ⚠️ Limite de 10 items em listas
- ⚠️ Janela de 24h para mensagens livres
- ⚠️ Flows requerem aprovação Meta
- ⚠️ Address Messages só na Índia
- ⚠️ H.264 obrigatório para vídeos
- ⚠️ WebP obrigatório para stickers

### 30.3 Arquitetura Recomendada

O sistema de chatbot do SmartZap deve ser construído como:

```
┌─────────────────────────────────────────────────────────┐
│                    SMARTZAP CHATBOT                     │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   FRONTEND  │    │   BACKEND   │    │   WHATSAPP  │  │
│  │  Flow Editor│───▶│ Orquestrador│───▶│   Cloud API │  │
│  │  (React     │    │   (Node.js) │    │   (v24.0)   │  │
│  │   Flow)     │    │             │    │             │  │
│  └─────────────┘    └──────┬──────┘    └─────────────┘  │
│                            │                             │
│                     ┌──────▼──────┐                     │
│                     │    REDIS    │                     │
│                     │ (Estado +   │                     │
│                     │  Variáveis) │                     │
│                     └─────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

O backend é o **orquestrador de fluxo** que usa a WhatsApp API como **canal de comunicação**, não como **engine de lógica**.

---

*Documento gerado a partir da análise completa da documentação oficial da Meta WhatsApp Cloud API v24.0.*
