/**
 * Message Contract
 *
 * Defines the message structures used in conversations
 * and inter-agent communication.
 *
 * @module @chatbot/contracts/message
 * @version 1.0.0
 */

/**
 * Role of a message participant.
 */
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool'

/**
 * A single message in a conversation thread.
 */
export interface Message {
  readonly role: MessageRole
  readonly content: string
  readonly timestamp: Date
  readonly metadata?: MessageMetadata
}

/**
 * Optional metadata attached to a message.
 */
export interface MessageMetadata {
  readonly agentId?: string
  readonly toolName?: string
  readonly requestId?: string
}

/**
 * A document retrieved from a knowledge base or external source.
 */
export interface RetrievedDocument {
  readonly id: string
  readonly content: string
  readonly source: string
  readonly score: number
  readonly metadata?: Record<string, unknown>
}
