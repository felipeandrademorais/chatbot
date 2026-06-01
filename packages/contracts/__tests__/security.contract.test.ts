import { describe, expect, it } from 'vitest'

import {
  createAuthorizationMatrix,
  DEFAULT_AUTHORIZATION_MATRIX,
  isAuthorizationAction,
  isAuthRole,
  isJwtClaims,
} from '../src/security.js'

describe('security contracts', () => {
  it('validates allowed auth roles and authorization actions', () => {
    expect(isAuthRole('admin')).toBe(true)
    expect(isAuthRole('not-a-role')).toBe(false)

    expect(isAuthorizationAction('gateway:orchestrator:ping')).toBe(true)
    expect(isAuthorizationAction('gateway:write:anything')).toBe(false)
  })

  it('enforces stable jwt claims shape', () => {
    expect(
      isJwtClaims({
        sub: 'user-1',
        role: 'operator',
        iat: 1_700_000_000,
        exp: 1_800_000_000,
        iss: 'chatbot',
      }),
    ).toBe(true)

    expect(
      isJwtClaims({
        sub: 'user-1',
        role: 'operator',
        iat: 'bad',
        exp: 1_800_000_000,
      }),
    ).toBe(false)
  })

  it('uses deny-by-default authorization matrix generation', () => {
    const matrix = createAuthorizationMatrix({
      admin: ['gateway:orchestrator:ping'],
    })

    expect(matrix.admin).toEqual(['gateway:orchestrator:ping'])
    expect(matrix.operator).toEqual([])
    expect(matrix.viewer).toEqual([])
    expect(matrix.agent).toEqual([])
  })

  it('keeps hardened default authorization policy', () => {
    expect(DEFAULT_AUTHORIZATION_MATRIX.admin).toContain('tool:execute')
    expect(DEFAULT_AUTHORIZATION_MATRIX.viewer).not.toContain('gateway:orchestrator:ping')
  })
})
