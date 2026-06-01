/**
 * Session use-case DTO contracts.
 *
 * @module @chatbot/contracts/domain/session
 * @version 1.0.0
 * @since stage-03-core-domain
 */

/** Input for creating or resolving a session. */
export interface CreateSessionInput {
  readonly requestId: string
  readonly userId?: string
  readonly channel?: string
}

/** Output after a session is created. */
export interface CreateSessionOutput {
  readonly sessionId: string
  readonly userId?: string
  readonly channel?: string
  readonly createdAt: string
}
