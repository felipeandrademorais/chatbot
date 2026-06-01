import { afterEach, describe, expect, it, vi } from 'vitest'

import { WorkflowApiError, createWorkflowApiClient } from './client.js'

describe('workflow api client', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates workflow from typed API response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            workflowId: 'wf-1',
            status: 'pending',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            timeline: [{ status: 'pending', timestamp: '2026-01-01T00:00:00.000Z' }],
          }),
          { status: 202, headers: { 'content-type': 'application/json' } },
        ),
      ),
    )

    const client = createWorkflowApiClient('http://localhost:3000')
    const workflow = await client.createWorkflow({ taskType: 'summary', payload: {} })

    expect(workflow.workflowId).toBe('wf-1')
  })

  it('throws typed API error for error envelopes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: 'WORKFLOW_UNAVAILABLE',
            message: 'temporarily unavailable',
            requestId: 'req-err',
            retryable: true,
          }),
          { status: 500, headers: { 'content-type': 'application/json' } },
        ),
      ),
    )

    const client = createWorkflowApiClient('http://localhost:3000')
    await expect(client.getWorkflow('wf-1')).rejects.toBeInstanceOf(WorkflowApiError)
  })
})
