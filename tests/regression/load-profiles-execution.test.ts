import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  DEFAULT_LOAD_PROFILES,
  DEFAULT_SCALABILITY_BUDGETS,
  type LoadProfile,
} from '@chatbot/contracts'
import { evaluatePerformanceSuite } from '../../packages/shared/src/index.js'

async function loadProfilesFromArchive(): Promise<readonly LoadProfile[]> {
  const filePath = path.resolve(process.cwd(), 'docs/stages/09-scalability/load-profiles.json')
  const content = await readFile(filePath, 'utf8')
  return JSON.parse(content) as readonly LoadProfile[]
}

describe('load profile archive execution', () => {
  it('executes archived scenarios against suite evaluator', async () => {
    const archivedProfiles = await loadProfilesFromArchive()
    expect(archivedProfiles.length).toBe(3)

    for (const profile of archivedProfiles) {
      const canonical = DEFAULT_LOAD_PROFILES[profile.id]
      expect(profile.targetTps).toBe(canonical.targetTps)
      const latencyBudget = Math.min(profile.maxP95LatencyMs, DEFAULT_SCALABILITY_BUDGETS.maxP95LatencyMs)

      const requestCount = profile.targetTps * profile.durationSeconds
      const samples = Array.from({ length: requestCount }, (_, index) => ({
        latencyMs: Math.max(1, latencyBudget - 60 + (index % 40)),
        success: index % 100 !== 0,
      }))

      const evaluation = evaluatePerformanceSuite(
        profile,
        samples,
        profile.durationSeconds * 1_000,
        DEFAULT_SCALABILITY_BUDGETS,
      )

      expect(evaluation.passesSla).toBe(true)
    }
  })
})
