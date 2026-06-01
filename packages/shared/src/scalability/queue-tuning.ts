import type { QueuePartitionContract } from '@chatbot/contracts'

export interface QueueTuningInput {
  readonly targetTps: number
  readonly averageJobLatencyMs: number
  readonly partitionKeys: readonly string[]
  readonly safetyMultiplier?: number
  readonly maxConcurrency?: number
  readonly maxInFlightPerPartition?: number
}

export interface QueueTuningResult extends QueuePartitionContract {
  readonly recommendedBackpressureThreshold: number
}

function clampPositive(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return fallback
  }
  return value
}

export function deriveQueueTuning(input: QueueTuningInput): QueueTuningResult {
  const safetyMultiplier = clampPositive(input.safetyMultiplier ?? 1.2, 1.2)
  const cappedLatencyMs = clampPositive(input.averageJobLatencyMs, 100)
  const rawConcurrency = Math.ceil((input.targetTps * cappedLatencyMs) / 1_000)
  const maxConcurrency = clampPositive(input.maxConcurrency ?? 64, 64)
  const workerConcurrency = Math.min(Math.max(1, Math.ceil(rawConcurrency * safetyMultiplier)), maxConcurrency)

  const maxInFlightPerPartition = Math.max(1, input.maxInFlightPerPartition ?? 8)
  const partitionCount = Math.max(1, Math.ceil(workerConcurrency / maxInFlightPerPartition))

  return {
    partitionKeys: input.partitionKeys,
    partitionCount,
    workerConcurrency,
    maxInFlightPerPartition,
    recommendedBackpressureThreshold: workerConcurrency * 3,
  }
}

export function estimateQueuePressure(
  pendingJobs: number,
  inFlightJobs: number,
  threshold: number,
): 'normal' | 'elevated' | 'saturated' {
  if (inFlightJobs >= threshold || pendingJobs >= threshold * 2) {
    return 'saturated'
  }
  if (inFlightJobs >= Math.ceil(threshold * 0.7) || pendingJobs >= threshold) {
    return 'elevated'
  }
  return 'normal'
}
