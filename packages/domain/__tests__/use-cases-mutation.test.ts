import { createTaskId, createWorkflowId } from '@chatbot/contracts'
import { describe, expect, it } from 'vitest'

import { WorkflowExecution } from '../src/aggregates/workflow-execution.js'
import { WorkflowTask } from '../src/entities/workflow-task.js'
import { DomainError } from '../src/errors/domain-error.js'
import { InMemoryConversationRepository } from '../src/adapters/in-memory/in-memory-conversation-repository.js'
import { InMemorySessionRepository } from '../src/adapters/in-memory/in-memory-session-repository.js'
import { InMemoryWorkflowRepository } from '../src/adapters/in-memory/in-memory-workflow-repository.js'
import { AppendMessageUseCase } from '../src/use-cases/append-message.use-case.js'
import { CancelWorkflowUseCase } from '../src/use-cases/cancel-workflow.use-case.js'
import { CompleteWorkflowTaskUseCase } from '../src/use-cases/complete-workflow-task.use-case.js'
import { CreateConversationUseCase } from '../src/use-cases/create-conversation.use-case.js'
import { CreateSessionUseCase } from '../src/use-cases/create-session.use-case.js'
import { StartWorkflowUseCase } from '../src/use-cases/start-workflow.use-case.js'
import { createConversationId } from '../src/value-objects/ids.js'

describe('use-cases mutation hardening', () => {
  it('AppendMessageUseCase returns detailed not-found error', async () => {
    const useCase = new AppendMessageUseCase(new InMemoryConversationRepository())

    await expect(
      useCase.execute({
        conversationId: 'missing-conversation',
        role: 'user',
        content: 'hello',
        requestId: 'req-m1',
      }),
    ).rejects.toMatchObject<DomainError>({
      code: 'NOT_FOUND',
      message: 'Conversation not found',
      details: { conversationId: 'missing-conversation' },
    })
  })

  it('AppendMessageUseCase preserves optional metadata fields', async () => {
    const sessions = new InMemorySessionRepository()
    const conversations = new InMemoryConversationRepository()

    const session = await new CreateSessionUseCase(sessions).execute({ requestId: 'req-m2' })
    const conversation = await new CreateConversationUseCase(sessions, conversations).execute({
      sessionId: session.sessionId,
      requestId: 'req-m3',
    })

    await new AppendMessageUseCase(conversations).execute({
      conversationId: conversation.conversationId,
      role: 'assistant',
      content: 'first',
      requestId: 'req-m4',
      agentId: 'agent-1',
    })
    await new AppendMessageUseCase(conversations).execute({
      conversationId: conversation.conversationId,
      role: 'tool',
      content: 'second',
      requestId: 'req-m5',
      toolName: 'web_search',
    })

    const saved = await conversations.findById(createConversationId(conversation.conversationId))
    expect(saved).not.toBeNull()
    const first = saved?.messages[0]
    const second = saved?.messages[1]

    expect(first?.agentId).toBe('agent-1')
    expect(first?.toolName).toBeUndefined()
    expect(second?.agentId).toBeUndefined()
    expect(second?.toolName).toBe('web_search')
  })

  it('CreateSessionUseCase handles optional output fields deterministically', async () => {
    const sessions = new InMemorySessionRepository()
    const useCase = new CreateSessionUseCase(sessions)

    const minimal = await useCase.execute({ requestId: 'req-m6' })
    expect(minimal).not.toHaveProperty('userId')
    expect(minimal).not.toHaveProperty('channel')

    const full = await useCase.execute({
      requestId: 'req-m7',
      userId: 'user-99',
      channel: 'api',
    })
    expect(full.userId).toBe('user-99')
    expect(full.channel).toBe('api')
  })

  it('CreateConversationUseCase returns detailed not-found error', async () => {
    const sessions = new InMemorySessionRepository()
    const conversations = new InMemoryConversationRepository()
    const useCase = new CreateConversationUseCase(sessions, conversations)

    await expect(
      useCase.execute({
        sessionId: 'missing-session',
        requestId: 'req-m8',
      }),
    ).rejects.toMatchObject<DomainError>({
      code: 'NOT_FOUND',
      message: 'Session not found',
      details: { sessionId: 'missing-session' },
    })
  })

  it('StartWorkflowUseCase validates duplicate and missing resources with details', async () => {
    const sessions = new InMemorySessionRepository()
    const conversations = new InMemoryConversationRepository()
    const workflows = new InMemoryWorkflowRepository()

    const session = await new CreateSessionUseCase(sessions).execute({ requestId: 'req-m9' })
    const conversation = await new CreateConversationUseCase(sessions, conversations).execute({
      sessionId: session.sessionId,
      requestId: 'req-m10',
    })

    const start = new StartWorkflowUseCase(conversations, workflows)
    const payload = {
      workflowId: 'wf-mutation-1',
      conversationId: conversation.conversationId,
      taskId: 'task-mutation-1',
      taskType: 'chat',
      requestId: 'req-m11',
    }

    await start.execute(payload)
    await expect(start.execute(payload)).rejects.toMatchObject<DomainError>({
      code: 'CONFLICT',
      message: 'Workflow already exists',
      details: { workflowId: 'wf-mutation-1' },
    })

    await expect(
      start.execute({
        workflowId: 'wf-mutation-2',
        conversationId: 'missing-conversation',
        taskId: 'task-mutation-2',
        taskType: 'chat',
        requestId: 'req-m12',
      }),
    ).rejects.toMatchObject<DomainError>({
      code: 'NOT_FOUND',
      message: 'Conversation not found',
      details: { conversationId: 'missing-conversation' },
    })
  })

  it('StartWorkflowUseCase preserves optional priority semantics', async () => {
    const sessions = new InMemorySessionRepository()
    const conversations = new InMemoryConversationRepository()
    const workflows = new InMemoryWorkflowRepository()

    const session = await new CreateSessionUseCase(sessions).execute({ requestId: 'req-m13' })
    const conversation = await new CreateConversationUseCase(sessions, conversations).execute({
      sessionId: session.sessionId,
      requestId: 'req-m14',
    })

    const start = new StartWorkflowUseCase(conversations, workflows)
    await start.execute({
      workflowId: 'wf-mutation-priority-1',
      conversationId: conversation.conversationId,
      taskId: 'task-mutation-priority-1',
      taskType: 'chat',
      requestId: 'req-m15',
    })
    await start.execute({
      workflowId: 'wf-mutation-priority-2',
      conversationId: conversation.conversationId,
      taskId: 'task-mutation-priority-2',
      taskType: 'chat',
      requestId: 'req-m16',
      priority: 7,
    })

    const defaultPriority = await workflows.findById(createWorkflowId('wf-mutation-priority-1'))
    const explicitPriority = await workflows.findById(createWorkflowId('wf-mutation-priority-2'))

    expect(defaultPriority?.priority).toBe(0)
    expect(explicitPriority?.priority).toBe(7)
  })

  it('CancelWorkflowUseCase returns detailed not-found error', async () => {
    const useCase = new CancelWorkflowUseCase(new InMemoryWorkflowRepository())

    await expect(
      useCase.execute({
        workflowId: 'wf-missing-cancel',
        requestId: 'req-m17',
      }),
    ).rejects.toMatchObject<DomainError>({
      code: 'NOT_FOUND',
      message: 'Workflow not found',
      details: { workflowId: 'wf-missing-cancel' },
    })
  })

  it('CompleteWorkflowTaskUseCase returns detailed not-found error', async () => {
    const useCase = new CompleteWorkflowTaskUseCase(new InMemoryWorkflowRepository())

    await expect(
      useCase.execute({
        workflowId: 'wf-missing-complete',
        taskId: 'task-missing-complete',
        requestId: 'req-m18',
        success: true,
      }),
    ).rejects.toMatchObject<DomainError>({
      code: 'NOT_FOUND',
      message: 'Workflow not found',
      details: { workflowId: 'wf-missing-complete' },
    })
  })

  it('CompleteWorkflowTaskUseCase does not re-run running workflows', async () => {
    const workflows = new InMemoryWorkflowRepository()
    const task = WorkflowTask.createPending(createTaskId('task-running-path'), 'chat')
    const workflow = WorkflowExecution.start({
      workflowId: createWorkflowId('wf-running-path'),
      conversationId: createConversationId('conv-running-path'),
      task,
    }).markRunning()

    await workflows.save(workflow)

    const output = await new CompleteWorkflowTaskUseCase(workflows).execute({
      workflowId: workflow.workflowId,
      taskId: task.taskId,
      requestId: 'req-m19',
      success: true,
    })

    expect(output.status).toBe('completed')
  })
})
