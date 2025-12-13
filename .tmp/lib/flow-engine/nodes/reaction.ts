/**
 * Reaction Node Executor
 * 
 * Executes WhatsApp reaction nodes.
 * Reactions allow sending emoji responses to specific messages.
 */

import type { FlowNode, FlowEdge } from '@/types'
import type { 
  NodeExecutor, 
  ExecutionContext, 
  NodeExecutionResult,
  WhatsAppMessagePayload,
  ValidationResult 
} from './base'
import { processText } from '../variables'
import { findOutgoingEdge } from './base'

// =============================================================================
// TYPES
// =============================================================================

export interface ReactionNodeData {
  /** The emoji to react with */
  emoji: string
  /** The message ID to react to (if not set, reacts to last received message) */
  messageId?: string
  /** Variable name containing the message ID */
  messageIdVariable?: string
}

// =============================================================================
// CONSTANTS
// =============================================================================

// Common reaction emojis
export const COMMON_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'] as const

// =============================================================================
// EXECUTOR
// =============================================================================

export const reactionNodeExecutor: NodeExecutor<ReactionNodeData> = {
  type: 'reaction',
  
  async execute(
    context: ExecutionContext,
    node: FlowNode & { data: ReactionNodeData }
  ): Promise<NodeExecutionResult> {
    const data = node.data
    const emoji = data.emoji

    if (!emoji) {
      return {
        success: false,
        error: 'Reaction emoji is required',
      }
    }

    // Determine which message to react to
    let targetMessageId = data.messageId

    // Check if we should get message ID from a variable
    if (data.messageIdVariable) {
      const varValue = context.variables[data.messageIdVariable]
      if (varValue) {
        targetMessageId = varValue
      }
    }

    // Default to the last received message (from incoming message context)
    if (!targetMessageId && context.incomingMessage?.messageId) {
      targetMessageId = context.incomingMessage.messageId
    }

    if (!targetMessageId) {
      console.log(`⚠️ [V3] Reaction node: No message ID to react to, skipping`)
      // Continue to next node without sending reaction
      const outgoingEdge = findOutgoingEdge(context.edges, node.id)
      return {
        success: true,
        messages: [],
        nextNodeId: outgoingEdge?.target,
      }
    }

    console.log(`😊 [V3] Sending reaction "${emoji}" to message ${targetMessageId}`)

    // Build WhatsApp reaction message payload
    const message: WhatsAppMessagePayload = {
      type: 'reaction',
      payload: {
        messaging_product: 'whatsapp',
        to: context.contactPhone,
        type: 'reaction',
        reaction: {
          message_id: targetMessageId,
          emoji: emoji,
        },
      },
    }

    // Find next node
    const outgoingEdge = findOutgoingEdge(context.edges, node.id)

    return {
      success: true,
      messages: [message],
      nextNodeId: outgoingEdge?.target,
    }
  },
  
  validate(node: FlowNode & { data: ReactionNodeData }, edges: FlowEdge[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    
    if (!node.data.emoji) {
      errors.push('Reaction emoji is required')
    }
    
    // Check if node has an outgoing edge
    const hasOutgoing = edges.some(e => e.source === node.id)
    if (!hasOutgoing) {
      warnings.push('Reaction node has no outgoing connection')
    }
    
    // Warn if no message ID source configured
    if (!node.data.messageId && !node.data.messageIdVariable) {
      warnings.push('No message ID configured - will react to last received message')
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  },
}

// =============================================================================
// LEGACY HANDLER (for backward compatibility)
// =============================================================================

export interface ReactionNodeResult {
  type: 'reaction'
  emoji: string
  messageId: string
}

export function handleReactionNode(
  node: FlowNode & { data: ReactionNodeData },
  variables: Record<string, string>,
  lastMessageId?: string
): ReactionNodeResult | null {
  const emoji = node.data.emoji
  
  if (!emoji) {
    return null
  }

  // Determine message ID
  let messageId = node.data.messageId
  
  if (node.data.messageIdVariable) {
    const varValue = variables[node.data.messageIdVariable]
    if (varValue) {
      messageId = varValue
    }
  }
  
  if (!messageId && lastMessageId) {
    messageId = lastMessageId
  }
  
  if (!messageId) {
    return null
  }
  
  return {
    type: 'reaction',
    emoji,
    messageId,
  }
}
