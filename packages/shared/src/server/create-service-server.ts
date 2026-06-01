import {
  HEALTH_ROUTES,
  TELEMETRY_ROUTES,
  type HealthStatus,
  type ReadinessCheck,
  type ReadinessResponse,
  type TelemetryLogRecord,
} from '@chatbot/contracts'
import Fastify, {
  type FastifyInstance,
  type FastifyRequest,
} from 'fastify'

export type ServiceApp = FastifyInstance

import {
  recordHttpError,
  recordHttpRequest,
  renderPrometheusMetrics,
} from '../telemetry/metrics.js'
import {
  buildTraceHeaders,
  finishSpan,
  getRecentSpans,
  parseTelemetryContext,
  startSpan,
  TRACE_HEADERS,
  type ActiveSpan,
  type TelemetryContext,
} from '../telemetry/tracing.js'

export interface ServiceServerOptions {
  serviceName: string
  logLevel: string
  readinessChecks?: () => Promise<Record<string, ReadinessCheck>>
  registerRoutes?: (app: FastifyInstance) => void | Promise<void>
}

declare module 'fastify' {
  interface FastifyRequest {
    telemetryContext?: TelemetryContext
    activeSpan?: ActiveSpan
    telemetryStartNs?: bigint
  }
}

function aggregateStatus(checks: Record<string, ReadinessCheck>): HealthStatus {
  const values = Object.values(checks)
  if (values.some((check) => check.status === 'unhealthy')) {
    return 'unhealthy'
  }
  if (values.some((check) => check.status === 'degraded')) {
    return 'degraded'
  }
  return 'ok'
}

function telemetryContextResponse(serviceName: string, request: FastifyRequest): {
  service: string
  requestId: string
  workflowId: string
  traceId: string
  spanId: string
  parentSpanId: string | null
} {
  let requestId = 'missing'
  let workflowId = 'missing'
  let traceId = 'missing'
  if (request.telemetryContext !== undefined) {
    requestId = request.telemetryContext.requestId
    workflowId = request.telemetryContext.workflowId
    traceId = request.telemetryContext.traceId
  }

  let spanId = 'missing'
  let parentSpanId: string | null = null
  if (request.activeSpan !== undefined) {
    spanId = request.activeSpan.spanId
    parentSpanId = request.activeSpan.parentSpanId ?? null
  }

  return {
    service: serviceName,
    requestId,
    workflowId,
    traceId,
    spanId,
    parentSpanId,
  }
}

export async function createServiceServer(options: ServiceServerOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: { level: options.logLevel },
  })

  app.addHook('onRequest', async (request) => {
    const context = parseTelemetryContext(request.headers)
    const parentSpanIdHeader = request.headers[TRACE_HEADERS.spanId]
    const parentSpanId =
      typeof parentSpanIdHeader === 'string' && parentSpanIdHeader.length > 0
        ? parentSpanIdHeader
        : undefined
    const span = startSpan(`${request.method} ${request.url}`, parentSpanId)

    request.telemetryContext = context
    request.activeSpan = span
    request.telemetryStartNs = process.hrtime.bigint()
  })

  app.addHook('onSend', async (request, reply, payload) => {
    const context = request.telemetryContext
    const span = request.activeSpan
    if (context !== undefined && span !== undefined) {
      const headers = buildTraceHeaders(context, span)
      reply.header(TRACE_HEADERS.requestId, headers[TRACE_HEADERS.requestId])
      reply.header(TRACE_HEADERS.workflowId, headers[TRACE_HEADERS.workflowId])
      reply.header(TRACE_HEADERS.traceId, headers[TRACE_HEADERS.traceId])
      reply.header(TRACE_HEADERS.spanId, headers[TRACE_HEADERS.spanId])
      const parentSpanHeader = headers[TRACE_HEADERS.parentSpanId] ?? ''
      if (parentSpanHeader.length > 0) {
        reply.header(TRACE_HEADERS.parentSpanId, parentSpanHeader)
      }
    }
    return payload
  })

  app.addHook('onError', async (request, _reply, _error) => {
    recordHttpError({
      service: options.serviceName,
      route: request.routeOptions.url ?? request.url,
      method: request.method,
    })
  })

  app.addHook('onResponse', async (request, reply) => {
    const startNs = request.telemetryStartNs
    const durationMs =
      startNs === undefined ? 0 : Number(process.hrtime.bigint() - startNs) / 1_000_000

    recordHttpRequest({
      service: options.serviceName,
      route: request.routeOptions.url ?? request.url,
      method: request.method,
      statusCode: reply.statusCode,
      durationMs,
    })

    const context = request.telemetryContext
    const span = request.activeSpan
    if (context !== undefined && span !== undefined) {
      finishSpan(
        context,
        options.serviceName,
        span,
        reply.statusCode >= 500 ? 'error' : 'ok',
      )

      const logRecord: TelemetryLogRecord = {
        event: 'http_request_completed',
        service: options.serviceName,
        requestId: context.requestId,
        workflowId: context.workflowId,
        traceId: context.traceId,
        spanId: span.spanId,
        statusCode: reply.statusCode,
        durationMs,
      }
      app.log.info(logRecord)
    }
  })

  app.get(HEALTH_ROUTES.live, () => ({
    status: 'ok' as const,
    service: options.serviceName,
    timestamp: new Date().toISOString(),
  }))

  app.get(HEALTH_ROUTES.ready, async (_request, reply) => {
    const checks = (await options.readinessChecks?.()) ?? {}
    const status = aggregateStatus(checks)
    const body: ReadinessResponse = {
      status,
      service: options.serviceName,
      timestamp: new Date().toISOString(),
      checks,
    }

    if (status !== 'ok') {
      await reply.status(503).send(body)
      return
    }

    return body
  })

  app.get(TELEMETRY_ROUTES.metrics, async (_request, reply) => {
    reply.type('text/plain; version=0.0.4')
    return renderPrometheusMetrics()
  })

  app.get(TELEMETRY_ROUTES.context, (request: FastifyRequest) =>
    telemetryContextResponse(options.serviceName, request),
  )

  app.get(
    TELEMETRY_ROUTES.traces,
    (request: FastifyRequest<{ Querystring: { limit?: string } }>) => {
      const parsed = Number(request.query.limit ?? 50)
      const limit = Number.isFinite(parsed) ? parsed : 50
      return { spans: getRecentSpans(limit) }
    },
  )

  if (options.registerRoutes) {
    await options.registerRoutes(app)
  }

  return app
}

export async function startServiceServer(
  app: FastifyInstance,
  port: number,
  host = '0.0.0.0',
): Promise<void> {
  await app.listen({ port, host })
}
