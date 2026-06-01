import {
  DEFAULT_LOAD_PROFILES,
  DEFAULT_SCALABILITY_BUDGETS,
  type RetryPolicyContract,
} from '@chatbot/contracts'
import { describe, expect, it } from 'vitest'

import { evaluatePerformanceSuite } from '../src/scalability/performance.js'
import {
  deriveQueueTuning,
  estimateQueuePressure,
} from '../src/scalability/queue-tuning.js'
import { executeWithGracefulDegradation } from '../src/scalability/resilience.js'

describe('queue tuning utilities', () => {
  it('derives queue concurrency and partitioning envelopes', () => {
    const result = deriveQueueTuning({
      targetTps: 40,
      averageJobLatencyMs: 150,
      partitionKeys: ['workflowId', 'taskType'],
      maxConcurrency: 32,
      maxInFlightPerPartition: 8,
    })

    expect(result.workerConcurrency).toBeGreaterThan(0)
    expect(result.partitionCount).toBeGreaterThanOrEqual(1)
    expect(result.recommendedBackpressureThreshold).toBe(result.workerConcurrency * 3)
  })

  it('classifies pressure states', () => {
    expect(estimateQueuePressure(10, 5, 20)).toBe('normal')
    expect(estimateQueuePressure(25, 15, 20)).toBe('elevated')
    expect(estimateQueuePressure(50, 20, 20)).toBe('saturated')
  })
})

describe('performance suite evaluator', () => {
  it('passes profile when SLA thresholds are met', () => {
    const samples = Array.from({ length: 1_200 }, (_, index) => ({
      latencyMs: 220 + (index % 30),
      success: index % 100 !== 0,
    }))
    const result = evaluatePerformanceSuite(
      DEFAULT_LOAD_PROFILES.normal,
      samples,
      60_000,
      DEFAULT_SCALABILITY_BUDGETS,
    )

    expect(result.errorRate).toBeLessThanOrEqual(0.02)
    expect(result.p95LatencyMs).toBeLessThanOrEqual(600)
    expect(result.achievedTps).toBeGreaterThanOrEqual(20)
    expect(result.passesSla).toBe(true)
  })
})

describe('graceful degradation', () => {
  it('returns fallback payload after bounded retries', async () => {
    let attempts = 0
    const policy: RetryPolicyContract = {
      timeoutMs: 1,
      maxRetries: 2,
      backoffMultiplier: 2,
      maxBackoffMs: 5,
    }

    const result = await executeWithGracefulDegradation(
      async () => {
        attempts += 1
        throw new Error('ollama unavailable')
      },
      {
        policy,
        fallback: () => ({ provider: 'fallback', content: 'degraded response' }),
        sleep: async () => undefined,
      },
    )

    expect(attempts).toBe(3)
    expect(result.status).toBe('degraded')
    expect(result.value).toEqual({
      provider: 'fallback',
      content: 'degraded response',
    })
  })
})
