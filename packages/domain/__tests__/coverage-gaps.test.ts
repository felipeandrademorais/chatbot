import { createTaskId, createWorkflowId } from '@chatbot/contracts'
import { describe, expect, it } from 'vitest'

import {
  TERM_CONVERSATION,
  TERM_SESSION,
  TERM_WORKFLOW_EXECUTION,
} from '../src/glossary.js'
import { WorkflowExecution } from '../src/aggregates/workflow-execution.js'
import { Session } from '../src/aggregates/session.js'
import { WorkflowTask } from '../src/entities/workflow-task.js'
import { DomainError } from '../src/errors/domain-error.js'
import { InMemoryConversationRepository } from '../src/adapters/in-memory/in-memory-conversation-repository.js'
import { InMemorySessionRepository } from '../src/adapters/in-memory/in-memory-session-repository.js'
import { InMemoryWorkflowRepository } from '../src/adapters/in-memory/in-memory-workflow-repository.js'
import { assertValidMessageContent } from '../src/value-objects/message-content.js'
import { createConversationId, createSessionId, createUserId } from '../src/value-objects/ids.js'
import { CancelWorkflowUseCase } from '../src/use-cases/cancel-workflow.use-case.js'
import { CompleteWorkflowTaskUseCase } from '../src/use-cases/complete-workflow-task.use-case.js'
import { CreateConversationUseCase } from '../src/use-cases/create-conversation.use-case.js'
import { StartWorkflowUseCase } from '../src/use-cases/start-workflow.use-case.js'

describe('coverage gaps', () => {
  it('exports glossary terms', () => {
    expect(TERM_CONVERSATION).toBe('Conversation')
    expect(TERM_SESSION).toBe('Session')
    expect(TERM_WORKFLOW_EXECUTION).toBe('WorkflowExecution')
  })

  it('rejects oversized message content', () => {
    expect(() => assertValidMessageContent('x'.repeat(32_001))).toThrow(DomainError)
  })

  it('rejects empty session channel', () => {
    expect(() => Session.create(createSessionId('s-empty'), { channel: '   ' })).toThrow(DomainError)
  })

  it('rejects invalid workflow transition and blank cancel reason', () => {
    const task = WorkflowTask.createPending(createTaskId('t-x'), 'chat')
    const workflow = WorkflowExecution.start({
      workflowId: createWorkflowId('wf-x'),
      conversationId: createConversationId('c-x'),
      task,
    })

    const running = workflow.markRunning()
    const done = running.completeTask(createTaskId('t-x'), true)
    expect(() => done.completeTask(createTaskId('t-x'), true)).toThrow(DomainError)
    expect(() => workflow.cancel('   ')).toThrow(DomainError)
    expect(() =>
      workflow.completeTask(createTaskId('missing'), true),
    ).toThrow(DomainError)
  })

  it('clears in-memory repositories', async () => {
    const conversations = new InMemoryConversationRepository()
    const sessions = new InMemorySessionRepository()
    const workflows = new InMemoryWorkflowRepository()

    conversations.clear()
    sessions.clear()
    workflows.clear()

    expect(await conversations.findById(createConversationId('none'))).toBeNull()
  })

  it('covers use-case not-found and workflow-not-found branches', async () => {
    const sessions = new InMemorySessionRepository()
    const conversations = new InMemoryConversationRepository()
    const workflows = new InMemoryWorkflowRepository()

    await expect(
      new CreateConversationUseCase(sessions, conversations).execute({
        sessionId: 'missing-session',
        requestId: 'req-1',
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })

    await expect(
      new StartWorkflowUseCase(conversations, workflows).execute({
        workflowId: 'wf-missing-conv',
        conversationId: 'missing-conv',
        taskId: 'task-1',
        taskType: 'chat',
        requestId: 'req-2',
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })

    await expect(
      new CompleteWorkflowTaskUseCase(workflows).execute({
        workflowId: 'wf-none',
        taskId: 'task-none',
        requestId: 'req-3',
        success: true,
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })

    await expect(
      new CancelWorkflowUseCase(workflows).execute({
        workflowId: 'wf-none',
        requestId: 'req-4',
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('creates session with user id only', async () => {
    const sessions = new InMemorySessionRepository()
    const output = await import('../src/use-cases/create-session.use-case.js').then(
      ({ CreateSessionUseCase }) =>
        new CreateSessionUseCase(sessions).execute({
          requestId: 'req-user',
          userId: 'user-42',
        }),
    )
    expect(output.userId).toBe('user-42')
  })
})
