import { migrateEnvSchema } from '../config/env-schema.js'
import { loadConfig } from '../config/load-config.js'
import { resolveMigrationsDir } from '../health/checks.js'
import { runMigrations } from './run-migrations.js'

async function main(): Promise<void> {
  const env = loadConfig(migrateEnvSchema)
  const migrationsDir = resolveMigrationsDir()
  const result = await runMigrations(env, migrationsDir)

  process.stdout.write(
    `${JSON.stringify({
      event: 'migrations_complete',
      applied: result.applied,
      skipped: result.skipped,
      migrationsDir,
    })}\n`,
  )
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`${JSON.stringify({ event: 'migrations_failed', error: message })}\n`)
  process.exit(1)
})
