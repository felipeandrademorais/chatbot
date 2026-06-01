import { describe, expect, it } from 'vitest'

const postgresHost = process.env.POSTGRES_HOST ?? 'localhost'
const postgresPort = process.env.POSTGRES_PORT ?? '5433'
const postgresUser = process.env.POSTGRES_USER ?? 'chatbot'
const postgresPassword = process.env.POSTGRES_PASSWORD ?? 'ci-test-password'
const postgresDb = process.env.POSTGRES_DB ?? 'chatbot'

async function postgresReachable(): Promise<boolean> {
  try {
    const { Client } = await import('pg')
    const client = new Client({
      host: postgresHost,
      port: Number(postgresPort),
      user: postgresUser,
      password: postgresPassword,
      database: postgresDb,
      connectionTimeoutMillis: 3_000,
    })
    await client.connect()
    await client.end()
    return true
  } catch {
    return false
  }
}

const stackAvailable = await postgresReachable()

describe.skipIf(!stackAvailable)('docker compose migrations', () => {
  it('records applied migrations with checksums', async () => {
    const { Client } = await import('pg')
    const client = new Client({
      host: postgresHost,
      port: Number(postgresPort),
      user: postgresUser,
      password: postgresPassword,
      database: postgresDb,
    })

    await client.connect()
    const result = await client.query<{ version: string; checksum: string }>(
      'SELECT version, checksum FROM schema_migrations ORDER BY version',
    )
    await client.end()

    expect(result.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          version: '001',
          checksum: expect.stringMatching(/^[a-f0-9]{64}$/),
        }),
      ]),
    )
  })
})
