# Meta Official UTILITY Templates - Referência Completa

> Baseado em documentação oficial da Meta e 140+ templates da biblioteca oficial

---

## 🎯 Definição de UTILITY Template

> "Templates de utilidade são normalmente enviados em resposta a uma ação ou solicitação do usuário, como confirmação ou atualização de pedido."

**Requisito Crítico:** Se houver material de marketing, o template será **automaticamente reclassificado** como MARKETING.

---

## 📊 Componentes Suportados

| Componente | Obrigatório | Limite |
|------------|-------------|--------|
| Header | ❌ Opcional | Todos os tipos (TEXT, IMAGE, VIDEO, DOCUMENT) |
| Body | ✅ Sim | 1024 caracteres |
| Footer | ❌ Opcional | 60 caracteres |
| Buttons | ❌ Opcional | Até 10 botões |

**Tipos de Botões Permitidos:**
- `URL` - Link para website
- `PHONE_NUMBER` - Ligar
- `QUICK_REPLY` - Resposta rápida
- `COPY_CODE` - Copiar código
- `CALL_REQUEST` - Solicitar ligação

---

## 🔢 Formato de Variáveis

### Formato Posicional (Padrão)
```
{{1}}, {{2}}, {{3}}...
```

### Formato Nomeado (Novo)
```
{{first_name}}, {{order_number}}, {{date}}...
```

**Tipos de Variáveis Especiais:**
- `{{texto}}` - Texto genérico
- `{{número}}` - Número
- `{{data}}` - Data formatada
- `{{valor}}` - Valor monetário
- `{{endereço}}` - Endereço
- `{{nome comercial}}` - Nome da empresa

---

## 📋 Templates Oficiais Extraídos (50+)

### Categoria: Atualizações da Conta

| Nome | Body | Botão |
|------|------|-------|
| `account_creation_confirmation_3` | "Oi, {{texto}}, Sua nova conta foi criada com sucesso. Verifique {{texto}} para concluir seu perfil." | Verificar a conta |
| `address_update` | "Olá, {{texto}}, seu endereço de entrega foi atualizado com sucesso para {{texto}}. Contacte {{texto}} para quaisquer dúvidas." | - |

---

### Categoria: Agendamentos/Compromissos

| Nome | Body | Botão |
|------|------|-------|
| `appointment_cancellation_1` | "Olá, {{texto}}. Seu próximo compromisso com {{nome comercial}} em {{data}} às {{texto}} foi cancelado. Avise-nos se tiver alguma dúvida ou precisar reagendar." | Ver detalhes |
| `appointment_confirmation_1` | "Olá, {{texto}}. Obrigado por reservar com {{nome comercial}}. Sua consulta para {{texto}} em {{data}} às {{texto}} está confirmada." | Ver detalhes |
| `appointment_reminder` | "Lembrete: o nosso técnico irá visitar a sua localização no dia {{data}} às {{texto}} para a sua instalação de banda larga. Por favor, esteja disponível." | - |
| `appointment_reminder_2` | "Olá, {{texto}}. Este é um lembrete sobre o seu próximo compromisso com a {{nome comercial}} em {{data}} às {{texto}}. Estamos ansiosos por te ver!" | Ver detalhes |
| `appointment_reschedule_1` | "Olá, {{texto}}. Seu próximo compromisso com {{nome comercial}} foi reagendado para {{data}} às {{texto}}. Estamos ansiosos por te ver!" | Ver detalhes |
| `appointment_scheduling` | "Olá, {{texto}}, estamos agendando uma visita de técnico para sua {{texto}} em {{data}} entre {{texto}} e {{texto}}. Por favor confirme se este horário funciona para você." | Confirmar / Reagendar |
| `appointment_scheduling_address` | "Olá, {{texto}}, estamos agendando uma visita de técnico para a {{endereço}} em {{data}} entre {{texto}} e {{texto}}. Por favor confirme se este horário funciona para você." | Confirmar / Reagendar |
| `missed_appointment` | "Olá, {{texto}}, sentimos a tua falta na tua consulta agendada {{texto}} para {{data}}. Responda para reagendar ou entre em contato com {{texto}} para marcar um novo horário." | Reagendar |

---

### Categoria: Pagamentos e Cobranças

| Nome | Body | Botão |
|------|------|-------|
| `auto_pay_reminder_1` | "Oi, {{texto}}, Seu pagamento automático para a {{texto}} está programado para o dia {{data}} no valor de {{valor}}. Confira se o seu saldo é suficiente para evitar cobranças {{texto}}." | Ver conta |
| `auto_pay_reminder_2` | "Oi, {{texto}}, Este é um lembrete de que seu pagamento automático está chegando: Data: {{data}} Conta: {{texto}} Valor: {{valor}} Tenha um ótimo dia. Atenciosamente," | Ver detalhes |
| `auto_pay_reminder_3` | "Lembrete: Seu pagamento programado para o cartão {{texto}} com final {{número}} está previsto para {{data}}. Atenciosamente," | - |
| `card_transaction_alert_1` | "Uma cobrança de {{texto}} da {{número}} foi feita no seu cartão de {{valor}} com final {{texto}}." | - |
| `card_transaction_alert_2` | "Agradecemos por usar seu cartão de {{texto}}. Esta é uma confirmação da compra de {{data}}, no valor de {{valor}}, na {{texto}}." | - |
| `low_balance_warning_1` | "O {{texto}} na sua conta {{texto}} com final {{número}} está abaixo do {{texto}} predefinido de {{valor}}. Clique abaixo para adicionar fundos ou ligue para nós." | Fazer um depósito / Ligue para nós |
| `low_balance_warning_2` | "Oi, {{texto}}, o saldo disponível na sua conta {{texto}} com final {{número}} está abaixo do limite predefinido de {{valor}}." | Fazer um depósito / Ligue para nós |
| `low_balance_warning_3` | "Olá, {{texto}}, o seu saldo móvel é de {{valor}}. Por favor, recarregue para evitar interrupções." | Recarregar |

---

### Categoria: Entregas e Pedidos

| Nome | Body | Botão |
|------|------|-------|
| `delivery_confirmation_1` | "Olá, {{texto}}, seu pedido {{texto}} foi entregue com sucesso. Podes gerir a tua encomenda abaixo." | Gerir encomenda |
| `delivery_confirmation_2` | "Olá, {{texto}}, seu pedido {{texto}} foi entregue. Precisa devolver ou substituir um item? Clique para gerenciar seu pedido." | Gerir encomenda |
| `delivery_confirmation_3` | "{{texto}}, seu pedido {{texto}} foi entregue em {{data}}. Clique abaixo se você precisa devolver ou substituir algum item." | Iniciar devolução |
| `delivery_confirmation_4` | "{{texto}}, seu pedido foi entregue com sucesso em {{data}}. Obrigada pela compra." | - |
| `delivery_confirmation_5` | "Olá, {{texto}}, Ótimas notícias! Seu pedido {{texto}} foi entregue." | Ver pedido |
| `delivery_update_1` | "Olá, {{texto}}, seu pedido {{texto}} está a caminho e deve chegar em breve. Entrega estimada: {{texto}}" | Rastrear pedido |
| `delivery_update_2` | "Olá, {{texto}}, Ótimas notícias! Seu pedido {{texto}} foi entregue." | Ver pedido |
| `delivery_update_3` | "Seu pedido {{texto}} está pronto para entrega. Deve chegar até {{data}}. Obrigado pelo seu negócio." | Rastrear pedido |
| `delivery_update_4` | "Seu pedido {{texto}} saiu para entrega e tem previsão de chegar até {{data}}. Obrigada pela compra." | - |
| `delivery_failed_1` | "Olá, {{texto}}, Tentamos entregar seu pedido em {{data}}, mas não tivemos sucesso. Fale conosco pelo telefone {{telefone}} para agendarmos a entrega. Atenciosamente," | Gerenciar entrega / Ligue para nós |
| `delivery_failed_2` | "Não foi possível entregar o pedido {{texto}} hoje. {{texto}} para agendar outra tentativa de entrega." | Agendar entrega |

---

### Categoria: Cancelamentos e Reembolsos

| Nome | Body | Botão |
|------|------|-------|
| `order_cancelled_1` | "{{texto}}, seu pedido {{texto}} foi cancelado com sucesso. O reembolso será processado em {{número}} dias úteis. Atenciosamente," | Ver detalhes do pedido |
| `order_cancelled_2` | "{{texto}}, cancelamos o pedido {{texto}}, conforme sua solicitação. Seu {{texto}} será processado em {{número}} dias úteis. Você pode acompanhar abaixo." | Ver detalhes do pedido |
| `order_cancellation_confirmation` | "Oi! Esta é uma confirmação de que seu pedido recente {{texto}} foi cancelado com sucesso. Atenciosamente," | Ver detalhes do pedido |
| `order_cancellation_2` | "Olá {{texto}}. Seu pedido {{texto}} foi cancelado. Um reembolso será emitido para o seu método de pagamento original em breve." | Detalhes do pedido |

---

### Categoria: Feedback e Pesquisa

| Nome | Body | Botão |
|------|------|-------|
| `feedback_survey_1` | "Olá, {{texto}}, Obrigado por sua recente {{texto}} em {{data}}. Nós valorizamos o seu feedback e gostaríamos que compartilhasse mais sobre a sua experiência conosco no link abaixo. Isto deve demorar apenas {{número}} minutos. Agradecemos o seu tempo." | Deixe feedback |
| `feedback_survey_2` | "Agradecemos por nos visitar em {{endereço}} no dia {{data}}. Seu feedback é importante para nós. Responda a esta pesquisa breve para nos informar como podemos melhorar." | Preencher pesquisa |
| `feedback_survey_form_1` | "Classifique sua experiência. Seu feedback é importante para nós. Responda a uma pesquisa rápida sobre sua experiência recente com o {{texto}}." | Responder à pesquisa |
| `feedback_survey_form_2` | "O feedback dos clientes é importante para o {{texto}}. Ele é usado para melhorarmos nossos {{texto}} de forma contínua. Preencha uma {{texto}} breve (link abaixo) para nos contar como foi a {{texto}} recente que fez conosco. Desde já agradecemos." | Responder à pesquisa |
| `feedback_collection` | "Olá, {{texto}}, o pedido de serviço que concluímos em {{data}} está encerrado. Classifique sua experiência de 1-5 e compartilhe qualquer feedback para nos ajudar a melhorar." | - |

---

### Categoria: Alertas de Fraude

| Nome | Body | Botão |
|------|------|-------|
| `fraud_alert_1` | "Olá, {{texto}}, Detectamos uma transação {{texto}} de {{texto}} no seu {{texto}}, no valor de {{valor}}. Caso não tenha feito essa transação, entre em contato {{texto}} pelo número {{telefone}}. Você também pode clicar abaixo para bloquear seu {{texto}}. Atenciosamente," | Ligue para nós / Bloquear cartão |
| `fraud_alert_2` | "Olá, {{texto}}, Aqui é a {{texto}}. Identificamos uma transação {{texto}} no seu cartão {{texto}} com final {{número}}. Data: {{data}} Estabelecimento: {{texto}} Valor: {{valor}} Você fez essa compra?" | Sim / Não |

---

### Categoria: Eventos

| Nome | Body | Botão |
|------|------|-------|
| `event_details_reminder_1` | "Você tem um evento futuro. Lembrete: você respondeu a este evento por {{texto}}. O evento começa em {{texto}} em {{data}} em {{texto}} localização." | - |
| `event_details_reminder_2` | "Lembrete: {{texto}} está chegando e você confirmou presença neste evento por {{texto}}. Vejo-te em {{texto}} em {{texto}} hora local." | - |
| `event_rsvp_confirmation_1` | "Obrigado por responder a undefined por undefined. Vejo-te em undefined em undefined hora local." | - |
| `event_rsvp_confirmation_2` | "Sua presença no evento {{texto}} de {{texto}} está confirmada. Obrigado." | - |

---

### Categoria: Instalação e Suporte Técnico

| Nome | Body | Botão |
|------|------|-------|
| `installation_complete` | "Olá, John, a sua instalação Fibre Broadband está concluída! O nosso técnico configurou a tua ligação, o agora estás pronto para entrar online. Se tiver algum problema, não hesite em responder ou contactar suporte@teleco.com para obter ajuda." | - |
| `network_troubleshooting` | "Olá, entendemos que você pode estar enfrentando problemas de rede em {{texto}}. Pode experimentar estes passos simples: Passo 1: {{texto}}, Passo 2: {{texto}}, Passo 3: {{texto}}. Precisa de mais ajuda? Contacte: {{texto}} ou veja detalhes." | Ver detalhes |
| `device_recovery` | "Olá, {{texto}}, a tua ligação de banda larga foi desligada. Para devolveres o teu dispositivo, segue estes passos: {{texto}}. Você também pode entrar em contato conosco em {{texto}} para obter ajuda." | - |

---

### Categoria: Grupos e Comunidade

| Nome | Body | Botão |
|------|------|-------|
| `group_invite` | "Olá, {{texto}}, o teu pedido para serviço de {{texto}} da {{texto}} foi recebido com sucesso! Você pode começar o serviço clicando e juntando-se ao grupo abaixo. {{group_id}} Obrigado!" | - |
| `group_invite_2` | "Hi {{texto}}, Temos o prazer de informar que o seu pedido para {{texto}} da {{texto}} foi recebido com sucesso. Para facilitar a sua sessão, criamos um grupo dedicado no WhatsApp. Por favor, junte-se ao grupo usando o link abaixo para prosseguir com o seu pedido:" | - |

---

## 🔑 Padrões de Sucesso Identificados

### ✅ Frases de Abertura Aprovadas
- "Olá, {{texto}},"
- "Oi, {{texto}},"
- "{{texto}}, seu pedido..."
- "Este é um lembrete..."
- "Lembrete:"
- "Obrigado por..."
- "Agradecemos por..."

### ✅ Frases de Encerramento Aprovadas
- "Atenciosamente,"
- "Obrigado."
- "Obrigada pela compra."
- "Estamos ansiosos por te ver!"
- "Tenha um ótimo dia."

### ✅ Textos de Botões Aprovados
- "Ver detalhes"
- "Ver pedido"
- "Rastrear pedido"
- "Gerenciar entrega"
- "Confirmar"
- "Reagendar"
- "Ligue para nós"
- "Fazer um depósito"
- "Detalhes do pedido"
- "Deixe feedback"
- "Preencher pesquisa"
- "Gerir encomenda"
- "Iniciar devolução"

---

## ⚠️ O Que NÃO Usar

### ❌ Palavras que Ativam MARKETING
- Exclusivo, limitado, apenas
- Última chance, não perca
- Oferta, desconto, grátis
- Promoção, bônus, brinde
- Garanta já, aproveite agora

### ❌ Padrões a Evitar
- Iniciar texto com variável: `{{1}} você tem...`
- Terminar texto com variável: `...em {{2}}`
- CTA agressivo: "Compre agora!", "Reserve já!"
- Menção a escassez: "Restam apenas X vagas"

---

## 📝 Exemplo de Template UTILITY Perfeito

```json
{
  "name": "pedido_confirmacao",
  "category": "UTILITY",
  "language": "pt_BR",
  "components": [
    {
      "type": "BODY",
      "text": "Olá, {{1}}. Seu pedido {{2}} foi confirmado com sucesso. A entrega está prevista para {{3}}. Obrigado pela compra.",
      "example": {
        "body_text": [["João", "12345", "15/12/2024"]]
      }
    },
    {
      "type": "FOOTER",
      "text": "Responda SAIR para não receber mais mensagens."
    },
    {
      "type": "BUTTONS",
      "buttons": [
        {
          "type": "URL",
          "text": "Ver pedido",
          "url": "https://exemplo.com/pedido/{{1}}"
        }
      ]
    }
  ]
}
```
