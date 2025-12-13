# Flow Engine Node Executors

Este diretório contém todos os executores de nós do Flow Engine. Cada executor implementa a interface `NodeExecutor` e é registrado no registry central.

## Arquitetura

```
┌─────────────────┐
│  Node Registry  │  ← Registro central de todos os executores
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│ Node  │ │ Node  │  ← Cada nó implementa NodeExecutor
│ Exec  │ │ Exec  │
└───────┘ └───────┘
```

## Interface NodeExecutor

```typescript
interface NodeExecutor<T = unknown> {
  /** Tipo do nó (deve corresponder ao type no FlowNode) */
  type: string
  
  /** 
   * Executa o nó e retorna o resultado 
   * @param context - Contexto de execução com variáveis, edges, etc.
   * @param node - Dados do nó a ser executado
   * @returns Resultado da execução com mensagens e próximo nó
   */
  execute(
    context: ExecutionContext,
    node: FlowNode & { data: T }
  ): Promise<NodeExecutionResult>
  
  /**
   * Valida a configuração do nó (opcional)
   * @param node - Dados do nó
   * @param edges - Conexões do fluxo
   * @returns Resultado da validação com erros/warnings
   */
  validate?(
    node: FlowNode & { data: T },
    edges: FlowEdge[]
  ): ValidationResult
  
  /**
   * Processa resposta do usuário (opcional)
   * Usado por nós que aguardam input (menu, input, buttons)
   */
  processResponse?(
    context: ExecutionContext,
    node: FlowNode & { data: T }
  ): Promise<string | undefined>
}
```

## Criando um Novo Executor

### 1. Criar o arquivo do executor

```typescript
// lib/flow-engine/nodes/my-node.ts
import type { FlowNode, FlowEdge } from '@/types'
import type { 
  NodeExecutor, 
  ExecutionContext, 
  NodeExecutionResult,
  ValidationResult,
  WhatsAppMessagePayload 
} from './base'
import { findOutgoingEdge } from './base'

export interface MyNodeData {
  myField: string
  optionalField?: number
}

export const myNodeExecutor: NodeExecutor<MyNodeData> = {
  type: 'my_node',
  
  async execute(
    context: ExecutionContext,
    node: FlowNode & { data: MyNodeData }
  ): Promise<NodeExecutionResult> {
    const data = node.data
    
    // Validar dados obrigatórios
    if (!data.myField) {
      return { success: false, error: 'Campo obrigatório' }
    }
    
    // Processar variáveis
    const processedText = processText(data.myField, context.variables)
    
    // Criar mensagem (se aplicável)
    const message: WhatsAppMessagePayload = {
      type: 'text',
      payload: {
        messaging_product: 'whatsapp',
        to: context.contactPhone,
        type: 'text',
        text: { body: processedText },
      },
    }
    
    // Encontrar próximo nó
    const nextEdge = findOutgoingEdge(context.edges, node.id)
    
    return {
      success: true,
      messages: [message],
      nextNodeId: nextEdge?.target,
    }
  },
  
  validate(node, edges): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    
    if (!node.data.myField?.trim()) {
      errors.push('Campo myField é obrigatório')
    }
    
    const hasOutput = edges.some(e => e.source === node.id)
    if (!hasOutput) {
      warnings.push('Nó não está conectado')
    }
    
    return { valid: errors.length === 0, errors, warnings }
  },
}
```

### 2. Registrar no index.ts

```typescript
// lib/flow-engine/nodes/index.ts
import { myNodeExecutor } from './my-node'

// Na função initializeRegistry:
registerNodeExecutor(myNodeExecutor)
```

### 3. Adicionar tipo ao types.ts (se necessário)

```typescript
// types.ts
type NodeType = 
  | 'start'
  | 'message'
  | 'my_node'  // Novo tipo
  // ...
```

## Nós Disponíveis

### Mensagens de Texto

| Nó | Descrição | Espera Resposta |
|---|---|---|
| `message` | Mensagem de texto simples | ❌ |
| `template` | Template pré-aprovado do WhatsApp | Depende |

### Mídia

| Nó | Descrição | Espera Resposta |
|---|---|---|
| `image` | Imagem com caption opcional | ❌ |
| `video` | Vídeo com caption opcional | ❌ |
| `audio` | Áudio | ❌ |
| `document` | Documento com nome | ❌ |
| `sticker` | Figurinha | ❌ |
| `location` | Localização com mapa | ❌ |
| `contacts` | Cartão de contato (vCard) | ❌ |
| `reaction` | Emoji de reação | ❌ |

### Interativos

| Nó | Descrição | Espera Resposta |
|---|---|---|
| `buttons` | Botões de resposta rápida (até 3) | ✅ |
| `list` | Lista com seções (até 10 itens) | ✅ |
| `menu` | Menu automático (buttons ou list) | ✅ |
| `input` | Coleta texto do usuário | ✅ |
| `cta_url` | Botão com URL | ❌ |
| `carousel` | Carrossel de cards | ✅ |

### Controle de Fluxo

| Nó | Descrição | Espera Resposta |
|---|---|---|
| `start` | Início do fluxo | ❌ |
| `end` | Fim do fluxo | ❌ |
| `condition` | If/Else baseado em variáveis | ❌ |
| `delay` | Espera X segundos | ❌ |
| `jump` | Salta para outro nó | ❌ |
| `handoff` | Transfere para humano | ❌ |

### Avançados

| Nó | Descrição | Espera Resposta |
|---|---|---|
| `ai_agent` | Resposta de IA (Gemini) | ❌ |

## Contexto de Execução

O `ExecutionContext` fornece:

```typescript
interface ExecutionContext {
  executionId: string        // ID da execução
  flowId: string             // ID do fluxo
  mode: 'campaign' | 'chatbot'
  contactPhone: string       // Telefone E.164
  nodes: FlowNode[]          // Todos os nós do fluxo
  edges: FlowEdge[]          // Todas as conexões
  currentNodeId: string      // Nó atual
  variables: Record<string, string>
  
  // Mensagem recebida (modo chatbot)
  incomingMessage?: {
    type: string
    text?: string
    buttonId?: string
    listId?: string
    messageId: string
  }
  
  // Helpers
  sendMessage(payload: WhatsAppMessagePayload): Promise<SendResult>
  setVariable(key: string, value: string): Promise<void>
  log(message: string, level?: 'debug' | 'error'): void
}
```

## Resultado da Execução

O `NodeExecutionResult` deve retornar:

```typescript
interface NodeExecutionResult {
  success: boolean
  error?: string
  
  // Mensagens a enviar
  messages?: WhatsAppMessagePayload[]
  
  // Navegação
  nextNodeId?: string
  
  // Controle de fluxo
  pauseExecution?: boolean   // Parar e aguardar resposta
  endConversation?: boolean  // Finalizar conversa
  collectInput?: {           // Aguardar input do usuário
    variableName: string
    validationType?: string
  }
  
  // Delay
  delayMs?: number           // Tempo de espera antes de continuar
  
  // Output para debug/tracking
  output?: Record<string, unknown>
}
```

## Helpers Disponíveis

```typescript
import { 
  findOutgoingEdge,      // Encontra próxima conexão
  findEdgeByHandle,      // Encontra conexão por handle específico
  findStartNode,         // Encontra nó de início
  getNodeById,           // Busca nó por ID
} from './base'

import { processText } from '../variables'  // Substitui {{variáveis}}
```

## Boas Práticas

1. **Validar dados de entrada** antes de processar
2. **Usar processText** para substituir variáveis
3. **Implementar validate()** para feedback no editor
4. **Logar com context.log()** para debugging
5. **Retornar mensagens de erro claras** em português
6. **Documentar campos do data** com TypeScript

## Testes

```typescript
// tests/unit/flow-engine/nodes/my-node.test.ts
import { describe, it, expect, vi } from 'vitest'
import { myNodeExecutor } from '@/lib/flow-engine/nodes/my-node'

describe('myNodeExecutor', () => {
  const mockContext = {
    executionId: 'test-123',
    flowId: 'flow-123',
    mode: 'chatbot',
    contactPhone: '+5511999999999',
    nodes: [],
    edges: [],
    currentNodeId: 'node-1',
    variables: { nome: 'João' },
    sendMessage: vi.fn(),
    setVariable: vi.fn(),
    log: vi.fn(),
  }

  it('should execute successfully', async () => {
    const node = {
      id: 'node-1',
      type: 'my_node',
      data: { myField: 'Olá {{nome}}' },
    }
    
    const result = await myNodeExecutor.execute(mockContext, node)
    
    expect(result.success).toBe(true)
    expect(result.messages).toHaveLength(1)
  })
  
  it('should fail without required field', async () => {
    const node = {
      id: 'node-1',
      type: 'my_node',
      data: { myField: '' },
    }
    
    const result = await myNodeExecutor.execute(mockContext, node)
    
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})
```
