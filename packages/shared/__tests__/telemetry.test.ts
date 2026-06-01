import { describe, expect, it } from 'vitest'

import {
  calculateOverheadPercent,
  buildTraceHeaders,
  finishSpan,
  getRecentSpans,
  isTelemetryOverheadWithinBudget,
  parseTelemetryContext,
  startSpan,
  telemetryCorrelationSchema,
  telemetryLogRecordSchema,
} from '../src/index.js'

describe('telemetry schema', () => {
  it('validates canonical log envelope', () => {
    const parsed = telemetryLogRecordSchema.parse({
      event: 'http_request_completed',
      service: 'gateway',
      requestId: 'req-abc-123',
      workflowId: 'wf-abc-123',
      traceId: 'f'.repeat(32),
      spanId: 'f'.repeat(16),
      statusCode: 200,
      durationMs: 4.5,
    })

    expect(parsed.requestId).toBe('req-abc-123')
  })

  it('normalizes missing workflow id with a bounded fallback', () => {
    const context = parseTelemetryContext({
      'x-request-id': 'req-123',
    })

    expect(context.requestId).toBe('req-123')
    expect(context.workflowId).toBe('workflow-unknown')
  })
})

describe('tracing helpers', () => {
  it('builds and records spans with correlation fields', () => {
    const context = parseTelemetryContext({
      'x-request-id': 'req-span-1',
      'x-workflow-id': 'wf-span-1',
      'x-trace-id': 'a'.repeat(32),
    })
    const span = startSpan('GET /health/live', 'b'.repeat(16))
    const headers = buildTraceHeaders(context, span)

    expect(headers['x-request-id']).toBe('req-span-1')
    expect(headers['x-workflow-id']).toBe('wf-span-1')
    expect(headers['x-trace-id']).toBe('a'.repeat(32))
    expect(headers['x-parent-span-id']).toBe('b'.repeat(16))

    const record = finishSpan(context, 'gateway', span, 'ok')
    expect(record.requestId).toBe('req-span-1')
    expect(record.workflowId).toBe('wf-span-1')
    expect(record.traceId).toBe('a'.repeat(32))
    expect(record.spanId.length).toBe(16)
    expect(record.parentSpanId).toBe('b'.repeat(16))
    expect(getRecentSpans(1)[0]).toMatchObject(record)
  })
})

describe('telemetry overhead', () => {
  it('calculates throughput overhead and enforces <5% budget', () => {
    const overheadPercent = calculateOverheadPercent({
      baselineRps: 2_000,
      instrumentedRps: 1_920,
    })
    expect(overheadPercent).toBe(4)
    expect(
      isTelemetryOverheadWithinBudget({
        baselineRps: 2_000,
        instrumentedRps: 1_920,
      }),
    ).toBe(true)
    expect(
      isTelemetryOverheadWithinBudget({
        baselineRps: 2_000,
        instrumentedRps: 1_850,
      }),
    ).toBe(false)
  })

  it('enforces requestId/workflowId in correlation schema', () => {
    const result = telemetryCorrelationSchema.safeParse({
      requestId: '',
      workflowId: 'wf-1',
    })
    expect(result.success).toBe(false)
  })
})
