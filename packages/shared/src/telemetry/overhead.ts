export interface ThroughputSample {
  baselineRps: number
  instrumentedRps: number
}

export function calculateOverheadPercent(sample: ThroughputSample): number {
  if (sample.baselineRps <= 0) {
    throw new Error('baselineRps must be positive')
  }
  if (sample.instrumentedRps <= 0) {
    throw new Error('instrumentedRps must be positive')
  }
  return ((sample.baselineRps - sample.instrumentedRps) / sample.baselineRps) * 100
}

export function isTelemetryOverheadWithinBudget(
  sample: ThroughputSample,
  budgetPercent = 5,
): boolean {
  return calculateOverheadPercent(sample) <= budgetPercent
}
