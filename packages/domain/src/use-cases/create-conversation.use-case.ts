import { randomUUID } from 'node:crypto'

import type { CreateConversationInput, CreateConversationOutput } from '@chatbot/contracts'

import { Conversation } from '../aggregates/conversation.js'
import { DomainError } from '../errors/domain-error.js'
import type { ConversationRepository } from '../repositories/conversation-repository.js'
import type { SessionRepository } from '../repositories/session-repository.js'
import { createConversationId, createRequestId, createSessionId } from '../value-objects/ids.js'

export class CreateConversationUseCase {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly conversations: ConversationRepository,
  ) {}

  async execute(input: CreateConversationInput): Promise<CreateConversationOutput> {
    createRequestId(input.requestId)
    const sessionId = createSessionId(input.sessionId)

    const session = await this.sessions.findById(sessionId)
    if (session === null) {
      throw new DomainError('NOT_FOUND', 'Session not found', { sessionId })
    }

    const conversationId = createConversationId(randomUUID())
    const conversation = Conversation.create(conversationId, sessionId)

    const linkedSession = session.linkConversation(conversationId)

    await this.sessions.save(linkedSession)
    await this.conversations.save(conversation)

    return {
      conversationId: conversation.id,
      sessionId: conversation.sessionId,
      createdAt: conversation.createdAt.toISOString(),
    }
  }
}
