import { createTaskId } from '@chatbot/contracts'
import { describe, expect, it } from 'vitest'

import { WorkflowTask } from '../src/entities/workflow-task.js'
import { DomainError } from '../src/errors/domain-error.js'

describe('WorkflowTask entity', () => {
  it('transitions pending to running to completed', () => {
    const task = WorkflowTask.createPending(createTaskId('t1'), 'search')
    const running = task.markRunning()
    const done = running.markCompleted(true)
    expect(done.status).toBe('completed')
  })

  it('rejects invalid task type', () => {
    expect(() => WorkflowTask.createPending(createTaskId('t2'), '   ')).toThrow(DomainError)
  })

  it('rejects invalid running transition', () => {
    const task = WorkflowTask.createPending(createTaskId('t3'), 'chat').markRunning()
    expect(() => task.markRunning()).toThrow(DomainError)
  })
})
