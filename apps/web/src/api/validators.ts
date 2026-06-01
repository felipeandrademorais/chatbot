import type { WorkflowStatus } from '@chatbot/contracts'

import type { components } from './generated/openapi-types.js'

type WorkflowDetailsSchema = components['schemas']['WorkflowDetails']
type WorkflowTimelineSchema = components['schemas']['WorkflowTimelineEntry']
type ErrorResponseSchema = components['schemas']['WorkflowClientError']

const WORKFLOW_STATUSES: ReadonlySet<WorkflowStatus> = new Set([
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0) {
    return false
  }
  return !Number.isNaN(Date.parse(value))
}

function isWorkflowStatus(value: unknown): value is WorkflowStatus {
  return typeof value === 'string' && WORKFLOW_STATUSES.has(value as WorkflowStatus)
}

function parseRequiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} is required`)
  }
  return value
}

function parseOptionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function parseTimelineEntry(value: unknown): WorkflowTimelineSchema {
  if (!isRecord(value)) {
    throw new Error('timeline entry must be an object')
  }

  if (!isWorkflowStatus(value.status)) {
    throw new Error('timeline entry status is invalid')
  }
  if (!isIsoDate(value.timestamp)) {
    throw new Error('timeline entry timestamp is invalid')
  }

  const note =
    typeof value.note === 'string' && value.note.trim().length > 0 ? value.note.trim() : undefined

  return note
    ? {
        status: value.status,
        timestamp: value.timestamp,
        note,
      }
    : {
        status: value.status,
        timestamp: value.timestamp,
      }
}

export function parseWorkflowDetails(value: unknown): WorkflowDetailsSchema {
  if (!isRecord(value)) {
    throw new Error('workflow response must be an object')
  }
  const workflowId = parseRequiredText(value.workflowId, 'workflowId')
  if (!isWorkflowStatus(value.status)) throw new Error('status is invalid')
  if (!isIsoDate(value.createdAt) || !isIsoDate(value.updatedAt))
    throw new Error('createdAt/updatedAt must be ISO date strings')
  if (!Array.isArray(value.timeline) || value.timeline.length === 0)
    throw new Error('timeline must contain at least one entry')

  const timeline = value.timeline.map((entry) => parseTimelineEntry(entry))
  const result = parseOptionalText(value.result)
  const error = parseOptionalText(value.error)

  const base: WorkflowDetailsSchema = {
    workflowId,
    status: value.status,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    timeline,
  }
  if (result) {
    base.result = result
  }
  if (error) {
    base.error = error
  }
  return base
}

export function parseErrorResponse(value: unknown): ErrorResponseSchema {
  if (!isRecord(value)) {
    throw new Error('error response must be an object')
  }
  if (typeof value.error !== 'string' || value.error.trim().length === 0) {
    throw new Error('error code is required')
  }
  if (typeof value.message !== 'string' || value.message.trim().length === 0) {
    throw new Error('error message is required')
  }
  if (typeof value.requestId !== 'string' || value.requestId.trim().length === 0) {
    throw new Error('requestId is required')
  }

  const base: ErrorResponseSchema = {
    error: value.error,
    message: value.message,
    requestId: value.requestId,
  }
  if (typeof value.retryable === 'boolean') {
    base.retryable = value.retryable
  }
  return base
}
