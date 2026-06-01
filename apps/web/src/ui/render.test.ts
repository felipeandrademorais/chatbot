import { describe, expect, it } from 'vitest'

import { deriveUiState, renderAppPage } from './render.js'

const completedWorkflow = {
  workflowId: 'wf-123',
  status: 'completed',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:02.000Z',
  timeline: [
    { status: 'pending', timestamp: '2026-01-01T00:00:00.000Z' },
    { status: 'running', timestamp: '2026-01-01T00:00:01.000Z' },
    { status: 'completed', timestamp: '2026-01-01T00:00:02.000Z' },
  ],
  result: 'done',
} as const

describe('render helpers', () => {
  it('derives success state from completed workflow', () => {
    expect(deriveUiState({ workflow: completedWorkflow })).toBe('success')
  })

  it('renders workflow timeline and result', () => {
    const html = renderAppPage({ workflow: completedWorkflow })
    expect(html).toContain('Workflow wf-123')
    expect(html).toContain('Timeline')
    expect(html).toContain('done')
  })

  it('renders empty state', () => {
    expect(renderAppPage({})).toContain('No workflow selected yet')
  })
})
