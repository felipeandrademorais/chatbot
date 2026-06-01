import {
  checkPostgres,
  checkRedis,
  createServiceServer,
  type ServiceApp,
  type WebEnv,
} from '@chatbot/shared'
import formBody from '@fastify/formbody'

import { WorkflowApiError, createWorkflowApiClient, type WorkflowDetails } from './api/client.js'
import { renderAppPage } from './ui/render.js'

interface RouteModel {
  workflow?: WorkflowDetails
  message?: string
  error?: string
  retryable?: boolean
}

function emitTelemetry(app: ServiceApp, event: string, metadata?: Record<string, unknown>): void {
  app.log.info({ event, ...metadata }, event)
}

function parsePayload(input: string): Record<string, unknown> {
  const trimmed = input.trim()
  if (trimmed.length === 0) {
    return {}
  }
  const parsed: unknown = JSON.parse(trimmed)
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Payload must be a JSON object')
  }
  return parsed as Record<string, unknown>
}

function mapError(error: unknown): RouteModel {
  if (error instanceof WorkflowApiError) {
    return {
      error: `${error.code}: ${error.message}`,
      retryable: error.retryable,
    }
  }
  if (error instanceof Error) {
    return { error: error.message, retryable: true }
  }
  return { error: 'Unexpected error', retryable: false }
}

export async function createWebServer(env: WebEnv): Promise<ServiceApp> {
  const configuredWorkflowApiBaseUrl = process.env.WORKFLOW_API_BASE_URL
  const workflowApiBaseUrl = configuredWorkflowApiBaseUrl ?? env.WORKFLOW_API_BASE_URL
  const workflowClient = createWorkflowApiClient(workflowApiBaseUrl)

  return createServiceServer({
    serviceName: 'web',
    logLevel: env.LOG_LEVEL,
    readinessChecks: async () => ({
      postgres: await checkPostgres(env),
      redis: await checkRedis(env),
    }),
    registerRoutes: async (app) => {
      await app.register(formBody)

      app.get('/', (_request, reply) => {
        emitTelemetry(app, 'web_ui_rendered', { state: 'empty' })
        return reply.type('text/html').send(renderAppPage({}))
      })

      app.post<{ Body: { taskType?: string; payload?: string } }>(
        '/workflows',
        async (request, reply) => {
          const taskType = request.body.taskType?.trim() ?? ''
          if (taskType.length === 0) {
            return reply
              .status(400)
              .type('text/html')
              .send(renderAppPage({ error: 'Task type is required.', retryable: false }))
          }

          try {
            const payload = parsePayload(request.body.payload ?? '{}')
            const workflow = await workflowClient.createWorkflow({ taskType, payload })
            emitTelemetry(app, 'web_workflow_submitted', {
              workflowId: workflow.workflowId,
              taskType,
            })
            return await reply.redirect(`/workflows/${encodeURIComponent(workflow.workflowId)}`)
          } catch (error: unknown) {
            const model = mapError(error)
            emitTelemetry(app, 'web_workflow_submit_failed', {
              error: model.error,
              retryable: model.retryable,
            })
            return reply
              .status(502)
              .type('text/html')
              .send(
                renderAppPage({
                  ...model,
                  message: 'Workflow submission failed.',
                }),
              )
          }
        },
      )

      app.get<{ Params: { workflowId: string } }>(
        '/workflows/:workflowId',
        async (request, reply) => {
          const workflowId = request.params.workflowId.trim()
          if (workflowId.length === 0) {
            return reply
              .status(400)
              .type('text/html')
              .send(renderAppPage({ error: 'Invalid workflow ID.' }))
          }

          try {
            const workflow = await workflowClient.getWorkflow(workflowId)
            emitTelemetry(app, 'web_workflow_viewed', {
              workflowId,
              status: workflow.status,
            })
            return await reply.type('text/html').send(renderAppPage({ workflow }))
          } catch (error: unknown) {
            const model = mapError(error)
            emitTelemetry(app, 'web_workflow_view_failed', {
              workflowId,
              error: model.error,
            })
            return reply.status(502).type('text/html').send(renderAppPage(model))
          }
        },
      )

      app.post<{ Params: { workflowId: string } }>(
        '/workflows/:workflowId/retry',
        async (request, reply) => {
          const workflowId = request.params.workflowId.trim()
          try {
            const workflow = await workflowClient.retryWorkflow(workflowId)
            emitTelemetry(app, 'web_workflow_retry_submitted', {
              workflowId,
              status: workflow.status,
            })
            return await reply.redirect(`/workflows/${encodeURIComponent(workflow.workflowId)}`)
          } catch (error: unknown) {
            const model = mapError(error)
            emitTelemetry(app, 'web_workflow_retry_failed', {
              workflowId,
              error: model.error,
            })
            return reply.status(502).type('text/html').send(renderAppPage(model))
          }
        },
      )
    },
  })
}
