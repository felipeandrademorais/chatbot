import { z } from 'zod'

const identifierPattern = /^[a-zA-Z0-9._:-]{3,128}$/

export const telemetryCorrelationSchema = z.object({
  requestId: z.string().regex(identifierPattern, 'requestId must be a bounded identifier'),
  workflowId: z.string().regex(identifierPattern, 'workflowId must be a bounded identifier'),
})

export const traceContextSchema = z.object({
  traceId: z.string().regex(/^[a-f0-9]{32}$/i, 'traceId must be 32 hex chars'),
  spanId: z.string().regex(/^[a-f0-9]{16}$/i, 'spanId must be 16 hex chars'),
  parentSpanId: z.string().regex(/^[a-f0-9]{16}$/i).optional(),
})

export const telemetryLogRecordSchema = telemetryCorrelationSchema.extend({
  service: z.string().min(1),
  event: z.string().min(1),
  traceId: traceContextSchema.shape.traceId,
  spanId: traceContextSchema.shape.spanId,
  statusCode: z.number().int().min(100).max(599).optional(),
  durationMs: z.number().nonnegative().optional(),
})

export const metricLabelPolicy = {
  service: /^[a-z][a-z0-9-]{1,31}$/,
  route: /^\/[a-zA-Z0-9_./:-]*$/,
  method: /^(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)$/,
  status_code: /^[1-5]\d\d$/,
} as const

export function normalizeWorkflowId(workflowId: string | undefined): string {
  if (workflowId === undefined || workflowId.trim().length === 0) {
    return 'workflow-unknown'
  }
  return workflowId
}
