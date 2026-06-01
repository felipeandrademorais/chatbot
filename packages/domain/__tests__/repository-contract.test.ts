import { createTaskId, createWorkflowId } from '@chatbot/contracts'
import { describe, expect, it } from 'vitest'

import { Conversation } from '../src/aggregates/conversation.js'
import { Session } from '../src/aggregates/session.js'
import { WorkflowExecution } from '../src/aggregates/workflow-execution.js'
import { WorkflowTask } from '../src/entities/workflow-task.js'
import { InMemoryConversationRepository } from '../src/adapters/in-memory/in-memory-conversation-repository.js'
import { InMemorySessionRepository } from '../src/adapters/in-memory/in-memory-session-repository.js'
import { InMemoryWorkflowRepository } from '../src/adapters/in-memory/in-memory-workflow-repository.js'
import type { ConversationRepository } from '../src/repositories/conversation-repository.js'
import type { SessionRepository } from '../src/repositories/session-repository.js'
import type { WorkflowRepository } from '../src/repositories/workflow-repository.js'
import { createConversationId, createSessionId } from '../src/value-objects/ids.js'

function exerciseConversationRepo(repo: ConversationRepository): Promise<void> {
  const id = createConversationId('conv-contract')
  const sessionId = createSessionId('sess-contract')
  const conversation = Conversation.create(id, sessionId)

  return repo.save(conversation).then(async () => {
    const found = await repo.findById(id)
    expect(found?.id).toBe(id)
    expect(await repo.findById(createConversationId('missing'))).toBeNull()
  })
}

function exerciseSessionRepo(repo: SessionRepository): Promise<void> {
  const id = createSessionId('sess-contract')
  const session = Session.create(id)

  return repo.save(session).then(async () => {
    const found = await repo.findById(id)
    expect(found?.id).toBe(id)
  })
}

function exerciseWorkflowRepo(repo: WorkflowRepository): Promise<void> {
  const workflowId = createWorkflowId('wf-contract')
  const conversationId = createConversationId('conv-wf')
  const task = WorkflowTask.createPending(createTaskId('task-contract'), 'chat')
  const workflow = WorkflowExecution.start({ workflowId, conversationId, task })

  return repo.save(workflow).then(async () => {
    const found = await repo.findById(workflowId)
    expect(found?.workflowId).toBe(workflowId)
  })
}

describe('repository contract (in-memory adapters)', () => {
  it('ConversationRepository contract', async () => {
    const repo = new InMemoryConversationRepository()
    await exerciseConversationRepo(repo)
  })

  it('SessionRepository contract', async () => {
    const repo = new InMemorySessionRepository()
    await exerciseSessionRepo(repo)
  })

  it('WorkflowRepository contract', async () => {
    const repo = new InMemoryWorkflowRepository()
    await exerciseWorkflowRepo(repo)
  })
})
