import { describe, expect, it } from 'vitest'

import { HEALTH_ROUTES } from '@chatbot/contracts'

const gatewayUrl = process.env.GATEWAY_URL ?? 'http://localhost:3000'
const orchestratorUrl = process.env.ORCHESTRATOR_URL ?? 'http://localhost:3001'

async function isReachable(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(3_000) })
    return response.ok
  } catch {
    return false
  }
}

const stackAvailable = await Promise.all([
  isReachable(`${gatewayUrl}${HEALTH_ROUTES.live}`),
  isReachable(`${orchestratorUrl}${HEALTH_ROUTES.live}`),
]).then((results) => results.every(Boolean))

describe.skipIf(!stackAvailable)('docker compose integration', () => {
  it('gateway and orchestrator report healthy readiness', async () => {
    const [gatewayReady, orchestratorReady] = await Promise.all([
      fetch(`${gatewayUrl}${HEALTH_ROUTES.ready}`),
      fetch(`${orchestratorUrl}${HEALTH_ROUTES.ready}`),
    ])

    expect(gatewayReady.status).toBe(200)
    expect(orchestratorReady.status).toBe(200)

    const gatewayBody: unknown = await gatewayReady.json()
    const orchestratorBody: unknown = await orchestratorReady.json()

    expect(gatewayBody).toMatchObject({ status: 'ok', service: 'gateway' })
    expect(orchestratorBody).toMatchObject({ status: 'ok', service: 'orchestrator' })
  })
})
