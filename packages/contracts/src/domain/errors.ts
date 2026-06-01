/**
 * Domain error taxonomy consumed by APIs and orchestration layers.
 *
 * @module @chatbot/contracts/domain/errors
 * @version 1.0.0
 * @since stage-03-core-domain
 */

/**
 * Stable error codes for domain failures.
 * Add new codes as minor contract bumps; renames require major bump.
 */
export type DomainErrorCode =
  | 'INVALID_ARGUMENT'
  | 'NOT_FOUND'
  | 'INVARIANT_VIOLATION'
  | 'INVALID_STATE_TRANSITION'
  | 'DUPLICATE_ENTITY'
  | 'CONFLICT'

/**
 * Serializable domain error payload returned by use cases and APIs.
 */
export interface DomainErrorPayload {
  readonly code: DomainErrorCode
  readonly message: string
  readonly details?: Readonly<Record<string, string | number | boolean>>
}
