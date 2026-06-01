import type { DomainErrorCode, DomainErrorPayload } from '@chatbot/contracts'

export class DomainError extends Error {
  readonly code: DomainErrorCode
  readonly details: Readonly<Record<string, string | number | boolean>> | undefined

  constructor(
    code: DomainErrorCode,
    message: string,
    details?: Readonly<Record<string, string | number | boolean>>,
  ) {
    super(message)
    this.name = 'DomainError'
    this.code = code
    this.details = details
  }

  toPayload(): DomainErrorPayload {
    if (this.details === undefined) {
      return { code: this.code, message: this.message }
    }
    return { code: this.code, message: this.message, details: this.details }
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError
}
