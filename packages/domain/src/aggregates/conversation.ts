import type { ConversationId, SessionId } from '../value-objects/ids.js'
import { ConversationMessage } from '../entities/conversation-message.js'
import type { ConversationMessageProps } from '../entities/conversation-message.js'
import { DomainError } from '../errors/domain-error.js'

export interface ConversationProps {
  readonly id: ConversationId
  readonly sessionId: SessionId
  readonly messages: readonly ConversationMessage[]
  readonly createdAt: Date
  readonly updatedAt: Date
}

export class Conversation {
  readonly id: ConversationId
  readonly sessionId: SessionId
  readonly messages: readonly ConversationMessage[]
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(props: ConversationProps) {
    this.id = props.id
    this.sessionId = props.sessionId
    this.messages = [...props.messages]
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt
  }

  static create(id: ConversationId, sessionId: SessionId, now: Date = new Date()): Conversation {
    return new Conversation({
      id,
      sessionId,
      messages: [],
      createdAt: now,
      updatedAt: now,
    })
  }

  appendMessage(props: Omit<ConversationMessageProps, 'timestamp'> & { timestamp?: Date }): Conversation {
    const timestamp = props.timestamp ?? new Date()
    const message = ConversationMessage.create({ ...props, timestamp })

    const last = this.messages.at(-1)
    if (last !== undefined && message.timestamp.getTime() < last.timestamp.getTime()) {
      throw new DomainError(
        'INVARIANT_VIOLATION',
        'Messages must be appended in non-decreasing timestamp order',
      )
    }

    const messages = [...this.messages, message]
    return new Conversation({
      id: this.id,
      sessionId: this.sessionId,
      messages,
      createdAt: this.createdAt,
      updatedAt: timestamp,
    })
  }

  messageCount(): number {
    return this.messages.length
  }
}
