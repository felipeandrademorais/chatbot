import { describe, expect, it } from 'vitest'

import {
  DEFAULT_CACHE_INVALIDATION_CONTRACTS,
  DEFAULT_CACHE_POLICIES,
  DEFAULT_LOAD_PROFILES,
  DEFAULT_RATE_LIMIT_POLICY,
  DEFAULT_RETRY_POLICY,
  DEFAULT_SCALABILITY_BUDGETS,
} from '../src/index.js'

describe('scalability contracts', () => {
  it('defines required load profiles', () => {
    expect(Object.keys(DEFAULT_LOAD_PROFILES).sort()).toEqual(['failure', 'normal', 'peak'])
  })

  it('enforces bounded retry policy for dependency protection', () => {
    expect(DEFAULT_RETRY_POLICY.maxRetries).toBeLessThanOrEqual(2)
    expect(DEFAULT_RETRY_POLICY.timeoutMs).toBeGreaterThan(0)
    expect(DEFAULT_RETRY_POLICY.maxBackoffMs).toBeGreaterThanOrEqual(DEFAULT_RETRY_POLICY.timeoutMs)
  })

  it('enforces bounded rate-limit contract', () => {
    expect(DEFAULT_RATE_LIMIT_POLICY.windowMs).toBeGreaterThan(0)
    expect(DEFAULT_RATE_LIMIT_POLICY.maxRequestsPerWindow).toBeGreaterThan(0)
    expect(DEFAULT_RATE_LIMIT_POLICY.burstAllowance).toBeGreaterThanOrEqual(0)
  })

  it('defines cache invalidation rules per aggregate type', () => {
    const policyTypes = new Set(DEFAULT_CACHE_POLICIES.map((policy) => policy.aggregateType))
    for (const invalidation of DEFAULT_CACHE_INVALIDATION_CONTRACTS) {
      expect(policyTypes.has(invalidation.aggregateType)).toBe(true)
      expect(invalidation.invalidates.length).toBeGreaterThan(0)
    }
  })

  it('keeps stage budgets aligned with stage SLA constraints', () => {
    expect(DEFAULT_SCALABILITY_BUDGETS.maxErrorRate).toBeLessThanOrEqual(0.02)
    expect(DEFAULT_SCALABILITY_BUDGETS.maxP95LatencyMs).toBeLessThanOrEqual(800)
    expect(DEFAULT_SCALABILITY_BUDGETS.minimumTps).toBeGreaterThan(0)
  })
})
