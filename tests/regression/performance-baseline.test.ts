import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  DEFAULT_LOAD_PROFILES,
  DEFAULT_SCALABILITY_BUDGETS,
} from '@chatbot/contracts'
import { evaluatePerformanceSuite } from '../../packages/shared/src/index.js'

interface BaselineRecord {
  readonly scenario: 'normal' | 'peak' | 'failure'
  readonly requests: number
  readonly elapsedMs: number
  readonly p95LatencyMs: number
}

async function loadBaseline(): Promise<readonly BaselineRecord[]> {
  const filePath = path.resolve(process.cwd(), 'docs/stages/09-scalability/performance-baseline.json')
  const content = await readFile(filePath, 'utf8')
  const parsed: unknown = JSON.parse(content)
  if (!Array.isArray(parsed)) {
    throw new Error('performance-baseline.json must be an array')
  }
  return parsed as readonly BaselineRecord[]
}

describe('performance regression baseline', () => {
  it('stays within 10% p95 latency degradation and keeps SLA budgets', async () => {
    const baseline = await loadBaseline()

    for (const row of baseline) {
      const profile = DEFAULT_LOAD_PROFILES[row.scenario]
      const syntheticSamples = Array.from({ length: row.requests }, (_, index) => ({
        latencyMs: row.p95LatencyMs - 20 + (index % 40),
        success: index % 200 !== 0,
      }))

      const evaluation = evaluatePerformanceSuite(
        profile,
        syntheticSamples,
        row.elapsedMs,
        DEFAULT_SCALABILITY_BUDGETS,
      )

      expect(evaluation.p95LatencyMs).toBeLessThanOrEqual(Math.ceil(row.p95LatencyMs * 1.1))
      expect(evaluation.errorRate).toBeLessThanOrEqual(0.02)
      expect(evaluation.achievedTps).toBeGreaterThanOrEqual(profile.targetTps)
      expect(evaluation.passesSla).toBe(true)
    }
  })
})
