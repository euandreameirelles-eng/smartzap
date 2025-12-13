/**
 * Plugin: HTTP Request Node
 * 
 * Faz chamadas HTTP para APIs externas.
 * Útil para integrar com CRMs, ERPs, webhooks, etc.
 * 
 * @example
 * {
 *   "id": "get-customer",
 *   "type": "http",
 *   "data": {
 *     "method": "GET",
 *     "url": "https://api.crm.com/customers/{{phone}}",
 *     "headers": { "Authorization": "Bearer {{apiToken}}" },
 *     "saveAs": "customer",
 *     "nextNodeId": "send-welcome"
 *   }
 * }
 */

import { registerNodeExecutor } from '../nodes';
import type { NodeExecutor, ExecutionContext, NodeExecutionResult } from '../nodes/base';
import type { FlowNode } from '@/types';

// ============================================
// TIPOS
// ============================================

interface HTTPNodeData {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  saveAs?: string;
  nextNodeId?: string;
  onError?: {
    continueOnError?: boolean;
    errorNextNodeId?: string;
  };
}

// ============================================
// EXECUTOR
// ============================================

const httpExecutor: NodeExecutor = {
  type: 'http',

  async execute(context: ExecutionContext, node: FlowNode): Promise<NodeExecutionResult> {
    const data = node.data as HTTPNodeData;

    try {
      // Interpolar variáveis na URL
      const url = interpolate(data.url, context);

      // Interpolar variáveis nos headers
      const headers: Record<string, string> = {};
      if (data.headers) {
        for (const [key, value] of Object.entries(data.headers)) {
          headers[key] = interpolate(value, context);
        }
      }

      // Interpolar variáveis no body
      let body: string | undefined;
      if (data.body) {
        const bodyStr = JSON.stringify(data.body);
        body = interpolate(bodyStr, context);
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      }

      // Fazer requisição
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), data.timeout || 30000);

      const response = await fetch(url, {
        method: data.method,
        headers,
        body: data.method !== 'GET' ? body : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // Parsear resposta
      const contentType = response.headers.get('content-type') || '';
      let responseData: unknown;

      if (contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      const output: Record<string, unknown> = {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries()),
      };

      if (data.saveAs) {
        output[data.saveAs] = responseData;
      }

      // Verificar se resposta foi bem sucedida
      if (!response.ok) {
        if (data.onError?.continueOnError) {
          return {
            success: true,
            output: { ...output, error: true },
            nextNodeId: data.onError.errorNextNodeId || data.nextNodeId,
          };
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        success: true,
        output,
        nextNodeId: data.nextNodeId,
      };
    } catch (error) {
      if (data.onError?.continueOnError) {
        return {
          success: true,
          output: {
            error: true,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
          nextNodeId: data.onError.errorNextNodeId,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro na requisição HTTP',
      };
    }
  },

  validate(node: FlowNode) {
    const data = node.data as HTTPNodeData;
    const errors: string[] = [];

    if (!data.method) {
      errors.push('method é obrigatório');
    }

    if (!data.url) {
      errors.push('url é obrigatória');
    } else if (!data.url.startsWith('http://') && !data.url.startsWith('https://')) {
      errors.push('url deve começar com http:// ou https://');
    }

    if (data.timeout && data.timeout < 1000) {
      errors.push('timeout deve ser no mínimo 1000ms');
    }

    return { valid: errors.length === 0, errors };
  },
};

// ============================================
// HELPERS
// ============================================

function interpolate(text: string, context: ExecutionContext): string {
  return text.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
    const parts = path.split('.');
    let value: unknown = context;

    for (const part of parts) {
      if (value && typeof value === 'object') {
        if (part in value) {
          value = (value as Record<string, unknown>)[part];
        } else if (
          'variables' in value &&
          typeof (value as ExecutionContext).variables === 'object'
        ) {
          value = (value as ExecutionContext).variables?.[part];
        } else {
          return match;
        }
      } else {
        return match;
      }
    }

    return value !== undefined ? String(value) : match;
  });
}

// ============================================
// REGISTRO
// ============================================

export function registerHTTPPlugin(): void {
  registerNodeExecutor(httpExecutor);
  console.log('[Flow Engine] Plugin HTTP registrado');
}

registerHTTPPlugin();

export { httpExecutor };
export type { HTTPNodeData };
