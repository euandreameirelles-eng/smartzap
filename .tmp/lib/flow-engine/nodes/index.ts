/**
 * Flow Engine Node Registry
 * 
 * Plugin-based registry for node executors.
 * New nodes can be registered by implementing the NodeExecutor interface.
 */

import type { NodeExecutor, NodeExecutorRegistry } from './base'
import type { FlowNode, FlowEdge } from '@/types'

// =============================================================================
// NODE EXECUTOR IMPORTS
// =============================================================================

// Re-export base types
export * from './base'

// Import new NodeExecutor implementations
import { messageNodeExecutor } from './message'
import { imageNodeExecutor } from './image'
import { videoNodeExecutor } from './video'
import { audioNodeExecutor } from './audio'
import { documentNodeExecutor } from './document'
import { locationNodeExecutor } from './location'
import { stickerNodeExecutor } from './sticker'
import { contactsNodeExecutor } from './contacts'
import { carouselNodeExecutor } from './carousel'
import { ctaUrlNodeExecutor } from './cta-url'
import { buttonsNodeExecutor } from './buttons'
import { listNodeExecutor } from './list'
import { templateNodeExecutor } from './template'
import { reactionNodeExecutor } from './reaction'
import { menuNodeExecutor } from './menu-executor'
import { inputNodeExecutor } from './input-executor'
import { delayNodeExecutor } from './delay-executor'
import { conditionNodeExecutor } from './condition-executor'
import { handoffNodeExecutor } from './handoff-executor'
import { endNodeExecutor } from './end-executor'
import { startNodeExecutor } from './start-executor'
import { jumpNodeExecutor } from './jump'
import { handleJumpNode, type JumpNodeData, type JumpNodeResult } from './jump'

// Import existing handlers (legacy - will be wrapped)
import { handleMessageNode, validateMessageNode, type MessageNodeData, type MessageNodeResult } from './message'
import { handleStartNode, type StartNodeResult } from './start'
import { handleEndNode, type EndNodeResult } from './end'
import { handleMenuNode, type MenuNodeResult } from './menu'
import { handleInputNode, type InputNodeResult, type InputValidationResult } from './input'
import { handleConditionNode, type ConditionNodeResult } from './condition'
import { handleDelayNode, type DelayNodeResult, type DelayNodeData } from './delay'
import { handleHandoffNode, type HandoffNodeResult } from './handoff'
import { handleImageNode, type ImageNodeResult, type ImageNodeData } from './image'
import { handleVideoNode, type VideoNodeData } from './video'
import { handleAudioNode, type AudioNodeData } from './audio'
import { handleDocumentNode, type DocumentNodeData } from './document'
import { handleLocationNode, type LocationNodeData } from './location'
import { handleStickerNode, type StickerNodeData } from './sticker'
import { handleContactsNode, type ContactsNodeData } from './contacts'
import { handleCarouselNode, type CarouselNodeData } from './carousel'
import { handleCtaUrlNode, type CtaUrlNodeData } from './cta-url'
import { handleButtonsNode, type ButtonsNodeData, type ButtonOption } from './buttons'
import { handleListNode, type ListNodeData, type ListSection, type ListItem } from './list'
import { handleAIAgentNode, type AIAgentNodeResult, type AIAgentNodeData } from './ai-agent'
import { handleReactionNode, type ReactionNodeData, type ReactionNodeResult } from './reaction'

// Re-export types for backward compatibility
export type {
  MessageNodeData, MessageNodeResult,
  StartNodeResult,
  EndNodeResult,
  MenuNodeResult,
  InputNodeResult, InputValidationResult,
  ConditionNodeResult,
  DelayNodeResult, DelayNodeData,
  HandoffNodeResult,
  ImageNodeResult, ImageNodeData,
  VideoNodeData,
  AudioNodeData,
  DocumentNodeData,
  LocationNodeData,
  StickerNodeData,
  ContactsNodeData,
  CarouselNodeData,
  CtaUrlNodeData,
  ButtonsNodeData, ButtonOption,
  ListNodeData, ListSection, ListItem,
  AIAgentNodeResult, AIAgentNodeData,
  ReactionNodeData, ReactionNodeResult,
  JumpNodeData, JumpNodeResult,
}

// Re-export handlers for backward compatibility
export {
  handleMessageNode, validateMessageNode,
  handleStartNode,
  handleEndNode,
  handleMenuNode,
  handleInputNode,
  handleConditionNode,
  handleDelayNode,
  handleHandoffNode,
  handleImageNode,
  handleVideoNode,
  handleAudioNode,
  handleDocumentNode,
  handleLocationNode,
  handleStickerNode,
  handleContactsNode,
  handleCarouselNode,
  handleCtaUrlNode,
  handleButtonsNode,
  handleListNode,
  handleAIAgentNode,
  handleJumpNode,
}

// =============================================================================
// NODE REGISTRY
// =============================================================================

/**
 * Global node executor registry
 * Maps node types to their executor implementations
 */
const nodeRegistry: NodeExecutorRegistry = {}

/**
 * Register a node executor
 * 
 * @example
 * ```typescript
 * registerNodeExecutor({
 *   type: 'my_custom_node',
 *   execute: async (context, node) => { ... },
 *   validate: (node, edges) => { ... }
 * })
 * ```
 */
export function registerNodeExecutor<T = unknown>(executor: NodeExecutor<T>): void {
  if (nodeRegistry[executor.type]) {
    console.warn(`[FlowEngine:Registry] Overwriting executor for node type: ${executor.type}`)
  }
  nodeRegistry[executor.type] = executor as NodeExecutor<unknown>
}

/**
 * Get a node executor by type
 */
export function getNodeExecutor(type: string): NodeExecutor<unknown> | undefined {
  return nodeRegistry[type]
}

/**
 * Check if a node type is registered
 */
export function isNodeTypeRegistered(type: string): boolean {
  return type in nodeRegistry
}

/**
 * Get all registered node types
 */
export function getRegisteredNodeTypes(): string[] {
  return Object.keys(nodeRegistry)
}

/**
 * Get the full registry (for debugging)
 */
export function getNodeRegistry(): Readonly<NodeExecutorRegistry> {
  return nodeRegistry
}

// =============================================================================
// LEGACY WRAPPER HELPERS
// =============================================================================

/**
 * Helper to wrap legacy handlers as NodeExecutor
 * This is a transitional helper while we migrate handlers to the new interface
 */
// Note: Individual node executors will be created in their respective files
// This registry provides the infrastructure for the plugin architecture

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize the node registry with built-in executors
 * Called automatically on import
 */
function initializeRegistry(): void {
  // Register message/content nodes
  registerNodeExecutor(messageNodeExecutor)
  registerNodeExecutor(imageNodeExecutor)
  
  // Register media nodes
  registerNodeExecutor(videoNodeExecutor)
  registerNodeExecutor(audioNodeExecutor)
  registerNodeExecutor(documentNodeExecutor)
  registerNodeExecutor(stickerNodeExecutor)
  registerNodeExecutor(locationNodeExecutor)
  registerNodeExecutor(contactsNodeExecutor)
  
  // Register interactive nodes
  registerNodeExecutor(carouselNodeExecutor)
  registerNodeExecutor(ctaUrlNodeExecutor)
  registerNodeExecutor(buttonsNodeExecutor)
  registerNodeExecutor(listNodeExecutor)
  
  // Register template node
  registerNodeExecutor(templateNodeExecutor)
  
  // Register flow control nodes
  registerNodeExecutor(menuNodeExecutor)
  registerNodeExecutor(inputNodeExecutor)
  registerNodeExecutor(delayNodeExecutor)
  registerNodeExecutor(conditionNodeExecutor)
  registerNodeExecutor(handoffNodeExecutor)
  registerNodeExecutor(endNodeExecutor)
  registerNodeExecutor(startNodeExecutor)
  registerNodeExecutor(jumpNodeExecutor)
  
  // Note: All node types are now registered!
}

// Run initialization
initializeRegistry()

