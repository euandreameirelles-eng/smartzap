/**
 * Plugin: OpenAI Integration
 * 
 * Nó customizado que usa GPT para gerar respostas inteligentes
 * baseadas no contexto da conversa.
 * 
 * @example
 * // No seu flow JSON:
 * {
 *   "id": "ai-response-1",
 *   "type": "openai",
 *   "data": {
 *     "prompt": "Responda como um atendente simpático",
 *     "model": "gpt-4o-mini",
 *     "maxTokens": 150,
 *     "temperature": 0.7,
 *     "saveAs": "ai_response",
 *     "nextNodeId": "send-message"
 *   }
 * }
 */

import { registerNodeExecutor } from '../nodes';
import type { NodeExecutor, ExecutionContext, NodeExecutionResult } from '../nodes/base';
import type { FlowNode } from '@/types';

// ============================================
// TIPOS
// ============================================

interface OpenAINodeData {
  prompt: string;
  model?: 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo' | 'gpt-3.5-turbo';
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  includeHistory?: boolean;
  saveAs?: string;
  nextNodeId?: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ============================================
// EXECUTOR
// ============================================

const openaiExecutor: NodeExecutor = {
  type: 'openai',

  async execute(context: ExecutionContext, node: FlowNode): Promise<NodeExecutionResult> {
    const data = node.data as OpenAINodeData;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        error: 'OPENAI_API_KEY não configurada',
      };
    }

    try {
      // Construir mensagens
      const messages: Array<{ role: string; content: string }> = [];

      // System prompt
      if (data.systemPrompt) {
        messages.push({
          role: 'system',
          content: data.systemPrompt,
        });
      }

      // Histórico da conversa (se habilitado)
      if (data.includeHistory && context.conversationHistory) {
        messages.push(...context.conversationHistory.slice(-10)); // Últimas 10 mensagens
      }

      // Prompt do usuário com variáveis interpoladas
      const userPrompt = interpolateVariables(data.prompt, context);
      messages.push({
        role: 'user',
        content: userPrompt,
      });

      // Chamar API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: data.model || 'gpt-4o-mini',
          messages,
          max_tokens: data.maxTokens || 150,
          temperature: data.temperature ?? 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${error}`);
      }

      const result = (await response.json()) as OpenAIResponse;
      const aiResponse = result.choices[0]?.message?.content || '';

      // Salvar resposta em variável (se configurado)
      const output: Record<string, unknown> = {
        response: aiResponse,
        tokens: result.usage,
      };

      if (data.saveAs) {
        output[data.saveAs] = aiResponse;
      }

      return {
        success: true,
        output,
        nextNodeId: data.nextNodeId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao chamar OpenAI',
      };
    }
  },

  validate(node: FlowNode) {
    const data = node.data as OpenAINodeData;
    const errors: string[] = [];

    if (!data.prompt) {
      errors.push('prompt é obrigatório');
    }

    if (data.maxTokens && (data.maxTokens < 1 || data.maxTokens > 4096)) {
      errors.push('maxTokens deve estar entre 1 e 4096');
    }

    if (data.temperature !== undefined && (data.temperature < 0 || data.temperature > 2)) {
      errors.push('temperature deve estar entre 0 e 2');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

// ============================================
// HELPERS
// ============================================

function interpolateVariables(text: string, context: ExecutionContext): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    // Verificar em variáveis do contexto
    if (context.variables?.[key] !== undefined) {
      return String(context.variables[key]);
    }
    // Verificar contactName e contactPhone
    if (key === 'contactName' && context.contactName) {
      return context.contactName;
    }
    if (key === 'contactPhone' && context.contactPhone) {
      return context.contactPhone;
    }
    // Verificar última mensagem do usuário
    if (key === 'userMessage' && context.incomingMessage?.text) {
      return context.incomingMessage.text;
    }
    return match;
  });
}

// ============================================
// REGISTRO DO PLUGIN
// ============================================

export function registerOpenAIPlugin(): void {
  registerNodeExecutor(openaiExecutor);
  console.log('[Flow Engine] Plugin OpenAI registrado');
}

// Auto-registrar se importado
registerOpenAIPlugin();

export { openaiExecutor };
export type { OpenAINodeData };
