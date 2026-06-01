import { createHmac } from 'node:crypto'

import { describe, expect, it } from 'vitest'

const gatewayUrl = process.env.GATEWAY_URL ?? 'http://localhost:3000'
const jwtSecret = process.env.JWT_SECRET ?? ''

function toBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function createHs256Token(secret: string): string {
  const now = Math.floor(Date.now() / 1000)
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = toBase64Url(
    JSON.stringify({
      sub: 'integration-test-user',
      role: 'operator',
      iat: now - 5,
      exp: now + 300,
      iss: 'integration-test',
    }),
  )
  const signature = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url')
  return `${header}.${payload}.${signature}`
}

async function stackReachable(): Promise<boolean> {
  try {
    const response = await fetch(`${gatewayUrl}/health/live`, { signal: AbortSignal.timeout(3_000) })
    return response.ok
  } catch {
    return false
  }
}

const stackAvailable = await stackReachable()
const authReady = jwtSecret.length >= 32

describe.skipIf(!stackAvailable || !authReady)('telemetry integration', () => {
  it('exposes Prometheus metrics endpoint', async () => {
    const response = await fetch(`${gatewayUrl}/metrics`, {
      signal: AbortSignal.timeout(5_000),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/plain')

    const body = await response.text()
    expect(body).toContain('chatbot_http_requests_total')
    expect(body).toContain('chatbot_http_request_duration_seconds')
    expect(body).toContain('chatbot_queue_depth')
    expect(body).toContain('chatbot_agent_executions_total')
    expect(body).toContain('chatbot_ollama_health')
  })

  it('preserves trace correlation on gateway to orchestrator hop', async () => {
    const token = createHs256Token(jwtSecret)
    const response = await fetch(`${gatewayUrl}/internal/orchestrator/ping`, {
      headers: {
        authorization: `Bearer ${token}`,
        'x-request-id': 'req-int-07',
        'x-workflow-id': 'wf-int-07',
      },
      signal: AbortSignal.timeout(5_000),
    })

    expect(response.status).toBe(200)
    const body: {
      upstream: { traceId: string; spanId: string }
      orchestrator: { traceId: string; parentSpanId: string; workflowId: string; requestId: string }
    } = await response.json()

    expect(body.upstream.traceId).toBeTruthy()
    expect(body.orchestrator.traceId).toBe(body.upstream.traceId)
    expect(body.orchestrator.parentSpanId).toBe(body.upstream.spanId)
    expect(body.orchestrator.requestId).toBe('req-int-07')
    expect(body.orchestrator.workflowId).toBe('wf-int-07')
  })
})
