import Fastify, { type FastifyInstance } from 'fastify'

import { createWebServer } from '../../apps/web/src/server.js'

interface WorkflowRecord {
  workflowId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  createdAt: string
  updatedAt: string
  timeline: Array<{ status: WorkflowRecord['status']; timestamp: string; note?: string }>
  result?: string
  error?: string
}

function nowIso(): string {
  return new Date().toISOString()
}

export async function createMockWorkflowApi(): Promise<{
  server: FastifyInstance
  url: string
}> {
  const server = Fastify()
  const store = new Map<string, WorkflowRecord>()
  let id = 0

  server.post('/api/v1/workflows', async (request, reply) => {
    const body = request.body as { taskType?: string } | undefined
    if (!body?.taskType) {
      return reply.status(400).send({
        error: 'INVALID_TASK',
        message: 'taskType is required',
        requestId: 'req-invalid',
        retryable: false,
      })
    }

    id += 1
    const workflowId = `wf-${id}`
    const timestamp = nowIso()
    const workflow: WorkflowRecord = {
      workflowId,
      status: body.taskType === 'fail-once' ? 'failed' : 'completed',
      createdAt: timestamp,
      updatedAt: timestamp,
      timeline: [
        { status: 'pending', timestamp },
        body.taskType === 'fail-once'
          ? { status: 'failed', timestamp, note: 'Simulated failure' }
          : { status: 'completed', timestamp, note: 'Finished' },
      ],
      result: body.taskType === 'fail-once' ? undefined : 'Workflow finished',
      error: body.taskType === 'fail-once' ? 'Simulated failure' : undefined,
    }
    store.set(workflowId, workflow)
    return reply.status(202).send(workflow)
  })

  server.get<{ Params: { workflowId: string } }>(
    '/api/v1/workflows/:workflowId',
    (request, reply) => {
      const workflow = store.get(request.params.workflowId)
      if (!workflow) {
        return reply.status(404).send({
          error: 'NOT_FOUND',
          message: 'workflow missing',
          requestId: 'req-not-found',
          retryable: false,
        })
      }
      return reply.send(workflow)
    },
  )

  server.post<{ Params: { workflowId: string } }>(
    '/api/v1/workflows/:workflowId/retry',
    (request, reply) => {
      const workflow = store.get(request.params.workflowId)
      if (!workflow) {
        return reply.status(404).send({
          error: 'NOT_FOUND',
          message: 'workflow missing',
          requestId: 'req-not-found',
          retryable: false,
        })
      }

      const timestamp = nowIso()
      const retried: WorkflowRecord = {
        ...workflow,
        status: 'completed',
        updatedAt: timestamp,
        timeline: [
          ...workflow.timeline,
          { status: 'completed', timestamp, note: 'Retried successfully' },
        ],
        error: undefined,
        result: 'Retried workflow finished',
      }
      store.set(workflow.workflowId, retried)
      return reply.status(202).send(retried)
    },
  )

  await server.listen({ port: 0, host: '127.0.0.1' })
  const address = server.server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Cannot resolve mock server address')
  }
  return { server, url: `http://127.0.0.1:${address.port}` }
}

export async function createTestWebServer(workflowApiBaseUrl: string): Promise<FastifyInstance> {
  process.env.WORKFLOW_API_BASE_URL = workflowApiBaseUrl
  const app = await createWebServer({
    NODE_ENV: 'test',
    LOG_LEVEL: 'error',
    POSTGRES_HOST: 'localhost',
    POSTGRES_PORT: 5432,
    POSTGRES_USER: 'chatbot',
    POSTGRES_PASSWORD: 'secret',
    POSTGRES_DB: 'chatbot',
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379,
    WEB_PORT: 3003,
  })
  return app
}
