import { describe, expect, it } from 'vitest'

import { deriveQueueTuning, estimateQueuePressure } from '../../packages/shared/src/index.js'

describe('queue backpressure behavior', () => {
  it('enters saturated state when in-flight jobs exceed threshold', () => {
    const tuning = deriveQueueTuning({
      targetTps: 45,
      averageJobLatencyMs: 180,
      partitionKeys: ['workflowId', 'taskType'],
      maxConcurrency: 32,
      maxInFlightPerPartition: 8,
    })

    const saturation = estimateQueuePressure(
      tuning.recommendedBackpressureThreshold * 2,
      tuning.recommendedBackpressureThreshold,
      tuning.recommendedBackpressureThreshold,
    )

    expect(saturation).toBe('saturated')
  })

  it('remains normal under tuned steady-state workload', () => {
    const tuning = deriveQueueTuning({
      targetTps: 20,
      averageJobLatencyMs: 120,
      partitionKeys: ['workflowId'],
      maxConcurrency: 16,
      maxInFlightPerPartition: 8,
    })

    const pressure = estimateQueuePressure(
      Math.floor(tuning.recommendedBackpressureThreshold * 0.5),
      Math.floor(tuning.workerConcurrency * 0.5),
      tuning.recommendedBackpressureThreshold,
    )

    expect(pressure).toBe('normal')
  })
})
