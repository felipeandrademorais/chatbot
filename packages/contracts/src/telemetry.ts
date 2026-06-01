/**
 * Telemetry contracts shared across services.
 *
 * Defines standardized correlation fields, trace context,
 * and canonical telemetry endpoint paths.
 */
export const TELEMETRY_ROUTES = {
  metrics: '/metrics',
  context: '/internal/telemetry/context',
  traces: '/internal/telemetry/traces',
} as const

export type TelemetryRoute = (typeof TELEMETRY_ROUTES)[keyof typeof TELEMETRY_ROUTES]

/**
 * Required correlation keys for logs and critical-path spans.
 */
export interface TelemetryCorrelation {
  readonly requestId: string
  readonly workflowId: string
}

/**
 * Canonical trace context propagated over HTTP headers.
 */
export interface TraceContext {
  readonly traceId: string
  readonly spanId: string
  readonly parentSpanId?: string
}

/**
 * Captured trace span payload for in-memory/debug sinks.
 */
export interface TraceSpanRecord extends TraceContext, TelemetryCorrelation {
  readonly service: string
  readonly name: string
  readonly startTime: string
  readonly durationMs: number
  readonly status: 'ok' | 'error'
}

/**
 * Minimal structured log envelope used by all services.
 */
export interface TelemetryLogRecord extends TelemetryCorrelation {
  readonly service: string
  readonly event: string
  readonly traceId: string
  readonly spanId: string
  readonly statusCode?: number
  readonly durationMs?: number
}

export function createTelemetryCorrelation(
  requestId: string,
  workflowId: string,
): TelemetryCorrelation {
  if (requestId.trim().length === 0) {
    throw new Error('requestId must not be empty')
  }
  if (workflowId.trim().length === 0) {
    throw new Error('workflowId must not be empty')
  }
  return { requestId, workflowId }
}
