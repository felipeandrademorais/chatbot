import { describe, expect, it } from 'vitest'

import { DomainError } from '../src/errors/domain-error.js'
import {
  assertValidMessageContent,
  assertValidMessageRole,
  createConversationId,
  createRequestId,
  createSessionId,
} from '../src/value-objects/index.js'

describe('value objects', () => {
  it('creates branded ids for valid input', () => {
    expect(createConversationId('conv-abc')).toBe('conv-abc')
    expect(createSessionId('sess-1')).toBe('sess-1')
    expect(createRequestId('req-1')).toBe('req-1')
  })

  it('rejects empty ids', () => {
    expect(() => createConversationId('   ')).toThrow(DomainError)
  })

  it('rejects invalid id format', () => {
    expect(() => createConversationId('!!!')).toThrow(DomainError)
  })

  it('validates message role and content', () => {
    expect(() => assertValidMessageRole('invalid' as 'user')).toThrow(DomainError)
    expect(() => assertValidMessageContent('   ')).toThrow(DomainError)
    expect(() => assertValidMessageContent('ok')).not.toThrow()
  })
})
