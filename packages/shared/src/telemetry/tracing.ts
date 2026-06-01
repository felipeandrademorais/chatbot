import { randomBytes } from 'node:crypto'

import type { TraceSpanRecord } from '@chatbot/contracts'

import { normalizeWorkflowId } from './schema.js'

export const TRACE_HEADERS = {
  requestId: 'x-request-id',
  workflowId: 'x-workflow-id',
  traceId: 'x-trace-id',
  spanId: 'x-span-id',
  parentSpanId: 'x-parent-span-id',
} as const

export interface TelemetryContext {
  requestId: string
  workflowId: string
  traceId: string
}

export interface ActiveSpan {
  spanId: string
  parentSpanId?: string
  name: string
  startedAt: number
}

const spanStore: TraceSpanRecord[] = []
const MAX_SPANS = 500

function randomHex(length: number): string {
  return randomBytes(length / 2).toString('hex')
}

export function parseTelemetryContext(headers: Headers | Record<string, unknown>): TelemetryContext {
  const readHeader = (name: string): string | undefined => {
    if (headers instanceof Headers) {
      return headers.get(name) ?? undefined
    }
    const value = headers[name]
    if (typeof value === 'string') {
      return value
    }
    if (Array.isArray(value) && typeof value[0] === 'string') {
      return value[0]
    }
    return undefined
  }

  const requestId = readHeader(TRACE_HEADERS.requestId) ?? `req-${randomHex(16)}`
  const workflowId = normalizeWorkflowId(readHeader(TRACE_HEADERS.workflowId))
  const traceId = readHeader(TRACE_HEADERS.traceId) ?? randomHex(32)

  return { requestId, workflowId, traceId }
}

export function startSpan(name: string, parentSpanId?: string): ActiveSpan {
  return {
    name,
    spanId: randomHex(16),
    ...(parentSpanId === undefined ? {} : { parentSpanId }),
    startedAt: Date.now(),
  }
}

export function finishSpan(
  context: TelemetryContext,
  service: string,
  span: ActiveSpan,
  status: 'ok' | 'error',
): TraceSpanRecord {
  const record: TraceSpanRecord = {
    requestId: context.requestId,
    workflowId: context.workflowId,
    traceId: context.traceId,
    spanId: span.spanId,
    ...(span.parentSpanId === undefined ? {} : { parentSpanId: span.parentSpanId }),
    service,
    name: span.name,
    startTime: new Date(span.startedAt).toISOString(),
    durationMs: Math.max(0, Date.now() - span.startedAt),
    status,
  }

  spanStore.push(record)
  if (spanStore.length > MAX_SPANS) {
    spanStore.shift()
  }

  return record
}

export function buildTraceHeaders(
  context: TelemetryContext,
  span: ActiveSpan,
): Record<string, string> {
  return {
    [TRACE_HEADERS.requestId]: context.requestId,
    [TRACE_HEADERS.workflowId]: context.workflowId,
    [TRACE_HEADERS.traceId]: context.traceId,
    [TRACE_HEADERS.spanId]: span.spanId,
    [TRACE_HEADERS.parentSpanId]: span.parentSpanId ?? '',
  }
}

export function getRecentSpans(limit = 50): readonly TraceSpanRecord[] {
  const boundedLimit = Math.max(1, Math.min(limit, 200))
  return spanStore.slice(-boundedLimit)
}
