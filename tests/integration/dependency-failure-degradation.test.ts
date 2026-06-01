import { describe, expect, it } from 'vitest'

import type { WorkerEnv } from '@chatbot/shared'
import { createWorkerServer } from '../../apps/worker/src/server.js'

function createTestEnv(): WorkerEnv {
  return {
    NODE_ENV: 'test',
    LOG_LEVEL: 'info',
    POSTGRES_HOST: 'localhost',
    POSTGRES_PORT: 5432,
    POSTGRES_USER: 'chatbot',
    POSTGRES_PASSWORD: 'secret',
    POSTGRES_DB: 'chatbot',
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379,
    WORKER_PORT: 3002,
    CACHE_DEFAULT_TTL_MS: 30_000,
    CACHE_STALE_REVALIDATE_MS: 5_000,
    RETRY_TIMEOUT_MS: 3_000,
    RETRY_MAX_RETRIES: 2,
    RETRY_BACKOFF_MULTIPLIER: 2,
    RETRY_MAX_BACKOFF_MS: 8_000,
    OLLAMA_BASE_URL: 'http://127.0.0.1:1',
    OLLAMA_MODEL: 'gemma4:e2b',
    OLLAMA_APPROVED_MODELS: 'gemma4:e2b,gemma4:e4b',
    OLLAMA_FALLBACK_MODEL: 'gemma4:e4b',
    OLLAMA_SKIP_PULL: true,
    OLLAMA_SKIP_WARMUP: true,
  }
}

describe('controlled dependency failure degradation', () => {
  it('returns degraded response shape on provider failure', async () => {
    const app = await createWorkerServer(createTestEnv())
    const response = await app.inject({
      method: 'GET',
      url: '/internal/scalability/ollama-resilience',
    })
    await app.close()

    expect(response.statusCode).toBe(200)
    const body: { status: string; attempts: number; value: { provider: string }; error?: string } =
      response.json()
    expect(body).toMatchObject({
      status: 'degraded',
      attempts: 3,
      value: { provider: 'fallback' },
    })
    expect(body.error).toBeTruthy()
  })
})
