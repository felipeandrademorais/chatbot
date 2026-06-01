/**
 * Scalability contracts (Stage 09).
 *
 * Defines load profiles, SLA budgets, retry/rate-limit policies,
 * queue tuning envelopes, and cache invalidation contracts.
 */

export type LoadProfileId = 'normal' | 'peak' | 'failure'

export interface LoadProfile {
  readonly id: LoadProfileId
  readonly description: string
  readonly targetTps: number
  readonly durationSeconds: number
  readonly maxErrorRate: number
  readonly maxP95LatencyMs: number
  readonly injectDependencyFailure: boolean
}

export interface RetryPolicyContract {
  readonly timeoutMs: number
  readonly maxRetries: number
  readonly backoffMultiplier: number
  readonly maxBackoffMs: number
}

export interface RateLimitContract {
  readonly windowMs: number
  readonly maxRequestsPerWindow: number
  readonly burstAllowance: number
}

export interface QueuePartitionContract {
  readonly partitionKeys: readonly string[]
  readonly partitionCount: number
  readonly workerConcurrency: number
  readonly maxInFlightPerPartition: number
}

export interface CachePolicyContract {
  readonly aggregateType: string
  readonly ttlMs: number
  readonly staleWhileRevalidateMs: number
}

export interface CacheInvalidationContract {
  readonly aggregateType: string
  readonly invalidates: readonly string[]
}

export interface ScalabilityBudgets {
  readonly maxErrorRate: number
  readonly maxP95LatencyMs: number
  readonly minimumTps: number
}

export const DEFAULT_LOAD_PROFILES: Readonly<Record<LoadProfileId, LoadProfile>> = {
  normal: {
    id: 'normal',
    description: 'Baseline production throughput envelope.',
    targetTps: 20,
    durationSeconds: 60,
    maxErrorRate: 0.02,
    maxP95LatencyMs: 600,
    injectDependencyFailure: false,
  },
  peak: {
    id: 'peak',
    description: 'Expected traffic surge profile.',
    targetTps: 40,
    durationSeconds: 60,
    maxErrorRate: 0.02,
    maxP95LatencyMs: 800,
    injectDependencyFailure: false,
  },
  failure: {
    id: 'failure',
    description: 'Controlled dependency degradation profile.',
    targetTps: 15,
    durationSeconds: 45,
    maxErrorRate: 0.02,
    maxP95LatencyMs: 900,
    injectDependencyFailure: true,
  },
} as const

export const DEFAULT_RETRY_POLICY: RetryPolicyContract = {
  timeoutMs: 3_000,
  maxRetries: 2,
  backoffMultiplier: 2,
  maxBackoffMs: 8_000,
} as const

export const DEFAULT_RATE_LIMIT_POLICY: RateLimitContract = {
  windowMs: 1_000,
  maxRequestsPerWindow: 120,
  burstAllowance: 30,
} as const

export const DEFAULT_QUEUE_PARTITION_CONTRACT: QueuePartitionContract = {
  partitionKeys: ['workflowId', 'taskType'],
  partitionCount: 4,
  workerConcurrency: 16,
  maxInFlightPerPartition: 8,
} as const

export const DEFAULT_CACHE_POLICIES: readonly CachePolicyContract[] = [
  {
    aggregateType: 'conversation',
    ttlMs: 30_000,
    staleWhileRevalidateMs: 5_000,
  },
  {
    aggregateType: 'session',
    ttlMs: 20_000,
    staleWhileRevalidateMs: 5_000,
  },
  {
    aggregateType: 'workflow',
    ttlMs: 10_000,
    staleWhileRevalidateMs: 2_000,
  },
] as const

export const DEFAULT_CACHE_INVALIDATION_CONTRACTS: readonly CacheInvalidationContract[] = [
  {
    aggregateType: 'conversation',
    invalidates: ['conversation', 'session'],
  },
  {
    aggregateType: 'session',
    invalidates: ['session'],
  },
  {
    aggregateType: 'workflow',
    invalidates: ['workflow', 'conversation'],
  },
] as const

export const DEFAULT_SCALABILITY_BUDGETS: ScalabilityBudgets = {
  maxErrorRate: 0.02,
  maxP95LatencyMs: 800,
  minimumTps: 20,
} as const
