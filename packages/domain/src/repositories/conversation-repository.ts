import type { Conversation } from '../aggregates/conversation.js'
import type { ConversationId } from '../value-objects/ids.js'

export interface ConversationRepository {
  save(conversation: Conversation): Promise<void>
  findById(id: ConversationId): Promise<Conversation | null>
}
