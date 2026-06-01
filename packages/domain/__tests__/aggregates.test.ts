import { createTaskId, createWorkflowId } from '@chatbot/contracts'
import { describe, expect, it } from 'vitest'

import { Conversation } from '../src/aggregates/conversation.js'
import { Session } from '../src/aggregates/session.js'
import { WorkflowExecution } from '../src/aggregates/workflow-execution.js'
import { WorkflowTask } from '../src/entities/workflow-task.js'
import { DomainError } from '../src/errors/domain-error.js'
import {
  createConversationId,
  createSessionId,
} from '../src/value-objects/ids.js'

describe('Conversation aggregate', () => {
  it('appends messages in order', () => {
    const base = Conversation.create(createConversationId('c1'), createSessionId('s1'), new Date('2025-01-01T00:00:00Z'))

    const withMessage = base.appendMessage({
      role: 'user',
      content: 'hi',
      timestamp: new Date('2025-01-01T00:00:01Z'),
    })

    expect(withMessage.messageCount()).toBe(1)
  })

  it('rejects out-of-order timestamps', () => {
    const base = Conversation.create(createConversationId('c1'), createSessionId('s1')).appendMessage({
      role: 'user',
      content: 'first',
      timestamp: new Date('2025-01-02T00:00:00Z'),
    })

    expect(() =>
      base.appendMessage({
        role: 'assistant',
        content: 'late',
        timestamp: new Date('2025-01-01T00:00:00Z'),
      }),
    ).toThrow(DomainError)
  })
})

describe('Session aggregate', () => {
  it('links conversations uniquely', () => {
    const session = Session.create(createSessionId('s1'))
    const conv = createConversationId('c1')

    const linked = session.linkConversation(conv)
    expect(linked.conversationIds).toHaveLength(1)

    expect(() => linked.linkConversation(conv)).toThrow(DomainError)
  })
})

describe('WorkflowExecution aggregate', () => {
  it('transitions through running to completed', () => {
    const task = WorkflowTask.createPending(createTaskId('t1'), 'chat')
    const workflow = WorkflowExecution.start({
      workflowId: createWorkflowId('wf-1'),
      conversationId: createConversationId('c1'),
      task,
    })

    const running = workflow.markRunning()
    expect(running.status).toBe('running')

    const completed = running.completeTask(createTaskId('t1'), true)
    expect(completed.status).toBe('completed')
  })

  it('fails workflow when task fails', () => {
    const task = WorkflowTask.createPending(createTaskId('t1'), 'chat')
    const workflow = WorkflowExecution.start({
      workflowId: createWorkflowId('wf-2'),
      conversationId: createConversationId('c1'),
      task,
    })

    const failed = workflow.markRunning().completeTask(createTaskId('t1'), false, 'boom')
    expect(failed.status).toBe('failed')
  })

  it('rejects invalid priority', () => {
    const task = WorkflowTask.createPending(createTaskId('t0'), 'chat')
    expect(() =>
      WorkflowExecution.start({
        workflowId: createWorkflowId('wf-bad'),
        conversationId: createConversationId('c1'),
        task,
        priority: 200,
      }),
    ).toThrow(DomainError)
  })

  it('cannot cancel terminal workflow', () => {
    const task = WorkflowTask.createPending(createTaskId('t1'), 'chat')
    const workflow = WorkflowExecution.start({
      workflowId: createWorkflowId('wf-3'),
      conversationId: createConversationId('c1'),
      task,
    }).markRunning()
      .completeTask(createTaskId('t1'), true)

    expect(() => workflow.cancel()).toThrow(DomainError)
  })
})
