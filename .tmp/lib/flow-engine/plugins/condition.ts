/**
 * Plugin: Condition Node
 * 
 * Nó de decisão com suporte a múltiplas condições e operadores.
 * Permite criar branches condicionais no fluxo.
 * 
 * @example
 * {
 *   "id": "check-age",
 *   "type": "condition",
 *   "data": {
 *     "conditions": [
 *       { "field": "idade", "operator": "gte", "value": 18, "nextNodeId": "adulto" },
 *       { "field": "idade", "operator": "lt", "value": 18, "nextNodeId": "menor" }
 *     ],
 *     "defaultNextNodeId": "fallback"
 *   }
 * }
 */

import { registerNodeExecutor } from '../nodes';
import type { NodeExecutor, ExecutionContext, NodeExecutionResult } from '../nodes/base';
import type { FlowNode } from '@/types';

// ============================================
// TIPOS
// ============================================

type Operator = 
  | 'eq' | 'neq'           // igual, diferente
  | 'gt' | 'gte'           // maior, maior ou igual
  | 'lt' | 'lte'           // menor, menor ou igual
  | 'contains' | 'notContains'  // contém, não contém
  | 'startsWith' | 'endsWith'   // começa com, termina com
  | 'matches'              // regex
  | 'isEmpty' | 'isNotEmpty';   // vazio, não vazio

interface Condition {
  field: string;
  operator: Operator;
  value?: string | number | boolean;
  nextNodeId: string;
}

interface ConditionNodeData {
  conditions: Condition[];
  defaultNextNodeId?: string;
}

// ============================================
// EXECUTOR
// ============================================

const conditionExecutor: NodeExecutor = {
  type: 'condition',

  async execute(context: ExecutionContext, node: FlowNode): Promise<NodeExecutionResult> {
    const data = node.data as ConditionNodeData;

    for (const condition of data.conditions) {
      const fieldValue = getFieldValue(condition.field, context);
      const matches = evaluateCondition(fieldValue, condition.operator, condition.value);

      if (matches) {
        return {
          success: true,
          output: {
            matchedCondition: condition.field,
            matchedOperator: condition.operator,
            matchedValue: fieldValue,
          },
          nextNodeId: condition.nextNodeId,
        };
      }
    }

    // Nenhuma condição atendida
    return {
      success: true,
      output: { matchedCondition: null },
      nextNodeId: data.defaultNextNodeId,
    };
  },

  validate(node: FlowNode) {
    const data = node.data as ConditionNodeData;
    const errors: string[] = [];

    if (!data.conditions || data.conditions.length === 0) {
      errors.push('Pelo menos uma condição é obrigatória');
    }

    data.conditions?.forEach((cond, i) => {
      if (!cond.field) errors.push(`Condição ${i + 1}: field é obrigatório`);
      if (!cond.operator) errors.push(`Condição ${i + 1}: operator é obrigatório`);
      if (!cond.nextNodeId) errors.push(`Condição ${i + 1}: nextNodeId é obrigatório`);
    });

    return { valid: errors.length === 0, errors };
  },
};

// ============================================
// HELPERS
// ============================================

function getFieldValue(field: string, context: ExecutionContext): unknown {
  // Caminho com pontos: "contact.name" -> context.contact.name
  const parts = field.split('.');
  let value: unknown = context;

  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = (value as Record<string, unknown>)[part];
    } else if (context.variables && part in context.variables) {
      value = context.variables[part];
    } else {
      return undefined;
    }
  }

  return value;
}

function evaluateCondition(
  fieldValue: unknown,
  operator: Operator,
  compareValue?: string | number | boolean
): boolean {
  const strField = String(fieldValue ?? '').toLowerCase();
  const strCompare = String(compareValue ?? '').toLowerCase();

  switch (operator) {
    case 'eq':
      return fieldValue === compareValue || strField === strCompare;

    case 'neq':
      return fieldValue !== compareValue && strField !== strCompare;

    case 'gt':
      return Number(fieldValue) > Number(compareValue);

    case 'gte':
      return Number(fieldValue) >= Number(compareValue);

    case 'lt':
      return Number(fieldValue) < Number(compareValue);

    case 'lte':
      return Number(fieldValue) <= Number(compareValue);

    case 'contains':
      return strField.includes(strCompare);

    case 'notContains':
      return !strField.includes(strCompare);

    case 'startsWith':
      return strField.startsWith(strCompare);

    case 'endsWith':
      return strField.endsWith(strCompare);

    case 'matches':
      try {
        return new RegExp(String(compareValue), 'i').test(strField);
      } catch {
        return false;
      }

    case 'isEmpty':
      return fieldValue === undefined || fieldValue === null || strField === '';

    case 'isNotEmpty':
      return fieldValue !== undefined && fieldValue !== null && strField !== '';

    default:
      return false;
  }
}

// ============================================
// REGISTRO
// ============================================

export function registerConditionPlugin(): void {
  registerNodeExecutor(conditionExecutor);
  console.log('[Flow Engine] Plugin Condition registrado');
}

registerConditionPlugin();

export { conditionExecutor };
export type { ConditionNodeData, Condition, Operator };
