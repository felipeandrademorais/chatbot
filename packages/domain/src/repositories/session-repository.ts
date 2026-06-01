import type { Session } from '../aggregates/session.js'
import type { SessionId } from '../value-objects/ids.js'

export interface SessionRepository {
  save(session: Session): Promise<void>
  findById(id: SessionId): Promise<Session | null>
}
