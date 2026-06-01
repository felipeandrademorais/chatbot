import { describe, expect, it } from 'vitest'

import { DomainError, isDomainError } from '../src/errors/domain-error.js'

describe('DomainError', () => {
  it('serializes to contract payload', () => {
    const error = new DomainError('INVALID_ARGUMENT', 'bad', { field: 'id' })
    expect(error.toPayload()).toEqual({
      code: 'INVALID_ARGUMENT',
      message: 'bad',
      details: { field: 'id' },
    })
    expect(isDomainError(error)).toBe(true)
    expect(isDomainError(new Error('nope'))).toBe(false)
  })
})
