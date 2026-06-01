import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import type { HealthStatus, ReadinessCheck } from '@chatbot/contracts'
import { Client } from 'pg'
import { createClient } from 'redis'

import type { BaseEnv } from '../config/env-schema.js'

export function createReadinessCheck(
  status: HealthStatus,
  message?: string,
): ReadinessCheck {
  return message === undefined ? { status } : { status, message }
}

export async function checkPostgres(env: BaseEnv): Promise<ReadinessCheck> {
  const client = new Client({
    host: env.POSTGRES_HOST,
    port: env.POSTGRES_PORT,
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    database: env.POSTGRES_DB,
    connectionTimeoutMillis: 5_000,
  })

  try {
    await client.connect()
    await client.query('SELECT 1')
    return createReadinessCheck('ok')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'postgres unreachable'
    return createReadinessCheck('unhealthy', message)
  } finally {
    await client.end().catch(() => undefined)
  }
}

export async function checkRedis(env: BaseEnv): Promise<ReadinessCheck> {
  const client = createClient({
    socket: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      connectTimeout: 5_000,
    },
  })

  try {
    await client.connect()
    const pong = await client.ping()
    if (pong !== 'PONG') {
      return createReadinessCheck('unhealthy', `unexpected ping response: ${pong}`)
    }
    return createReadinessCheck('ok')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'redis unreachable'
    return createReadinessCheck('unhealthy', message)
  } finally {
    await client.quit().catch(() => undefined)
  }
}

export async function checkHttpEndpoint(url: string): Promise<ReadinessCheck> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5_000) })
    if (!response.ok) {
      return createReadinessCheck('unhealthy', `HTTP ${String(response.status)} from ${url}`)
    }
    return createReadinessCheck('ok')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'http check failed'
    return createReadinessCheck('unhealthy', message)
  }
}

export async function computeFileChecksum(filePath: string): Promise<string> {
  const content = await readFile(filePath, 'utf8')
  return createHash('sha256').update(content).digest('hex')
}

export function resolveMigrationsDir(): string {
  return path.resolve(process.cwd(), 'migrations')
}
