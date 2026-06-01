import { createHmac } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import { DEFAULT_AUTHORIZATION_MATRIX } from '@chatbot/contracts'

import { authorizeRequest } from '../src/security/auth.js'

const jwtSecret = 'stage-08-test-secret-value-with-sufficient-length'

function toBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function createToken(params: { role: 'admin' | 'viewer'; exp: number }): string {
  const now = 1_700_000_000
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = toBase64Url(
    JSON.stringify({
      sub: 'user-1',
      role: params.role,
      iat: now - 10,
      exp: params.exp,
      iss: 'tests',
    }),
  )
  const signature = createHmac('sha256', jwtSecret).update(`${header}.${payload}`).digest('base64url')
  return `${header}.${payload}.${signature}`
}

describe('authorizeRequest', () => {
  it('returns 401 when token is missing', () => {
    const result = authorizeRequest(undefined, {
      requiredAction: 'gateway:orchestrator:ping',
      authorizationMatrix: DEFAULT_AUTHORIZATION_MATRIX,
      jwtSecret,
    })

    expect(result).toMatchObject({ ok: false, statusCode: 401, reason: 'missing_token' })
  })

  it('returns 401 for expired token', () => {
    const token = createToken({ role: 'admin', exp: 1_699_999_999 })
    const result = authorizeRequest(`Bearer ${token}`, {
      requiredAction: 'gateway:orchestrator:ping',
      authorizationMatrix: DEFAULT_AUTHORIZATION_MATRIX,
      jwtSecret,
      nowEpochSeconds: () => 1_700_000_000,
    })

    expect(result).toMatchObject({ ok: false, statusCode: 401, reason: 'expired_token' })
  })

  it('returns 403 for unauthorized role', () => {
    const token = createToken({ role: 'viewer', exp: 1_700_000_600 })
    const result = authorizeRequest(`Bearer ${token}`, {
      requiredAction: 'gateway:orchestrator:ping',
      authorizationMatrix: DEFAULT_AUTHORIZATION_MATRIX,
      jwtSecret,
      nowEpochSeconds: () => 1_700_000_000,
    })

    expect(result).toMatchObject({ ok: false, statusCode: 403, reason: 'forbidden' })
  })

  it('authorizes role permitted in matrix', () => {
    const token = createToken({ role: 'admin', exp: 1_700_000_600 })
    const result = authorizeRequest(`Bearer ${token}`, {
      requiredAction: 'gateway:orchestrator:ping',
      authorizationMatrix: DEFAULT_AUTHORIZATION_MATRIX,
      jwtSecret,
      nowEpochSeconds: () => 1_700_000_000,
    })

    expect(result).toMatchObject({ ok: true })
    if (result.ok) {
      expect(result.claims.role).toBe('admin')
    }
  })

  it('invalidates old tokens after secret rotation', () => {
    const token = createToken({ role: 'admin', exp: 1_700_000_600 })
    const result = authorizeRequest(`Bearer ${token}`, {
      requiredAction: 'gateway:orchestrator:ping',
      authorizationMatrix: DEFAULT_AUTHORIZATION_MATRIX,
      jwtSecret: 'new-rotated-secret-value-with-sufficient-length',
      nowEpochSeconds: () => 1_700_000_000,
    })

    expect(result).toMatchObject({ ok: false, statusCode: 401, reason: 'invalid_token' })
  })
})
