import { describe, expect, it } from 'vitest'

import { parseErrorResponse, parseWorkflowDetails } from './validators.js'

const validWorkflow = {
  workflowId: 'wf-123',
  status: 'running',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:01.000Z',
  timeline: [{ status: 'pending', timestamp: '2026-01-01T00:00:00.000Z' }],
}

describe('workflow payload validators', () => {
  it('parses valid workflow details', () => {
    const parsed = parseWorkflowDetails(validWorkflow)
    expect(parsed.workflowId).toBe('wf-123')
    expect(parsed.timeline).toHaveLength(1)
  })

  it('rejects malformed workflow details', () => {
    expect(() => parseWorkflowDetails({ ...validWorkflow, status: 'broken' })).toThrow(
      /status is invalid/,
    )
  })

  it('parses error envelope', () => {
    const parsed = parseErrorResponse({
      error: 'WORKFLOW_UNAVAILABLE',
      message: 'Try later',
      requestId: 'req-1',
      retryable: true,
    })
    expect(parsed.retryable).toBe(true)
  })
})
