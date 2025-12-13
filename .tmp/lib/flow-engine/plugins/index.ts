/**
 * Flow Engine Plugins
 * 
 * Plugins adicionam novos tipos de nós ao Flow Engine.
 * Importe este arquivo para registrar todos os plugins padrão.
 * 
 * @example
 * // Registrar todos os plugins
 * import 'lib/flow-engine/plugins';
 * 
 * // Ou importar plugins específicos
 * import { registerOpenAIPlugin } from 'lib/flow-engine/plugins/openai';
 * import { registerHTTPPlugin } from 'lib/flow-engine/plugins/http';
 */

// Plugins disponíveis
export { registerOpenAIPlugin, openaiExecutor } from './openai';
export { registerConditionPlugin, conditionExecutor } from './condition';
export { registerHTTPPlugin, httpExecutor } from './http';

// Types
export type { OpenAINodeData } from './openai';
export type { ConditionNodeData, Condition, Operator } from './condition';
export type { HTTPNodeData } from './http';

// Registro automático ao importar o index
import './openai';
import './condition';
import './http';

console.log('[Flow Engine] Todos os plugins carregados');
