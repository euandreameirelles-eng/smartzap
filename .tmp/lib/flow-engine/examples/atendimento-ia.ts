/**
 * Exemplo: Flow de Atendimento com IA
 * 
 * Este exemplo demonstra como usar os plugins do Flow Engine.
 * Note: Este é um exemplo ilustrativo - os tipos de nós customizados
 * (openai, http, condition) são extensões do Flow Engine.
 */

// Definição do flow em formato JSON
// Este formato é usado pelo executor do Flow Engine
export const atendimentoIAFlowJSON = {
  id: 'atendimento-ia',
  name: 'Atendimento Inteligente com IA',
  version: '1.0.0',
  trigger: {
    type: 'message',
    patterns: ['oi', 'olá', 'bom dia', 'boa tarde', 'ajuda', 'suporte'],
  },
  nodes: [
    // 1. Buscar dados do cliente no CRM
    {
      id: 'fetch-customer',
      type: 'http',
      data: {
        method: 'GET',
        url: 'https://api.crm.example.com/customers?phone={{contact.phone}}',
        headers: {
          Authorization: 'Bearer {{apiToken}}',
        },
        saveAs: 'customer',
        onError: {
          continueOnError: true,
          errorNextNodeId: 'new-customer-greeting',
        },
        nextNodeId: 'check-customer',
      },
    },

    // 2. Verificar se cliente existe
    {
      id: 'check-customer',
      type: 'condition',
      data: {
        conditions: [
          {
            field: 'customer.id',
            operator: 'isNotEmpty',
            nextNodeId: 'returning-customer-greeting',
          },
        ],
        defaultNextNodeId: 'new-customer-greeting',
      },
    },

    // 3a. Saudação para cliente existente
    {
      id: 'returning-customer-greeting',
      type: 'message',
      data: {
        text: 'Olá {{customer.name}}! 👋\n\nQue bom ter você de volta!\n\nComo posso ajudar hoje?',
        nextNodeId: 'wait-question',
      },
    },

    // 3b. Saudação para novo cliente
    {
      id: 'new-customer-greeting',
      type: 'message',
      data: {
        text: 'Olá! 👋 Bem-vindo ao nosso atendimento!\n\nSou o assistente virtual e estou aqui para ajudar.\n\nQual é o seu nome?',
        nextNodeId: 'capture-name',
      },
    },

    // 4. Capturar nome (wait input)
    {
      id: 'capture-name',
      type: 'wait-input',
      data: {
        variableName: 'userName',
        timeout: 300, // 5 minutos
        nextNodeId: 'confirm-name',
      },
    },

    // 5. Confirmar nome
    {
      id: 'confirm-name',
      type: 'message',
      data: {
        text: 'Prazer em conhecer você, {{userName}}! 😊\n\nComo posso ajudar?',
        nextNodeId: 'wait-question',
      },
    },

    // 6. Esperar pergunta do usuário
    {
      id: 'wait-question',
      type: 'wait-input',
      data: {
        variableName: 'userQuestion',
        timeout: 600, // 10 minutos
        nextNodeId: 'analyze-intent',
      },
    },

    // 7. Analisar intenção com IA
    {
      id: 'analyze-intent',
      type: 'openai',
      data: {
        model: 'gpt-4o-mini',
        systemPrompt: `Você é um assistente de classificação. Analise a mensagem e retorne APENAS uma das categorias:
- VENDAS: perguntas sobre produtos, preços, compras
- SUPORTE: problemas técnicos, reclamações
- INFO: informações gerais, horários, localização
- OUTRO: outros assuntos`,
        prompt: 'Classifique: "{{userQuestion}}"',
        maxTokens: 20,
        temperature: 0.1,
        saveAs: 'intent',
        nextNodeId: 'route-intent',
      },
    },

    // 8. Rotear baseado na intenção
    {
      id: 'route-intent',
      type: 'condition',
      data: {
        conditions: [
          { field: 'intent', operator: 'contains', value: 'VENDAS', nextNodeId: 'sales-response' },
          { field: 'intent', operator: 'contains', value: 'SUPORTE', nextNodeId: 'support-response' },
          { field: 'intent', operator: 'contains', value: 'INFO', nextNodeId: 'info-response' },
        ],
        defaultNextNodeId: 'general-response',
      },
    },

    // 9a. Resposta de Vendas
    {
      id: 'sales-response',
      type: 'openai',
      data: {
        model: 'gpt-4o-mini',
        systemPrompt: `Você é um vendedor simpático e prestativo. Responda sobre produtos e preços.
Produtos disponíveis:
- Plano Básico: R$ 49/mês
- Plano Pro: R$ 99/mês
- Plano Enterprise: R$ 299/mês`,
        prompt: '{{userQuestion}}',
        maxTokens: 200,
        temperature: 0.7,
        saveAs: 'aiResponse',
        nextNodeId: 'send-ai-response',
      },
    },

    // 9b. Resposta de Suporte
    {
      id: 'support-response',
      type: 'openai',
      data: {
        model: 'gpt-4o-mini',
        systemPrompt: `Você é um técnico de suporte prestativo. Ajude a resolver problemas técnicos de forma clara e objetiva.`,
        prompt: '{{userQuestion}}',
        maxTokens: 300,
        temperature: 0.5,
        saveAs: 'aiResponse',
        nextNodeId: 'send-ai-response',
      },
    },

    // 9c. Resposta de Informações
    {
      id: 'info-response',
      type: 'message',
      data: {
        text: `📍 *Nossas Informações*

🕐 Horário: Seg-Sex, 9h às 18h
📍 Endereço: Rua Example, 123
📞 Telefone: (11) 1234-5678
🌐 Site: www.example.com

Posso ajudar com mais alguma coisa?`,
        nextNodeId: 'offer-continue',
      },
    },

    // 9d. Resposta Geral
    {
      id: 'general-response',
      type: 'openai',
      data: {
        model: 'gpt-4o-mini',
        systemPrompt: `Você é um assistente virtual amigável. Responda de forma educada e ofereça ajuda.`,
        prompt: '{{userQuestion}}',
        maxTokens: 150,
        temperature: 0.8,
        saveAs: 'aiResponse',
        nextNodeId: 'send-ai-response',
      },
    },

    // 10. Enviar resposta da IA
    {
      id: 'send-ai-response',
      type: 'message',
      data: {
        text: '{{aiResponse}}',
        nextNodeId: 'offer-continue',
      },
    },

    // 11. Oferecer continuidade
    {
      id: 'offer-continue',
      type: 'buttons',
      data: {
        text: 'Posso ajudar com mais alguma coisa?',
        buttons: [
          { id: 'sim', title: '✅ Sim, tenho outra dúvida' },
          { id: 'nao', title: '❌ Não, obrigado' },
          { id: 'humano', title: '👤 Falar com atendente' },
        ],
        nextNodeId: 'handle-continue',
      },
    },

    // 12. Processar resposta de continuidade
    {
      id: 'handle-continue',
      type: 'condition',
      data: {
        conditions: [
          { field: 'buttonId', operator: 'eq', value: 'sim', nextNodeId: 'wait-question' },
          { field: 'buttonId', operator: 'eq', value: 'humano', nextNodeId: 'transfer-human' },
        ],
        defaultNextNodeId: 'goodbye',
      },
    },

    // 13. Transferir para humano
    {
      id: 'transfer-human',
      type: 'message',
      data: {
        text: '👤 Entendi! Vou transferir você para um de nossos atendentes.\n\nAguarde um momento, por favor...',
        // Aqui você poderia adicionar um nó HTTP para notificar o sistema de atendimento
      },
    },

    // 14. Despedida
    {
      id: 'goodbye',
      type: 'message',
      data: {
        text: 'Foi um prazer ajudar! 😊\n\nSe precisar de algo, é só mandar uma mensagem.\n\nAté mais! 👋',
      },
    },
  ],
} as const;

// Para uso com TypeScript estrito, pode-se criar uma interface customizada
export interface AIFlowDefinition {
  id: string;
  name: string;
  version: string;
  trigger: {
    type: string;
    patterns: string[];
  };
  nodes: Array<{
    id: string;
    type: string;
    data: Record<string, unknown>;
  }>;
}

export const atendimentoIAFlow = atendimentoIAFlowJSON as unknown as AIFlowDefinition;

export default atendimentoIAFlow;
