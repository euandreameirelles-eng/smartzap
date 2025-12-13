# WhatsApp Cloud API - Tabela de Limites Rápida

**Referência rápida de todos os limites da API v24.0**

---

## 📏 Limites de Mensagens Interativas

| Tipo | Elemento | Limite EXATO |
|------|----------|--------------|
| **Reply Buttons** | Número de botões | **3 máx** |
| | Título do botão | **20 chars** |
| | ID do botão | **256 chars** |
| | Body | **1024 chars** |
| | Footer | **60 chars** |
| **List Messages** | Seções | **10 máx** |
| | Rows total | **10 máx** |
| | Título seção | **24 chars** |
| | Título row | **24 chars** |
| | Descrição row | **72 chars** |
| | ID row | **200 chars** |
| | Texto do botão | **20 chars** |
| | Header (só texto) | **60 chars** |
| **CTA URL** | Botões | **1 exato** |
| | Display text | **20 chars** |
| **Carousel** | Cards | **2-10** |
| | Card index | **0-9** |

---

## 📁 Limites de Mídia

| Tipo | Formatos | Tamanho Máx | Notas |
|------|----------|-------------|-------|
| **Image** | JPEG, PNG | **5 MB** | 8-bit, RGB/RGBA |
| **Video** | MP4, 3GPP | **16 MB** | H.264 obrigatório |
| **Audio** | MP3, M4A, AAC, OGG, AMR | **16 MB** | |
| **Voice** | OGG (OPUS) | **512 KB** | Para ícone de play |
| **Document** | PDF, DOC, XLS, etc. | **100 MB** | |
| **Sticker (estático)** | WebP | **100 KB** | 512x512px |
| **Sticker (animado)** | WebP | **500 KB** | 512x512px |

---

## ⏱️ Rate Limits

| Limite | Valor |
|--------|-------|
| Msgs por par (sustentado) | **1 msg / 6 segundos** |
| Burst máximo | **45 mensagens** |
| Erro de rate limit | **131056** |
| Typing indicator | **25 segundos** máx |

---

## 🕐 Janelas de Conversa

| Tipo | Duração | Gatilho |
|------|---------|---------|
| Customer Service Window | **24h** | Msg do usuário |
| Free Entry Point | **72h** | CTWA + resposta |
| Conversas mensais grátis | **1000** | Service conversations |

---

## 📝 Limites de Templates

| Componente | Limite |
|------------|--------|
| Header (texto) | **60 chars** |
| Body | **1024 chars** |
| Footer | **60 chars** |
| Botões total | **10 máx** |
| URL buttons | **2 máx** |
| Phone buttons | **1 máx** |
| Copy code buttons | **1 máx** |
| Flow buttons | **1 máx** |

---

## 📋 WhatsApp Flows

| Limite | Valor |
|--------|-------|
| Tamanho JSON | **10 MB** |
| Branches | **10 máx** |

---

## 📇 Contacts

| Limite | Valor |
|--------|-------|
| Contatos por mensagem | **257 máx** |

---

## ⚠️ Funcionalidades Não Suportadas

| Feature | Status |
|---------|--------|
| Mais de 3 botões | ❌ Use List |
| Botões + List juntos | ❌ Mutuamente exclusivos |
| Header media em List | ❌ Só texto |
| Flows sem aprovação | ❌ Precisa publicar |
| Address Messages fora India | ❌ Só +91 |
| Editar mensagem enviada | ❌ Impossível |
| Deletar msg do usuário | ❌ Só seu lado |
| H.265/HEVC vídeos | ❌ Só H.264 |
| Stickers não-WebP | ❌ Só WebP |

---

## 👥 Groups API (Pós-Feature)

| Limite | Valor |
|--------|-------|
| Participantes por grupo | **8 máx** |
| Grupos por número | **10.000** |
| Requisito | OBA + 100k msg limit |
| Interactive msgs | ❌ NÃO suportado |
| Calling em grupos | ❌ NÃO suportado |
| Status | 📋 Roadmap futuro |

---

## 📞 Calling API (Pós-Feature)

| Limite (Produção) | Valor |
|-------------------|-------|
| Chamadas conectadas/24h | 10 |
| Call permissions/dia | 1 |
| Call permissions/semana | 2 |
| Consecutivas não atendidas | 4 → revoga permissão |
| Países bloqueados (business-initiated) | USA, Canadá, Turquia, Egito, Vietnã, Nigéria |
| Status | 📋 Roadmap futuro |

---

## 🚫 Block Users API

| Limite | Valor |
|--------|-------|
| Blocklist máx | **64.000** usuários |
| Tempo para bloqueio | Msg nas últimas 24h |

---

## 📱 Phone Numbers

| Status | Limite de Números |
|--------|-------------------|
| Business novo | 2 |
| Verificado OU 2k limit | 20 |

| Throughput | mps |
|------------|-----|
| Padrão | 80 |
| Auto-upgrade | Até 1.000 |

---

## 💰 Payments API Brasil

| Método | Disponível |
|--------|------------|
| Pix Dinâmico | ✅ |
| Payment Links | ✅ |
| Boleto | ✅ |
| One-click card | ✅ |

---

## 🌍 Países Restritos

❌ **Não podem usar:**
- Cuba, Irã, Coreia do Norte, Síria
- Ucrânia (Crimeia, Donetsk, Luhansk)

✅ **Turquia liberada** (maio 2024)

---

## 🔴 Error Codes Críticos

| Código | Descrição | Ação |
|--------|-----------|------|
| 130429 | Rate limit hit | Backoff |
| 131042 | Payment issue | Banner |
| 131047 | Re-engagement | Template |
| 131049 | Marketing limit | Aguardar 24h |
| 131056 | Pair rate limit | 1msg/6s |

---

## 🔗 Webhooks

| Limite | Valor |
|--------|-------|
| Payload máx | **3 MB** |
| Retry duration | **7 dias** |
| mTLS | Suportado |
