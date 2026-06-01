import type { LoadProfile, ScalabilityBudgets } from '@chatbot/contracts'

export interface PerformanceSample {
  readonly latencyMs: number
  readonly success: boolean
}

export interface PerformanceSuiteResult {
  readonly requests: number
  readonly achievedTps: number
  readonly errorRate: number
  readonly p95LatencyMs: number
  readonly passesSla: boolean
}

function percentile(values: readonly number[], percentileValue: number): number {
  if (values.length === 0) {
    return 0
  }
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1),
  )
  return sorted[index] ?? 0
}

export function evaluatePerformanceSuite(
  profile: LoadProfile,
  samples: readonly PerformanceSample[],
  elapsedMs: number,
  budgets: ScalabilityBudgets,
): PerformanceSuiteResult {
  const requests = samples.length
  const failures = samples.filter((sample) => !sample.success).length
  const latencies = samples.map((sample) => sample.latencyMs)

  const errorRate = requests === 0 ? 1 : failures / requests
  const achievedTps = elapsedMs <= 0 ? 0 : requests / (elapsedMs / 1_000)
  const p95LatencyMs = percentile(latencies, 95)
  const requiredTps = profile.injectDependencyFailure
    ? profile.targetTps
    : Math.max(profile.targetTps, budgets.minimumTps)

  const passesSla =
    achievedTps >= requiredTps &&
    errorRate <= Math.min(profile.maxErrorRate, budgets.maxErrorRate) &&
    p95LatencyMs <= Math.min(profile.maxP95LatencyMs, budgets.maxP95LatencyMs)

  return {
    requests,
    achievedTps,
    errorRate,
    p95LatencyMs,
    passesSla,
  }
}
