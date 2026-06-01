import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const appServerFiles = [
  'apps/gateway/src/server.ts',
  'apps/orchestrator/src/server.ts',
  'apps/worker/src/server.ts',
  'apps/web/src/server.ts',
]

describe('health architecture gate', () => {
  it.each(appServerFiles)('%s uses shared createServiceServer for health routes', async (relativePath) => {
    const source = await readFile(path.resolve(process.cwd(), relativePath), 'utf8')

    expect(source).toContain('createServiceServer')
    expect(source).not.toMatch(/app\.get\(['"]\/health\//)
  })
})
