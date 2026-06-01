import { randomUUID } from 'node:crypto'

import type { CreateSessionInput, CreateSessionOutput } from '@chatbot/contracts'

import { Session } from '../aggregates/session.js'
import type { SessionRepository } from '../repositories/session-repository.js'
import { createRequestId, createSessionId, createUserId } from '../value-objects/ids.js'

export class CreateSessionUseCase {
  constructor(private readonly sessions: SessionRepository) {}

  async execute(input: CreateSessionInput): Promise<CreateSessionOutput> {
    createRequestId(input.requestId)

    const sessionId = createSessionId(randomUUID())
    const userId = input.userId !== undefined ? createUserId(input.userId) : undefined

    const session = Session.create(sessionId, {
      ...(userId !== undefined ? { userId } : {}),
      ...(input.channel !== undefined ? { channel: input.channel } : {}),
    })

    await this.sessions.save(session)

    return {
      sessionId: session.id,
      ...(session.userId !== undefined ? { userId: session.userId } : {}),
      ...(session.channel !== undefined ? { channel: session.channel } : {}),
      createdAt: session.createdAt.toISOString(),
    }
  }
}
