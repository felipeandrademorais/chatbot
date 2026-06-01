import type { MessageRole } from '@chatbot/contracts'

import { DomainError } from '../errors/domain-error.js'

const MAX_MESSAGE_LENGTH = 32_000

const ALLOWED_ROLES: readonly MessageRole[] = ['user', 'assistant', 'system', 'tool']

export function assertValidMessageRole(role: MessageRole): void {
  if (!ALLOWED_ROLES.includes(role)) {
    throw new DomainError('INVALID_ARGUMENT', 'Invalid message role', { role })
  }
}

export function assertValidMessageContent(content: string): void {
  const trimmed = content.trim()
  if (trimmed.length === 0) {
    throw new DomainError('INVARIANT_VIOLATION', 'Message content must not be empty')
  }
  if (content.length > MAX_MESSAGE_LENGTH) {
    throw new DomainError('INVARIANT_VIOLATION', 'Message content exceeds maximum length', {
      maxLength: MAX_MESSAGE_LENGTH,
    })
  }
}
