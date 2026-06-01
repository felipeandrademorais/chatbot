import { describe, expect, it } from 'vitest'

import { InMemoryConversationRepository } from '../src/adapters/in-memory/in-memory-conversation-repository.js'
import { InMemorySessionRepository } from '../src/adapters/in-memory/in-memory-session-repository.js'
import { InMemoryWorkflowRepository } from '../src/adapters/in-memory/in-memory-workflow-repository.js'
import { DomainError } from '../src/errors/domain-error.js'
import { AppendMessageUseCase } from '../src/use-cases/append-message.use-case.js'
import { CancelWorkflowUseCase } from '../src/use-cases/cancel-workflow.use-case.js'
import { CompleteWorkflowTaskUseCase } from '../src/use-cases/complete-workflow-task.use-case.js'
import { CreateConversationUseCase } from '../src/use-cases/create-conversation.use-case.js'
import { CreateSessionUseCase } from '../src/use-cases/create-session.use-case.js'
import { StartWorkflowUseCase } from '../src/use-cases/start-workflow.use-case.js'

describe('domain use cases', () => {
  it('creates session, conversation, message, and workflow lifecycle', async () => {
    const sessions = new InMemorySessionRepository()
    const conversations = new InMemoryConversationRepository()
    const workflows = new InMemoryWorkflowRepository()

    const sessionOutput = await new CreateSessionUseCase(sessions).execute({
      requestId: 'req-1',
      userId: 'user-1',
      channel: 'web',
    })

    const conversationOutput = await new CreateConversationUseCase(sessions, conversations).execute({
      sessionId: sessionOutput.sessionId,
      requestId: 'req-2',
    })

    const messageOutput = await new AppendMessageUseCase(conversations).execute({
      conversationId: conversationOutput.conversationId,
      role: 'user',
      content: 'Hello',
      requestId: 'req-3',
    })

    expect(messageOutput.messageIndex).toBe(0)

    const start = new StartWorkflowUseCase(conversations, workflows)
    const workflowOutput = await start.execute({
      workflowId: 'wf-100',
      conversationId: conversationOutput.conversationId,
      taskId: 'task-100',
      taskType: 'chat',
      requestId: 'req-4',
      priority: 1,
    })

    expect(workflowOutput.status).toBe('pending')

    const completed = await new CompleteWorkflowTaskUseCase(workflows).execute({
      workflowId: workflowOutput.workflowId,
      taskId: 'task-100',
      requestId: 'req-5',
      success: true,
    })

    expect(completed.status).toBe('completed')

    const secondWorkflow = await start.execute({
      workflowId: 'wf-200',
      conversationId: conversationOutput.conversationId,
      taskId: 'task-200',
      taskType: 'chat',
      requestId: 'req-6',
    })

    const cancelled = await new CancelWorkflowUseCase(workflows).execute({
      workflowId: secondWorkflow.workflowId,
      requestId: 'req-7',
      reason: 'user abort',
    })

    expect(cancelled.status).toBe('cancelled')
  })

  it('rejects duplicate workflow start', async () => {
    const sessions = new InMemorySessionRepository()
    const conversations = new InMemoryConversationRepository()
    const workflows = new InMemoryWorkflowRepository()

    const session = await new CreateSessionUseCase(sessions).execute({ requestId: 'req-a' })
    const conversation = await new CreateConversationUseCase(sessions, conversations).execute({
      sessionId: session.sessionId,
      requestId: 'req-b',
    })

    const start = new StartWorkflowUseCase(conversations, workflows)
    const payload = {
      workflowId: 'wf-dup',
      conversationId: conversation.conversationId,
      taskId: 'task-dup',
      taskType: 'chat',
      requestId: 'req-c',
    }

    await start.execute(payload)
    await expect(start.execute(payload)).rejects.toThrow(DomainError)
  })

  it('surfaces not-found errors', async () => {
    const conversations = new InMemoryConversationRepository()
    await expect(
      new AppendMessageUseCase(conversations).execute({
        conversationId: 'missing-conv',
        role: 'user',
        content: 'x',
        requestId: 'req-x',
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })
})
