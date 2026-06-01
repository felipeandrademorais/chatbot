import { describe, expect, it } from 'vitest'

import {
  DEFAULT_CACHE_INVALIDATION_CONTRACTS,
  DEFAULT_CACHE_POLICIES,
  DEFAULT_RATE_LIMIT_POLICY,
  DEFAULT_RETRY_POLICY,
} from '@chatbot/contracts'

describe('stage 09 scalability contracts', () => {
  it('keeps retry and rate-limit contracts within safety bounds', () => {
    expect(DEFAULT_RETRY_POLICY.maxRetries).toBeLessThanOrEqual(2)
    expect(DEFAULT_RETRY_POLICY.timeoutMs).toBeGreaterThan(0)
    expect(DEFAULT_RATE_LIMIT_POLICY.maxRequestsPerWindow).toBeGreaterThan(0)
    expect(DEFAULT_RATE_LIMIT_POLICY.windowMs).toBeGreaterThan(0)
  })

  it('requires cache invalidation coverage per aggregate policy', () => {
    const invalidationTypes = new Set(
      DEFAULT_CACHE_INVALIDATION_CONTRACTS.map((entry) => entry.aggregateType),
    )

    for (const policy of DEFAULT_CACHE_POLICIES) {
      expect(invalidationTypes.has(policy.aggregateType)).toBe(true)
    }
  })
})
