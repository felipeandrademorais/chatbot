import {
  DEFAULT_AUTHORIZATION_MATRIX,
  DEFAULT_RATE_LIMIT_POLICY,
  DEFAULT_RETRY_POLICY,
  HEALTH_ROUTES,
  TELEMETRY_ROUTES,
} from '@chatbot/contracts'
import {
  authorizeRequest,
  checkHttpEndpoint,
  checkPostgres,
  checkRedis,
  createInMemoryDomainApiService,
  createServiceServer,
  type GatewayEnv,
  isDomainServiceError,
  type ServiceApp,
} from '@chatbot/shared'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'

type ErrorCode =
  | 'INVALID_ARGUMENT'
  | 'NOT_FOUND'
  | 'INVARIANT_VIOLATION'
  | 'INVALID_STATE_TRANSITION'
  | 'DUPLICATE_ENTITY'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'

interface ErrorEnvelope {
  error: {
    code: ErrorCode
    message: string
    requestId: string
    details?: Readonly<Record<string, string | number | boolean>>
  }
}

const errorEnvelopeSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['error'],
  properties: {
    error: {
      type: 'object',
      additionalProperties: false,
      required: ['code', 'message', 'requestId'],
      properties: {
        code: {
          type: 'string',
          enum: [
            'INVALID_ARGUMENT',
            'NOT_FOUND',
            'INVARIANT_VIOLATION',
            'INVALID_STATE_TRANSITION',
            'DUPLICATE_ENTITY',
            'CONFLICT',
            'INTERNAL_ERROR',
          ],
        },
        message: { type: 'string', minLength: 1 },
        requestId: { type: 'string', minLength: 1 },
        details: {
          type: 'object',
          additionalProperties: {
            type: ['string', 'number', 'boolean'],
          },
        },
      },
    },
  },
} as const

const openApiDocumentPath = new URL('../../../packages/contracts/openapi/v1.0.0.openapi.json', import.meta.url)
const openApiDocument: unknown = JSON.parse(readFileSync(openApiDocumentPath, 'utf8'))

function asErrorEnvelope(
  code: ErrorCode,
  message: string,
  requestId: string,
  details?: Readonly<Record<string, string | number | boolean>>,
): ErrorEnvelope {
  if (details === undefined) {
    return { error: { code, message, requestId } }
  }
  return { error: { code, message, requestId, details } }
}

function requestIdFromBody(body: unknown): string {
  if (body !== null && typeof body === 'object' && 'requestId' in body) {
    const requestId = (body as { requestId?: unknown }).requestId
    if (typeof requestId === 'string' && requestId.length > 0) {
      return requestId
    }
  }
  return randomUUID()
}

function mapErrorCodeToStatus(code: ErrorCode): number {
  switch (code) {
    case 'INVALID_ARGUMENT':
      return 400
    case 'NOT_FOUND':
      return 404
    case 'INVARIANT_VIOLATION':
      return 422
    case 'INVALID_STATE_TRANSITION':
    case 'DUPLICATE_ENTITY':
    case 'CONFLICT':
      return 409
    default:
      return 500
  }
}

function buildProxyHeaders(request: {
  telemetryContext?: { requestId: string; workflowId: string; traceId: string }
  activeSpan?: { spanId: string }
}): Record<string, string> {
  const telemetryContext = request.telemetryContext
  const spanId = request.activeSpan?.spanId ?? ''
  return {
    'x-request-id': telemetryContext?.requestId ?? 'req-missing',
    'x-workflow-id': telemetryContext?.workflowId ?? 'workflow-unknown',
    'x-trace-id': telemetryContext?.traceId ?? '0'.repeat(32),
    'x-span-id': spanId,
    'x-parent-span-id': spanId,
  }
}

function buildUpstreamTraceSummary(request: {
  telemetryContext?: { requestId: string; workflowId: string; traceId: string }
  activeSpan?: { spanId: string }
}): { requestId: string; workflowId: string; traceId: string; spanId: string } {
  return {
    requestId: request.telemetryContext?.requestId ?? 'missing',
    workflowId: request.telemetryContext?.workflowId ?? 'missing',
    traceId: request.telemetryContext?.traceId ?? 'missing',
    spanId: request.activeSpan?.spanId ?? 'missing',
  }
}

const createSessionSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['requestId'],
    properties: {
      requestId: { type: 'string', minLength: 1 },
      userId: { type: 'string', minLength: 1 },
      channel: { type: 'string', minLength: 1 },
    },
  },
  response: {
    201: {
      type: 'object',
      additionalProperties: false,
      required: ['sessionId', 'createdAt'],
      properties: {
        sessionId: { type: 'string', minLength: 1 },
        userId: { type: 'string', minLength: 1 },
        channel: { type: 'string', minLength: 1 },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
    400: errorEnvelopeSchema,
  },
} as const

const createConversationSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['sessionId', 'requestId'],
    properties: {
      sessionId: { type: 'string', minLength: 1 },
      requestId: { type: 'string', minLength: 1 },
    },
  },
  response: {
    201: {
      type: 'object',
      additionalProperties: false,
      required: ['conversationId', 'sessionId', 'createdAt'],
      properties: {
        conversationId: { type: 'string', minLength: 1 },
        sessionId: { type: 'string', minLength: 1 },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
    400: errorEnvelopeSchema,
    404: errorEnvelopeSchema,
  },
} as const

const appendMessageSchema = {
  params: {
    type: 'object',
    additionalProperties: false,
    required: ['conversationId'],
    properties: {
      conversationId: { type: 'string', minLength: 1 },
    },
  },
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['requestId', 'role', 'content'],
    properties: {
      requestId: { type: 'string', minLength: 1 },
      role: { type: 'string', enum: ['system', 'user', 'assistant', 'tool'] },
      content: { type: 'string', minLength: 1 },
      agentId: { type: 'string', minLength: 1 },
      toolName: { type: 'string', minLength: 1 },
    },
  },
  response: {
    200: {
      type: 'object',
      additionalProperties: false,
      required: ['conversationId', 'messageIndex', 'timestamp'],
      properties: {
        conversationId: { type: 'string', minLength: 1 },
        messageIndex: { type: 'integer', minimum: 0 },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
    400: errorEnvelopeSchema,
    404: errorEnvelopeSchema,
  },
} as const

type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

interface WorkflowTimelineEntry {
  status: WorkflowStatus
  timestamp: string
  note?: string
}

interface WorkflowDetails {
  workflowId: string
  status: WorkflowStatus
  createdAt: string
  updatedAt: string
  timeline: WorkflowTimelineEntry[]
  result?: string
  error?: string
}

interface WorkflowClientError {
  error: string
  message: string
  requestId: string
  retryable?: boolean
}

const workflowClientErrorSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['error', 'message', 'requestId'],
  properties: {
    error: { type: 'string', minLength: 1 },
    message: { type: 'string', minLength: 1 },
    requestId: { type: 'string', minLength: 1 },
    retryable: { type: 'boolean' },
  },
} as const

const workflowDetailsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['workflowId', 'status', 'createdAt', 'updatedAt', 'timeline'],
  properties: {
    workflowId: { type: 'string', minLength: 1 },
    status: { type: 'string', enum: ['pending', 'running', 'completed', 'failed', 'cancelled'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    timeline: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['status', 'timestamp'],
        properties: {
          status: { type: 'string', enum: ['pending', 'running', 'completed', 'failed', 'cancelled'] },
          timestamp: { type: 'string', format: 'date-time' },
          note: { type: 'string', minLength: 1 },
        },
      },
    },
    result: { type: 'string' },
    error: { type: 'string' },
  },
} as const

const createWorkflowSchema = {
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['taskType'],
    properties: {
      taskType: { type: 'string', minLength: 1 },
      payload: { type: 'object', additionalProperties: true },
    },
  },
  response: {
    202: workflowDetailsSchema,
    400: workflowClientErrorSchema,
    404: workflowClientErrorSchema,
    409: workflowClientErrorSchema,
    422: workflowClientErrorSchema,
    500: workflowClientErrorSchema,
  },
} as const

const getWorkflowSchema = {
  params: {
    type: 'object',
    additionalProperties: false,
    required: ['workflowId'],
    properties: {
      workflowId: { type: 'string', minLength: 1 },
    },
  },
  response: {
    200: workflowDetailsSchema,
    400: workflowClientErrorSchema,
    404: workflowClientErrorSchema,
    500: workflowClientErrorSchema,
  },
} as const

const retryWorkflowSchema = {
  params: {
    type: 'object',
    additionalProperties: false,
    required: ['workflowId'],
    properties: {
      workflowId: { type: 'string', minLength: 1 },
    },
  },
  response: {
    202: workflowDetailsSchema,
    400: workflowClientErrorSchema,
    404: workflowClientErrorSchema,
    409: workflowClientErrorSchema,
    500: workflowClientErrorSchema,
  },
} as const

function asWorkflowClientError(
  error: string,
  message: string,
  requestId: string,
  retryable?: boolean,
): WorkflowClientError {
  if (retryable === undefined) {
    return { error, message, requestId }
  }
  return { error, message, requestId, retryable }
}

function workflowDetailsFromStart(
  workflowId: string,
  status: WorkflowStatus,
  createdAt: string,
): WorkflowDetails {
  return {
    workflowId,
    status,
    createdAt,
    updatedAt: createdAt,
    timeline: [{ status, timestamp: createdAt }],
  }
}

const completeWorkflowTaskSchema = {
  params: {
    type: 'object',
    additionalProperties: false,
    required: ['workflowId', 'taskId'],
    properties: {
      workflowId: { type: 'string', minLength: 1 },
      taskId: { type: 'string', minLength: 1 },
    },
  },
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['requestId', 'success'],
    properties: {
      requestId: { type: 'string', minLength: 1 },
      success: { type: 'boolean' },
      failureReason: { type: 'string', minLength: 1 },
    },
  },
  response: {
    200: {
      type: 'object',
      additionalProperties: false,
      required: ['workflowId', 'status', 'updatedAt'],
      properties: {
        workflowId: { type: 'string', minLength: 1 },
        status: { type: 'string', enum: ['pending', 'running', 'completed', 'failed', 'cancelled'] },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    400: errorEnvelopeSchema,
    404: errorEnvelopeSchema,
  },
} as const

const cancelWorkflowSchema = {
  params: {
    type: 'object',
    additionalProperties: false,
    required: ['workflowId'],
    properties: {
      workflowId: { type: 'string', minLength: 1 },
    },
  },
  body: {
    type: 'object',
    additionalProperties: false,
    required: ['requestId'],
    properties: {
      requestId: { type: 'string', minLength: 1 },
      reason: { type: 'string', minLength: 1 },
    },
  },
  response: {
    200: {
      type: 'object',
      additionalProperties: false,
      required: ['workflowId', 'status', 'updatedAt'],
      properties: {
        workflowId: { type: 'string', minLength: 1 },
        status: { type: 'string', enum: ['pending', 'running', 'completed', 'failed', 'cancelled'] },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    400: errorEnvelopeSchema,
    404: errorEnvelopeSchema,
    409: errorEnvelopeSchema,
  },
} as const

export async function createGatewayServer(env: GatewayEnv): Promise<ServiceApp> {
  const orchestratorLiveUrl = new URL(HEALTH_ROUTES.live, env.ORCHESTRATOR_URL).toString()
  const orchestratorTelemetryUrl = new URL(TELEMETRY_ROUTES.context, env.ORCHESTRATOR_URL).toString()
  const domainApiService = createInMemoryDomainApiService()
  const workflowDetailsById = new Map<string, WorkflowDetails>()

  return createServiceServer({
    serviceName: 'gateway',
    logLevel: env.LOG_LEVEL,
    readinessChecks: async () => ({
      postgres: await checkPostgres(env),
      redis: await checkRedis(env),
      orchestrator: await checkHttpEndpoint(orchestratorLiveUrl),
    }),
    registerRoutes: (app) => {
      app.setErrorHandler((error, request, reply) => {
        const requestId = requestIdFromBody(request.body)
        const knownError = error as { validation?: unknown; statusCode?: unknown; code?: unknown }
        const knownStatusCode =
          typeof knownError.statusCode === 'number'
            ? knownError.statusCode
            : undefined
        const knownCode =
          typeof knownError.code === 'string'
            ? knownError.code
            : undefined

        if (isDomainServiceError(error)) {
          const code = error.code as ErrorCode
          return reply.status(mapErrorCodeToStatus(code)).send(asErrorEnvelope(code, error.message, requestId, error.details))
        }

        if (knownError.validation !== undefined || knownStatusCode === 400 || knownCode === 'FST_ERR_VALIDATION') {
          return reply
            .status(400)
            .send(asErrorEnvelope('INVALID_ARGUMENT', 'Request validation failed', requestId))
        }

        request.log.error({ err: error }, 'gateway request failed')
        return reply
          .status(500)
          .send(asErrorEnvelope('INTERNAL_ERROR', 'Internal server error', requestId))
      })

      app.get('/api/v1/openapi.json', () => openApiDocument)

      app.post('/api/v1/sessions', { schema: createSessionSchema, attachValidation: true }, async (request, reply) => {
        if (request.validationError !== undefined) {
          return reply
            .status(400)
            .send(asErrorEnvelope('INVALID_ARGUMENT', 'Request validation failed', requestIdFromBody(request.body)))
        }

        const body = request.body as {
          requestId: string
          userId?: string
          channel?: string
        }
        const result = await domainApiService.createSession(body)
        return reply.status(201).send(result)
      })

      app.post('/api/v1/conversations', { schema: createConversationSchema, attachValidation: true }, async (request, reply) => {
        if (request.validationError !== undefined) {
          return reply
            .status(400)
            .send(asErrorEnvelope('INVALID_ARGUMENT', 'Request validation failed', requestIdFromBody(request.body)))
        }

        const body = request.body as {
          sessionId: string
          requestId: string
        }
        const result = await domainApiService.createConversation(body)
        return reply.status(201).send(result)
      })

      app.post('/api/v1/conversations/:conversationId/messages', { schema: appendMessageSchema, attachValidation: true }, async (request, reply) => {
        if (request.validationError !== undefined) {
          return reply
            .status(400)
            .send(asErrorEnvelope('INVALID_ARGUMENT', 'Request validation failed', requestIdFromBody(request.body)))
        }

        const params = request.params as { conversationId: string }
        const body = request.body as {
          requestId: string
          role: 'system' | 'user' | 'assistant' | 'tool'
          content: string
          agentId?: string
          toolName?: string
        }
        return domainApiService.appendMessage({
          ...body,
          conversationId: params.conversationId,
        })
      })

      app.post('/api/v1/workflows', { schema: createWorkflowSchema, attachValidation: true }, async (request, reply) => {
        const requestId = randomUUID()
        if (request.validationError !== undefined) {
          return reply
            .status(400)
            .send(
              asWorkflowClientError('INVALID_ARGUMENT', 'Request validation failed', requestId, false),
            )
        }

        const body = request.body as {
          taskType: string
          payload?: Record<string, unknown>
        }

        try {
          const workflowId = `wf-${randomUUID()}`
          const taskId = `task-${workflowId}`
          const session = await domainApiService.createSession({
            requestId: `req-session-${requestId}`,
            channel: 'web',
          })
          const conversation = await domainApiService.createConversation({
            sessionId: session.sessionId,
            requestId: `req-conversation-${requestId}`,
          })
          const started = await domainApiService.startWorkflow({
            requestId,
            workflowId,
            conversationId: conversation.conversationId,
            taskId,
            taskType: body.taskType,
          })

          const details = workflowDetailsFromStart(
            started.workflowId,
            started.status,
            started.createdAt,
          )
          workflowDetailsById.set(started.workflowId, details)
          return reply.status(202).send(details)
        } catch (error: unknown) {
          if (isDomainServiceError(error)) {
            const clientError = asWorkflowClientError(
              error.code,
              error.message,
              requestId,
              mapErrorCodeToStatus(error.code as ErrorCode) >= 500,
            )
            switch (error.code) {
              case 'INVALID_ARGUMENT':
                return reply.status(400).send(clientError)
              case 'NOT_FOUND':
                return reply.status(404).send(clientError)
              case 'INVALID_STATE_TRANSITION':
              case 'DUPLICATE_ENTITY':
              case 'CONFLICT':
                return reply.status(409).send(clientError)
              case 'INVARIANT_VIOLATION':
                return reply.status(422).send(clientError)
              default:
                return reply.status(500).send(clientError)
            }
          }
          request.log.error({ err: error }, 'create workflow failed')
          return reply
            .status(500)
            .send(
              asWorkflowClientError('INTERNAL_ERROR', 'Internal server error', requestId, true),
            )
        }
      })

      app.get(
        '/api/v1/workflows/:workflowId',
        { schema: getWorkflowSchema, attachValidation: true },
        async (request, reply) => {
          const requestId = randomUUID()
          if (request.validationError !== undefined) {
            return reply
              .status(400)
              .send(
                asWorkflowClientError('INVALID_ARGUMENT', 'Request validation failed', requestId, false),
              )
          }

          const params = request.params as { workflowId: string }
          const details = workflowDetailsById.get(params.workflowId)
          if (details === undefined) {
            return reply
              .status(404)
              .send(asWorkflowClientError('NOT_FOUND', 'Workflow not found', requestId, false))
          }
          return reply.send(details)
        },
      )

      app.post(
        '/api/v1/workflows/:workflowId/retry',
        { schema: retryWorkflowSchema, attachValidation: true },
        async (request, reply) => {
          const requestId = randomUUID()
          if (request.validationError !== undefined) {
            return reply
              .status(400)
              .send(
                asWorkflowClientError('INVALID_ARGUMENT', 'Request validation failed', requestId, false),
              )
          }

          const params = request.params as { workflowId: string }
          const existing = workflowDetailsById.get(params.workflowId)
          if (existing === undefined) {
            return reply
              .status(404)
              .send(asWorkflowClientError('NOT_FOUND', 'Workflow not found', requestId, false))
          }
          if (existing.status !== 'failed') {
            return reply
              .status(409)
              .send(
                asWorkflowClientError(
                  'CONFLICT',
                  'Only failed workflows can be retried',
                  requestId,
                  false,
                ),
              )
          }

          const updatedAt = new Date().toISOString()
          const retried: WorkflowDetails = {
            ...existing,
            status: 'completed',
            updatedAt,
            timeline: [
              ...existing.timeline,
              { status: 'completed', timestamp: updatedAt, note: 'Retried successfully' },
            ],
            result: 'Workflow completed',
          }
          delete retried.error
          workflowDetailsById.set(params.workflowId, retried)
          return reply.status(202).send(retried)
        },
      )

      app.post(
        '/api/v1/workflows/:workflowId/tasks/:taskId/complete',
        { schema: completeWorkflowTaskSchema, attachValidation: true },
        async (request, reply) => {
          if (request.validationError !== undefined) {
            return reply
              .status(400)
              .send(asErrorEnvelope('INVALID_ARGUMENT', 'Request validation failed', requestIdFromBody(request.body)))
          }

          const params = request.params as { workflowId: string; taskId: string }
          const body = request.body as {
            requestId: string
            success: boolean
            failureReason?: string
          }
          const result = await domainApiService.completeWorkflowTask({
            ...body,
            workflowId: params.workflowId,
            taskId: params.taskId,
          })
          const existing = workflowDetailsById.get(params.workflowId)
          if (existing !== undefined) {
            workflowDetailsById.set(params.workflowId, {
              ...existing,
              status: result.status,
              updatedAt: result.updatedAt,
              timeline: [
                ...existing.timeline,
                { status: result.status, timestamp: result.updatedAt },
              ],
              ...(result.status === 'completed'
                ? { result: 'Workflow completed' }
                : { error: body.failureReason ?? 'Workflow failed' }),
            })
          }
          return result
        },
      )

      app.post('/api/v1/workflows/:workflowId/cancel', { schema: cancelWorkflowSchema, attachValidation: true }, async (request, reply) => {
        if (request.validationError !== undefined) {
          return reply
            .status(400)
            .send(asErrorEnvelope('INVALID_ARGUMENT', 'Request validation failed', requestIdFromBody(request.body)))
        }

        const params = request.params as { workflowId: string }
        const body = request.body as { requestId: string; reason?: string }
        const result = await domainApiService.cancelWorkflow({
          ...body,
          workflowId: params.workflowId,
        })
        const existing = workflowDetailsById.get(params.workflowId)
        if (existing !== undefined) {
          workflowDetailsById.set(params.workflowId, {
            ...existing,
            status: result.status,
            updatedAt: result.updatedAt,
            timeline: [
              ...existing.timeline,
              { status: result.status, timestamp: result.updatedAt },
            ],
          })
        }
        return result
      })

      app.get('/internal/orchestrator/ping', async (request, reply) => {
        const auth = authorizeRequest(request.headers.authorization, {
          requiredAction: 'gateway:orchestrator:ping',
          authorizationMatrix: DEFAULT_AUTHORIZATION_MATRIX,
          jwtSecret: env.JWT_SECRET,
        })
        if (!auth.ok) {
          await reply.status(auth.statusCode).send({
            error: auth.reason,
            message: auth.message,
          })
          return
        }

        const response = await fetch(orchestratorTelemetryUrl, {
          headers: buildProxyHeaders(request),
          signal: AbortSignal.timeout(5_000),
        })
        if (!response.ok) {
          return { ok: false, status: response.status }
        }
        const body: unknown = await response.json()
        return {
          ok: true,
          livenessProbeUrl: orchestratorLiveUrl,
          upstream: buildUpstreamTraceSummary(request),
          orchestrator: body,
          subject: auth.claims.sub,
          role: auth.claims.role,
        }
      })

      app.get('/internal/scalability/contracts', () => ({
        rateLimit: {
          ...DEFAULT_RATE_LIMIT_POLICY,
          windowMs: env.RATE_LIMIT_WINDOW_MS,
          maxRequestsPerWindow: env.RATE_LIMIT_MAX_REQUESTS,
          burstAllowance: env.RATE_LIMIT_BURST_ALLOWANCE,
        },
        retry: {
          ...DEFAULT_RETRY_POLICY,
          timeoutMs: env.RETRY_TIMEOUT_MS,
          maxRetries: env.RETRY_MAX_RETRIES,
          backoffMultiplier: env.RETRY_BACKOFF_MULTIPLIER,
          maxBackoffMs: env.RETRY_MAX_BACKOFF_MS,
        },
      }))
    },
  })
}
