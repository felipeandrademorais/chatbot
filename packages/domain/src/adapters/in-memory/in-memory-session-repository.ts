import type { Session } from '../../aggregates/session.js'
import type { SessionRepository } from '../../repositories/session-repository.js'
import type { SessionId } from '../../value-objects/ids.js'

export class InMemorySessionRepository implements SessionRepository {
  private readonly store = new Map<string, Session>()

  save(session: Session): Promise<void> {
    this.store.set(session.id, session)
    return Promise.resolve()
  }

  findById(id: SessionId): Promise<Session | null> {
    return Promise.resolve(this.store.get(id) ?? null)
  }

  clear(): void {
    this.store.clear()
  }
}
