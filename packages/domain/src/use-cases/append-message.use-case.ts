import type { AppendMessageInput, AppendMessageOutput } from '@chatbot/contracts'

import { DomainError } from '../errors/domain-error.js'
import type { ConversationRepository } from '../repositories/conversation-repository.js'
import { createConversationId, createRequestId } from '../value-objects/ids.js'

export class AppendMessageUseCase {
  constructor(private readonly conversations: ConversationRepository) {}

  async execute(input: AppendMessageInput): Promise<AppendMessageOutput> {
    createRequestId(input.requestId)
    const conversationId = createConversationId(input.conversationId)

    const existing = await this.conversations.findById(conversationId)
    if (existing === null) {
      throw new DomainError('NOT_FOUND', 'Conversation not found', { conversationId })
    }

    const updated = existing.appendMessage({
      role: input.role,
      content: input.content,
      ...(input.agentId !== undefined ? { agentId: input.agentId } : {}),
      ...(input.toolName !== undefined ? { toolName: input.toolName } : {}),
    })

    await this.conversations.save(updated)

    return {
      conversationId: updated.id,
      messageIndex: updated.messageCount() - 1,
      timestamp: updated.updatedAt.toISOString(),
    }
  }
}
