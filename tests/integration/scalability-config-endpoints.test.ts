import { describe, expect, it } from 'vitest'

import { createGatewayServer } from '../../apps/gateway/src/server.js'
import { createOrchestratorServer } from '../../apps/orchestrator/src/server.js'
import { createWorkerServer } from '../../apps/worker/src/server.js'

describe('scalability configuration endpoints', () => {
  it('exposes gateway retry and rate-limit contracts', async () => {
    const app = await createGatewayServer({
      NODE_ENV: 'test',
      LOG_LEVEL: 'info',
      POSTGRES_HOST: 'localhost',
      POSTGRES_PORT: 5432,
      POSTGRES_USER: 'chatbot',
      POSTGRES_PASSWORD: 'secret',
      POSTGRES_DB: 'chatbot',
      REDIS_HOST: 'localhost',
      REDIS_PORT: 6379,
      GATEWAY_PORT: 3000,
      ORCHESTRATOR_URL: 'http://localhost:3001',
      JWT_SECRET: 'x'.repeat(32),
      RATE_LIMIT_WINDOW_MS: 1_000,
      RATE_LIMIT_MAX_REQUESTS: 120,
      RATE_LIMIT_BURST_ALLOWANCE: 30,
      RETRY_TIMEOUT_MS: 3_000,
      RETRY_MAX_RETRIES: 2,
      RETRY_BACKOFF_MULTIPLIER: 2,
      RETRY_MAX_BACKOFF_MS: 8_000,
    })

    const response = await app.inject({
      method: 'GET',
      url: '/internal/scalability/contracts',
    })
    await app.close()

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      rateLimit: {
        windowMs: 1_000,
        maxRequestsPerWindow: 120,
        burstAllowance: 30,
      },
      retry: {
        timeoutMs: 3_000,
        maxRetries: 2,
      },
    })
  })

  it('exposes orchestrator queue tuning configuration', async () => {
    const app = await createOrchestratorServer({
      NODE_ENV: 'test',
      LOG_LEVEL: 'info',
      POSTGRES_HOST: 'localhost',
      POSTGRES_PORT: 5432,
      POSTGRES_USER: 'chatbot',
      POSTGRES_PASSWORD: 'secret',
      POSTGRES_DB: 'chatbot',
      REDIS_HOST: 'localhost',
      REDIS_PORT: 6379,
      ORCHESTRATOR_PORT: 3001,
      WORKER_TARGET_TPS: 40,
      WORKER_AVERAGE_JOB_LATENCY_MS: 150,
      WORKER_MAX_CONCURRENCY: 32,
      QUEUE_PARTITION_KEYS: 'workflowId,taskType',
      QUEUE_MAX_IN_FLIGHT_PER_PARTITION: 8,
    })

    const response = await app.inject({
      method: 'GET',
      url: '/internal/scalability/queue-tuning',
    })
    await app.close()

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      queueTuning: {
        partitionKeys: ['workflowId', 'taskType'],
      },
    })
  })

  it('exposes worker cache and invalidation contracts', async () => {
    const app = await createWorkerServer({
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
      OLLAMA_SKIP_PULL: true,
      OLLAMA_SKIP_WARMUP: true,
    })

    const response = await app.inject({
      method: 'GET',
      url: '/internal/scalability/cache-policy',
    })
    await app.close()

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      cachePolicies: expect.arrayContaining([
        expect.objectContaining({ aggregateType: 'conversation', ttlMs: 30_000 }),
      ]),
      invalidation: expect.arrayContaining([
        expect.objectContaining({ aggregateType: 'conversation' }),
      ]),
    })
  })
})
