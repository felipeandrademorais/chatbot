import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const DOMAIN_SRC = path.resolve(process.cwd(), 'packages/domain/src')

const FORBIDDEN_IMPORTS = [
  'fastify',
  'pg',
  'redis',
  'bullmq',
  'ioredis',
  'zod',
  '@fastify',
]

async function collectSourceFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(fullPath)))
      continue
    }
    if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(fullPath)
    }
  }

  return files
}

describe('domain architecture gate (AC-03-003)', () => {
  it('domain package has no framework or infrastructure imports', async () => {
    const files = await collectSourceFiles(DOMAIN_SRC)

    for (const file of files) {
      const source = await readFile(file, 'utf8')
      for (const forbidden of FORBIDDEN_IMPORTS) {
        expect(source, `${path.relative(process.cwd(), file)} must not import ${forbidden}`).not.toMatch(
          new RegExp(`from ['"]${forbidden}`),
        )
      }
    }
  })
})
