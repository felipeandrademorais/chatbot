import type { Conversation } from '../../aggregates/conversation.js'
import type { ConversationRepository } from '../../repositories/conversation-repository.js'
import type { ConversationId } from '../../value-objects/ids.js'

export class InMemoryConversationRepository implements ConversationRepository {
  private readonly store = new Map<string, Conversation>()

  save(conversation: Conversation): Promise<void> {
    this.store.set(conversation.id, conversation)
    return Promise.resolve()
  }

  findById(id: ConversationId): Promise<Conversation | null> {
    return Promise.resolve(this.store.get(id) ?? null)
  }

  clear(): void {
    this.store.clear()
  }
}
