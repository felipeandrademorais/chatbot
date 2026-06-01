import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const serviceServerPath = 'packages/shared/src/server/create-service-server.ts'
const appServerFiles = [
  'apps/gateway/src/server.ts',
  'apps/orchestrator/src/server.ts',
  'apps/worker/src/server.ts',
  'apps/web/src/server.ts',
]

describe('telemetry architecture gate', () => {
  it('shared service server exposes standardized telemetry routes', async () => {
    const source = await readFile(path.resolve(process.cwd(), serviceServerPath), 'utf8')

    expect(source).toContain('TELEMETRY_ROUTES.metrics')
    expect(source).toContain('TELEMETRY_ROUTES.context')
    expect(source).toContain('TELEMETRY_ROUTES.traces')
    expect(source).toContain('recordHttpRequest')
    expect(source).toContain('finishSpan')
  })

  it.each(appServerFiles)(
    '%s uses shared service server instrumentation hooks',
    async (relativePath) => {
      const source = await readFile(path.resolve(process.cwd(), relativePath), 'utf8')

      expect(source).toContain('createServiceServer')
      expect(source).not.toContain("'/metrics'")
      expect(source).not.toContain('"/metrics"')
      expect(source).not.toContain("'/internal/telemetry'")
      expect(source).not.toContain('"/internal/telemetry"')
    },
  )
})
