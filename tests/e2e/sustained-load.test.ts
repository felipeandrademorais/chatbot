import { describe, expect, it } from 'vitest'

import {
  DEFAULT_LOAD_PROFILES,
  DEFAULT_SCALABILITY_BUDGETS,
} from '@chatbot/contracts'
import { evaluatePerformanceSuite } from '../../packages/shared/src/index.js'

const gatewayUrl = process.env.GATEWAY_URL ?? 'http://localhost:3000'

async function isGatewayReachable(): Promise<boolean> {
  try {
    const response = await fetch(`${gatewayUrl}/health/live`, {
      signal: AbortSignal.timeout(3_000),
    })
    return response.ok
  } catch {
    return false
  }
}

async function runSustainedLoad(totalRequests: number, concurrency: number) {
  const samples: Array<{ latencyMs: number; success: boolean }> = []
  const startedAt = Date.now()

  let cursor = 0
  const workers = Array.from({ length: concurrency }, async () => {
    while (cursor < totalRequests) {
      const index = cursor
      cursor += 1
      if (index >= totalRequests) {
        return
      }
      const requestStart = Date.now()
      try {
        const response = await fetch(`${gatewayUrl}/health/live`, {
          signal: AbortSignal.timeout(5_000),
        })
        samples.push({
          latencyMs: Date.now() - requestStart,
          success: response.ok,
        })
      } catch {
        samples.push({
          latencyMs: Date.now() - requestStart,
          success: false,
        })
      }
    }
  })

  await Promise.all(workers)
  return {
    elapsedMs: Date.now() - startedAt,
    samples,
  }
}

const stackAvailable = await isGatewayReachable()

describe.skipIf(!stackAvailable)('sustained load e2e', () => {
  it('maintains normal profile SLA envelope', async () => {
    const profile = DEFAULT_LOAD_PROFILES.normal
    const run = await runSustainedLoad(1_200, 20)

    const evaluation = evaluatePerformanceSuite(
      profile,
      run.samples,
      run.elapsedMs,
      DEFAULT_SCALABILITY_BUDGETS,
    )

    expect(evaluation.errorRate).toBeLessThanOrEqual(0.02)
    expect(evaluation.p95LatencyMs).toBeLessThanOrEqual(profile.maxP95LatencyMs)
    expect(evaluation.achievedTps).toBeGreaterThanOrEqual(profile.targetTps)
    expect(evaluation.passesSla).toBe(true)
  })
})
