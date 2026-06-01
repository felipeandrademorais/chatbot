import type { CacheInvalidationContract, CachePolicyContract } from '@chatbot/contracts'

interface CacheRecord<T> {
  readonly value: T
  readonly expiresAt: number
  readonly staleAt: number
}

function makeCacheKey(aggregateType: string, aggregateId: string): string {
  return `${aggregateType}:${aggregateId}`
}

export class AggregateCache<T> {
  private readonly policyByType: Map<string, CachePolicyContract>
  private readonly invalidationByType: Map<string, readonly string[]>
  private readonly storage = new Map<string, CacheRecord<T>>()

  constructor(
    policies: readonly CachePolicyContract[],
    invalidations: readonly CacheInvalidationContract[],
  ) {
    this.policyByType = new Map(policies.map((policy) => [policy.aggregateType, policy]))
    this.invalidationByType = new Map(
      invalidations.map((invalidation) => [invalidation.aggregateType, invalidation.invalidates]),
    )
  }

  set(aggregateType: string, aggregateId: string, value: T, now = Date.now()): void {
    const policy = this.policyByType.get(aggregateType)
    if (policy === undefined) {
      throw new Error(`Unknown cache policy for aggregate type "${aggregateType}"`)
    }

    this.storage.set(makeCacheKey(aggregateType, aggregateId), {
      value,
      staleAt: now + policy.ttlMs,
      expiresAt: now + policy.ttlMs + policy.staleWhileRevalidateMs,
    })
  }

  get(
    aggregateType: string,
    aggregateId: string,
    now = Date.now(),
  ): { readonly value: T; readonly stale: boolean } | undefined {
    const record = this.storage.get(makeCacheKey(aggregateType, aggregateId))
    if (record === undefined) {
      return undefined
    }
    if (record.expiresAt <= now) {
      this.storage.delete(makeCacheKey(aggregateType, aggregateId))
      return undefined
    }

    return {
      value: record.value,
      stale: record.staleAt <= now,
    }
  }

  invalidate(aggregateType: string, aggregateId: string): number {
    const relatedTypes = this.invalidationByType.get(aggregateType) ?? [aggregateType]
    let deleted = 0
    for (const relatedType of relatedTypes) {
      const key = makeCacheKey(relatedType, aggregateId)
      if (this.storage.delete(key)) {
        deleted += 1
      }
    }
    return deleted
  }

  size(): number {
    return this.storage.size
  }
}
