import { describe, expect, it } from 'vitest'
import { createHmac } from 'node:crypto'

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

function createHs256Token(secret: string): string {
  const now = Math.floor(Date.now() / 1000)
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = toBase64Url(
    JSON.stringify({
      sub: 'smoke-test-user',
      role: 'operator',
      iat: now - 5,
      exp: now + 300,
      iss: 'smoke-test',
    }),
  )
  const signature = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url')
  return `${header}.${payload}.${signature}`
}

const stackAvailable = await gatewayAvailable()
const authReady = jwtSecret.length >= 32

describe.skipIf(!stackAvailable || !authReady)('gateway -> orchestrator smoke', () => {
  it('proxies orchestrator telemetry context through gateway route', async () => {
    const token = createHs256Token(jwtSecret)
    const response = await fetch(`${gatewayUrl}/internal/orchestrator/ping`, {
      headers: {
        authorization: `Bearer ${token}`,
        'x-request-id': 'req-smoke-07',
        'x-workflow-id': 'wf-smoke-07',
      },
      signal: AbortSignal.timeout(5_000),
    })

    expect(response.status).toBe(200)

    const body: {
      ok?: boolean
      upstream?: { traceId?: string; spanId?: string }
      orchestrator?: { traceId?: string; parentSpanId?: string }
      role?: string
    } = await response.json()
    expect(body.ok).toBe(true)
    expect(body.upstream?.traceId).toBeDefined()
    expect(body.orchestrator?.traceId).toBe(body.upstream?.traceId)
    expect(body.orchestrator?.parentSpanId).toBe(body.upstream?.spanId)
    expect(body.role).toBe('operator')
    expect(response.headers.get('x-request-id')).toBe('req-smoke-07')
    expect(response.headers.get('x-workflow-id')).toBe('wf-smoke-07')
  })
})
