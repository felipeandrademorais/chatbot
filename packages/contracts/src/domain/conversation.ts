/**
 * Conversation use-case DTO contracts.
 *
 * @module @chatbot/contracts/domain/conversation
 * @version 1.0.0
 * @since stage-03-core-domain
 */

import type { MessageRole } from '../message.js'

/** Input for creating a conversation in a session. */
export interface CreateConversationInput {
  readonly sessionId: string
  readonly requestId: string
}

/** Output after a conversation is created. */
export interface CreateConversationOutput {
  readonly conversationId: string
  readonly sessionId: string
  readonly createdAt: string
}

/** Input for appending a message to a conversation. */
export interface AppendMessageInput {
  readonly conversationId: string
  readonly role: MessageRole
  readonly content: string
  readonly requestId: string
  readonly agentId?: string
  readonly toolName?: string
}

/** Output after a message is appended. */
export interface AppendMessageOutput {
  readonly conversationId: string
  readonly messageIndex: number
  readonly timestamp: string
}
