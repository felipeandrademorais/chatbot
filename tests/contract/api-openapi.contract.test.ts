import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { GatewayEnv } from '@chatbot/shared'

import { createGatewayServer } from '../../apps/gateway/src/server.js'
import openApiContract from '../../packages/contracts/openapi/v1.0.0.openapi.json'

const publicContractPaths = Object.keys(openApiContract.paths)

describe('stage 04 API contract coverage', () => {
  let app: Awaited<ReturnType<typeof createGatewayServer>>
  let sessionId = ''
  let conversationId = ''
  beforeAll(async () => {
    const env = {
      NODE_ENV: 'test',
      LOG_LEVEL: 'error',
      POSTGRES_HOST: 'localhost',
      POSTGRES_PORT: 5432,
      POSTGRES_USER: 'chatbot',
      POSTGRES_PASSWORD: 'password',
      POSTGRES_DB: 'chatbot',
      REDIS_HOST: 'localhost',
      REDIS_PORT: 6379,
      GATEWAY_PORT: 3000,
      ORCHESTRATOR_URL: 'http://localhost:3001',
      JWT_SECRET: 'test-secret-32-characters-minimum',
      RATE_LIMIT_WINDOW_MS: 1000,
      RATE_LIMIT_MAX_REQUESTS: 120,
      RATE_LIMIT_BURST_ALLOWANCE: 30,
      RETRY_TIMEOUT_MS: 3000,
      RETRY_MAX_RETRIES: 2,
      RETRY_BACKOFF_MULTIPLIER: 2,
      RETRY_MAX_BACKOFF_MS: 8000,
    } as unknown as GatewayEnv

    app = await createGatewayServer(env)
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('serves published OpenAPI contract', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/openapi.json',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      openapi: '3.1.0',
      info: { version: '1.0.0' },
    })
  })

  it('creates session via versioned endpoint', async () => {
    const startedAt = performance.now()
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/sessions',
      payload: {
        requestId: 'req-create-session',
        channel: 'cli',
      },
    })

    expect(response.statusCode).toBe(201)
    const body = response.json() as { sessionId: string; channel: string }
    expect(body.sessionId).toMatch(/\S+/)
    expect(body.channel).toBe('cli')
    expect(performance.now() - startedAt).toBeLessThan(400)
    sessionId = body.sessionId
  })

  it('returns standardized 404 envelope for missing session', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/conversations',
      payload: {
        sessionId: 'missing-session',
        requestId: 'req-missing-session',
      },
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toMatchObject({
      error: {
        code: 'NOT_FOUND',
        requestId: 'req-missing-session',
      },
    })
  })

  it('creates conversation and appends message', async () => {
    const createConversationResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/conversations',
      payload: {
        sessionId,
        requestId: 'req-create-conversation',
      },
    })

    expect(createConversationResponse.statusCode).toBe(201)
    const conversationBody = createConversationResponse.json() as { conversationId: string }
    conversationId = conversationBody.conversationId

    const appendResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/conversations/${conversationId}/messages`,
      payload: {
        requestId: 'req-append-message',
        role: 'user',
        content: 'hello',
      },
    })

    expect(appendResponse.statusCode).toBe(200)
    expect(appendResponse.json()).toMatchObject({
      conversationId,
      messageIndex: 0,
    })
  })

  it('creates, reads, and updates workflow via mapped endpoints', async () => {
    const startResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/workflows',
      payload: {
        taskType: 'chat',
        payload: { conversationId },
      },
    })

    expect(startResponse.statusCode).toBe(202)
    const startedBody = startResponse.json() as {
      workflowId: string
      status: string
      timeline: Array<{ status: string }>
    }
    expect(startedBody.workflowId).toMatch(/\S+/)
    expect(startedBody.status).toBe('pending')
    expect(startedBody.timeline.length).toBeGreaterThanOrEqual(1)

    const getResponse = await app.inject({
      method: 'GET',
      url: `/api/v1/workflows/${startedBody.workflowId}`,
    })
    expect(getResponse.statusCode).toBe(200)
    expect(getResponse.json()).toMatchObject({
      workflowId: startedBody.workflowId,
      status: 'pending',
    })

    const completeResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/workflows/${startedBody.workflowId}/tasks/task-${startedBody.workflowId}/complete`,
      payload: {
        requestId: 'req-complete-workflow',
        success: true,
      },
    })

    expect(completeResponse.statusCode).toBe(200)
    expect(completeResponse.json()).toMatchObject({
      workflowId: startedBody.workflowId,
      status: 'completed',
    })

    const cancelResponse = await app.inject({
      method: 'POST',
      url: `/api/v1/workflows/${startedBody.workflowId}/cancel`,
      payload: {
        requestId: 'req-cancel-workflow',
        reason: 'manual-stop',
      },
    })

    expect(cancelResponse.statusCode).toBe(409)
    expect(cancelResponse.json()).toMatchObject({
      error: {
        code: 'INVALID_STATE_TRANSITION',
        requestId: 'req-cancel-workflow',
      },
    })
  })

  it('enforces request validation with standardized envelope', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/sessions',
      payload: {},
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({
      error: {
        code: 'INVALID_ARGUMENT',
      },
    })
  })

  it('covers every public OpenAPI path with executable contract checks', () => {
    expect(publicContractPaths.sort()).toEqual(
      [
        '/api/v1/openapi.json',
        '/api/v1/sessions',
        '/api/v1/conversations',
        '/api/v1/conversations/{conversationId}/messages',
        '/api/v1/workflows',
        '/api/v1/workflows/{workflowId}',
        '/api/v1/workflows/{workflowId}/retry',
        '/api/v1/workflows/{workflowId}/tasks/{taskId}/complete',
        '/api/v1/workflows/{workflowId}/cancel',
      ].sort(),
    )
  })
})
