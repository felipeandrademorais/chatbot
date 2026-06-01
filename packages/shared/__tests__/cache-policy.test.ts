import {
  DEFAULT_CACHE_INVALIDATION_CONTRACTS,
  DEFAULT_CACHE_POLICIES,
} from '@chatbot/contracts'
import { describe, expect, it } from 'vitest'

import { AggregateCache } from '../src/scalability/cache-policy.js'

describe('AggregateCache', () => {
  it('returns stale markers before hard expiration', () => {
    const cache = new AggregateCache<string>(
      DEFAULT_CACHE_POLICIES,
      DEFAULT_CACHE_INVALIDATION_CONTRACTS,
    )

    const now = 10_000
    cache.set('conversation', 'conv-1', 'cached-response', now)

    expect(cache.get('conversation', 'conv-1', now + 5_000)).toEqual({
      value: 'cached-response',
      stale: false,
    })

    expect(cache.get('conversation', 'conv-1', now + 31_000)).toEqual({
      value: 'cached-response',
      stale: true,
    })

    expect(cache.get('conversation', 'conv-1', now + 36_000)).toBeUndefined()
  })

  it('invalidates related aggregate types using contract rules', () => {
    const cache = new AggregateCache<string>(
      DEFAULT_CACHE_POLICIES,
      DEFAULT_CACHE_INVALIDATION_CONTRACTS,
    )
    const now = 20_000

    cache.set('conversation', 'shared-id', 'conversation-entry', now)
    cache.set('session', 'shared-id', 'session-entry', now)
    cache.set('workflow', 'shared-id', 'workflow-entry', now)

    const deleted = cache.invalidate('conversation', 'shared-id')
    expect(deleted).toBe(2)
    expect(cache.get('conversation', 'shared-id', now + 1_000)).toBeUndefined()
    expect(cache.get('session', 'shared-id', now + 1_000)).toBeUndefined()
    expect(cache.get('workflow', 'shared-id', now + 1_000)).toEqual({
      value: 'workflow-entry',
      stale: false,
    })
  })
})
