import { mkdtemp, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { computeFileChecksum } from '../src/health/checks.js'
import { runMigrations } from '../src/migrations/run-migrations.js'

const migrateEnv = {
  NODE_ENV: 'test' as const,
  LOG_LEVEL: 'info' as const,
  POSTGRES_HOST: process.env.POSTGRES_HOST ?? 'localhost',
  POSTGRES_PORT: Number(process.env.POSTGRES_PORT ?? 5433),
  POSTGRES_USER: process.env.POSTGRES_USER ?? 'chatbot',
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD ?? 'ci-test-password',
  POSTGRES_DB: process.env.POSTGRES_DB ?? 'chatbot',
}

async function postgresAvailable(): Promise<boolean> {
  try {
    const { Client } = await import('pg')
    const client = new Client({
      host: migrateEnv.POSTGRES_HOST,
      port: migrateEnv.POSTGRES_PORT,
      user: migrateEnv.POSTGRES_USER,
      password: migrateEnv.POSTGRES_PASSWORD,
      database: migrateEnv.POSTGRES_DB,
      connectionTimeoutMillis: 3_000,
    })
    await client.connect()
    await client.end()
    return true
  } catch {
    return false
  }
}

describe('migration checksums', () => {
  it('computes a stable sha256 checksum for migration files', async () => {
    const migrationPath = path.resolve(process.cwd(), '../../migrations/001_init.sql')
    const checksum = await computeFileChecksum(migrationPath)

    expect(checksum).toMatch(/^[a-f0-9]{64}$/)
    expect(await computeFileChecksum(migrationPath)).toBe(checksum)
  })
})

describe('runMigrations', () => {
  it('rejects invalid migration filenames', async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), 'chatbot-migrations-'))

    await writeFile(path.join(tempDir, 'bad-name.sql'), 'SELECT 1;')

    await expect(runMigrations(migrateEnv, tempDir)).rejects.toThrow(
      'Invalid migration filename "bad-name.sql"',
    )
  })

  it('applies forward migrations idempotently', async (context) => {
    if (!(await postgresAvailable())) {
      context.skip()
      return
    }

    const migrationsDir = path.resolve(process.cwd(), '../../migrations')

    const firstRun = await runMigrations(migrateEnv, migrationsDir)
    expect(firstRun.applied.length + firstRun.skipped.length).toBeGreaterThan(0)

    const secondRun = await runMigrations(migrateEnv, migrationsDir)
    expect(secondRun.applied).toEqual([])
    expect(secondRun.skipped).toEqual(firstRun.applied.concat(firstRun.skipped))
  })
})
