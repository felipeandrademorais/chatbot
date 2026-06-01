import { createHmac } from 'node:crypto'

import { describe, expect, it } from 'vitest'

const gatewayUrl = process.env.GATEWAY_URL ?? 'http://localhost:3000'
const jwtSecret = process.env.JWT_SECRET ?? ''

async function gatewayAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${gatewayUrl}/health/live`, {
      signal: AbortSignal.timeout(3_000),
    })
    return response.ok
  } catch {
    return false
  }
}

function toBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function createToken(role: 'operator' | 'viewer'): string {
  const now = Math.floor(Date.now() / 1000)
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = toBase64Url(
    JSON.stringify({
      sub: `security-${role}`,
      role,
      iat: now - 5,
      exp: now + 300,
      iss: 'security-suite',
    }),
  )
  const signature = createHmac('sha256', jwtSecret).update(`${header}.${payload}`).digest('base64url')
  return `${header}.${payload}.${signature}`
}

const stackAvailable = await gatewayAvailable()
const authReady = jwtSecret.length >= 32

describe.skipIf(!stackAvailable || !authReady)('security authz smoke', () => {
  it('rejects unauthenticated requests to protected endpoint', async () => {
    const response = await fetch(`${gatewayUrl}/internal/orchestrator/ping`, {
      signal: AbortSignal.timeout(5_000),
    })
    expect(response.status).toBe(401)
  })

  it('rejects authenticated but unauthorized role', async () => {
    const token = createToken('viewer')
    const response = await fetch(`${gatewayUrl}/internal/orchestrator/ping`, {
      headers: {
        authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(5_000),
    })
    expect(response.status).toBe(403)
  })

  it('allows authorized role', async () => {
    const token = createToken('operator')
    const response = await fetch(`${gatewayUrl}/internal/orchestrator/ping`, {
      headers: {
        authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(5_000),
    })

    expect(response.status).toBe(200)
    const body: { ok?: boolean } = await response.json()
    expect(body.ok).toBe(true)
  })
})
