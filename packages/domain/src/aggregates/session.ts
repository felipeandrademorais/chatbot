import type { ConversationId, SessionId, UserId } from '../value-objects/ids.js'
import { DomainError } from '../errors/domain-error.js'

export interface SessionProps {
  readonly id: SessionId
  readonly userId: UserId | undefined
  readonly channel: string | undefined
  readonly conversationIds: readonly ConversationId[]
  readonly createdAt: Date
}

export class Session {
  readonly id: SessionId
  readonly userId: UserId | undefined
  readonly channel: string | undefined
  readonly conversationIds: readonly ConversationId[]
  readonly createdAt: Date

  private constructor(props: SessionProps) {
    this.id = props.id
    this.userId = props.userId
    this.channel = props.channel
    this.conversationIds = [...props.conversationIds]
    this.createdAt = props.createdAt
  }

  static create(
    id: SessionId,
    options: { userId?: UserId; channel?: string; now?: Date } = {},
  ): Session {
    const channel = options.channel?.trim()
    if (channel?.length === 0) {
      throw new DomainError('INVALID_ARGUMENT', 'Channel must not be empty when provided')
    }

    return new Session({
      id,
      userId: options.userId,
      channel: channel && channel.length > 0 ? channel : undefined,
      conversationIds: [],
      createdAt: options.now ?? new Date(),
    })
  }

  linkConversation(conversationId: ConversationId): Session {
    if (this.conversationIds.includes(conversationId)) {
      throw new DomainError('DUPLICATE_ENTITY', 'Conversation already linked to session', {
        sessionId: this.id,
        conversationId,
      })
    }

    return new Session({
      id: this.id,
      userId: this.userId,
      channel: this.channel,
      conversationIds: [...this.conversationIds, conversationId],
      createdAt: this.createdAt,
    })
  }
}
