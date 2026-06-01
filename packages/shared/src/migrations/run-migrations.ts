import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

import { Client } from 'pg'

import type { MigrateEnv } from '../config/env-schema.js'
import { computeFileChecksum } from '../health/checks.js'

export interface MigrationFile {
  version: string
  filePath: string
  checksum: string
}

export interface MigrationResult {
  applied: string[]
  skipped: string[]
}

const MIGRATION_FILE_PATTERN = /^(\d+)_.+\.sql$/

async function listMigrationFiles(migrationsDir: string): Promise<MigrationFile[]> {
  const entries = await readdir(migrationsDir)
  const sqlFiles = entries.filter((name) => name.endsWith('.sql')).sort()

  const migrations: MigrationFile[] = []
  for (const fileName of sqlFiles) {
    const match = MIGRATION_FILE_PATTERN.exec(fileName)
    const version = match?.[1]
    if (!version) {
      throw new Error(`Invalid migration filename "${fileName}" — expected NNN_description.sql`)
    }
    const filePath = path.join(migrationsDir, fileName)
    const checksum = await computeFileChecksum(filePath)
    migrations.push({ version, filePath, checksum })
  }

  return migrations
}

function createPgClient(env: MigrateEnv): Client {
  return new Client({
    host: env.POSTGRES_HOST,
    port: env.POSTGRES_PORT,
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    database: env.POSTGRES_DB,
    connectionTimeoutMillis: 10_000,
  })
}

async function ensureMigrationsTable(client: Client): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(32) PRIMARY KEY,
      checksum VARCHAR(64) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

export async function runMigrations(
  env: MigrateEnv,
  migrationsDir: string,
): Promise<MigrationResult> {
  const client = createPgClient(env)
  const result: MigrationResult = { applied: [], skipped: [] }
  const migrations = await listMigrationFiles(migrationsDir)

  try {
    await client.connect()
    await ensureMigrationsTable(client)
    for (const migration of migrations) {
      const existing = await client.query<{ checksum: string }>(
        'SELECT checksum FROM schema_migrations WHERE version = $1',
        [migration.version],
      )

      if (existing.rowCount && existing.rowCount > 0) {
        const storedChecksum = existing.rows[0]?.checksum
        if (storedChecksum !== migration.checksum) {
          throw new Error(
            `Migration checksum mismatch for version ${migration.version}: stored=${storedChecksum ?? 'unknown'} current=${migration.checksum}`,
          )
        }
        result.skipped.push(migration.version)
        continue
      }

      const sql = await readFile(migration.filePath, 'utf8')
      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query(
          'INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)',
          [migration.version, migration.checksum],
        )
        await client.query('COMMIT')
        result.applied.push(migration.version)
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
    }
  } finally {
    await client.end().catch(() => undefined)
  }

  return result
}
