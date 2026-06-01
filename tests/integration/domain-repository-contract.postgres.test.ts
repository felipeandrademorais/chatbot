import { createTaskId, createWorkflowId, type WorkflowStatus } from '@chatbot/contracts'
import { Client } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { Conversation } from '../../packages/domain/src/aggregates/conversation.js'
import { Session } from '../../packages/domain/src/aggregates/session.js'
import { WorkflowExecution } from '../../packages/domain/src/aggregates/workflow-execution.js'
import { WorkflowTask } from '../../packages/domain/src/entities/workflow-task.js'
import type { ConversationRepository } from '../../packages/domain/src/repositories/conversation-repository.js'
import type { SessionRepository } from '../../packages/domain/src/repositories/session-repository.js'
import type { WorkflowRepository } from '../../packages/domain/src/repositories/workflow-repository.js'
import {
  createConversationId,
  createSessionId,
  createUserId,
} from '../../packages/domain/src/value-objects/ids.js'

const postgresHost = process.env.POSTGRES_HOST ?? 'localhost'
const postgresPort = Number(process.env.POSTGRES_PORT ?? '5433')
const postgresUser = process.env.POSTGRES_USER ?? 'chatbot'
const postgresPassword = process.env.POSTGRES_PASSWORD ?? 'ci-test-password'
const postgresDb = process.env.POSTGRES_DB ?? 'chatbot'

const SNAPSHOT_TABLE = 'domain_repo_contract_snapshots'

function createClient(): Client {
  return new Client({
    host: postgresHost,
    port: postgresPort,
    user: postgresUser,
    password: postgresPassword,
    database: postgresDb,
    connectionTimeoutMillis: 3_000,
  })
}

async function postgresReachable(): Promise<boolean> {
  try {
    const client = createClient()
    await client.connect()
    await client.end()
    return true
  } catch {
    return false
  }
}

const stackAvailable = await postgresReachable()

type SnapshotRow = { payload: unknown }

class PostgresSessionRepository implements SessionRepository {
  constructor(private readonly client: Client) {}

  async save(session: Session): Promise<void> {
    const payload = {
      id: session.id,
      userId: session.userId,
      channel: session.channel,
      conversationIds: session.conversationIds,
      createdAt: session.createdAt.toISOString(),
    }

    await this.client.query(
      `INSERT INTO ${SNAPSHOT_TABLE} (repository_type, entity_id, payload)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (repository_type, entity_id)
       DO UPDATE SET payload = EXCLUDED.payload`,
      ['session', session.id, JSON.stringify(payload)],
    )
  }

  async findById(id: ReturnType<typeof createSessionId>): Promise<Session | null> {
    const result = await this.client.query<SnapshotRow>(
      `SELECT payload FROM ${SNAPSHOT_TABLE} WHERE repository_type = $1 AND entity_id = $2`,
      ['session', id],
    )

    const row = result.rows[0]
    if (row === undefined) {
      return null
    }

    const payload = row.payload as {
      id: string
      userId?: string
      channel?: string
      conversationIds: string[]
      createdAt: string
    }
    let session = Session.create(createSessionId(payload.id), {
      ...(payload.userId !== undefined ? { userId: createUserId(payload.userId) } : {}),
      ...(payload.channel !== undefined ? { channel: payload.channel } : {}),
      now: new Date(payload.createdAt),
    })

    for (const conversationId of payload.conversationIds) {
      session = session.linkConversation(createConversationId(conversationId))
    }

    return session
  }
}

class PostgresConversationRepository implements ConversationRepository {
  constructor(private readonly client: Client) {}

  async save(conversation: Conversation): Promise<void> {
    const payload = {
      id: conversation.id,
      sessionId: conversation.sessionId,
      messages: conversation.messages.map((message) => ({
        role: message.role,
        content: message.content,
        timestamp: message.timestamp.toISOString(),
        ...(message.agentId !== undefined ? { agentId: message.agentId } : {}),
        ...(message.toolName !== undefined ? { toolName: message.toolName } : {}),
      })),
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    }

    await this.client.query(
      `INSERT INTO ${SNAPSHOT_TABLE} (repository_type, entity_id, payload)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (repository_type, entity_id)
       DO UPDATE SET payload = EXCLUDED.payload`,
      ['conversation', conversation.id, JSON.stringify(payload)],
    )
  }

  async findById(id: ReturnType<typeof createConversationId>): Promise<Conversation | null> {
    const result = await this.client.query<SnapshotRow>(
      `SELECT payload FROM ${SNAPSHOT_TABLE} WHERE repository_type = $1 AND entity_id = $2`,
      ['conversation', id],
    )

    const row = result.rows[0]
    if (row === undefined) {
      return null
    }

    const payload = row.payload as {
      id: string
      sessionId: string
      createdAt: string
      messages: Array<{
        role: 'user' | 'assistant' | 'system' | 'tool'
        content: string
        timestamp: string
        agentId?: string
        toolName?: string
      }>
    }
    let conversation = Conversation.create(
      createConversationId(payload.id),
      createSessionId(payload.sessionId),
      new Date(payload.createdAt),
    )

    for (const message of payload.messages) {
      conversation = conversation.appendMessage({
        role: message.role,
        content: message.content,
        timestamp: new Date(message.timestamp),
        ...(message.agentId !== undefined ? { agentId: message.agentId } : {}),
        ...(message.toolName !== undefined ? { toolName: message.toolName } : {}),
      })
    }

    return conversation
  }
}

class PostgresWorkflowRepository implements WorkflowRepository {
  constructor(private readonly client: Client) {}

  async save(workflow: WorkflowExecution): Promise<void> {
    const payload = {
      workflowId: workflow.workflowId,
      conversationId: workflow.conversationId,
      status: workflow.status,
      priority: workflow.priority,
      tasks: workflow.tasks.map((task) => ({
        taskId: task.taskId,
        taskType: task.taskType,
        status: task.status,
        ...(task.failureReason !== undefined ? { failureReason: task.failureReason } : {}),
      })),
      createdAt: workflow.createdAt.toISOString(),
      updatedAt: workflow.updatedAt.toISOString(),
    }

    await this.client.query(
      `INSERT INTO ${SNAPSHOT_TABLE} (repository_type, entity_id, payload)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (repository_type, entity_id)
       DO UPDATE SET payload = EXCLUDED.payload`,
      ['workflow', workflow.workflowId, JSON.stringify(payload)],
    )
  }

  async findById(workflowId: string): Promise<WorkflowExecution | null> {
    const result = await this.client.query<SnapshotRow>(
      `SELECT payload FROM ${SNAPSHOT_TABLE} WHERE repository_type = $1 AND entity_id = $2`,
      ['workflow', workflowId],
    )

    const row = result.rows[0]
    if (row === undefined) {
      return null
    }

    const payload = row.payload as {
      workflowId: string
      conversationId: string
      status: WorkflowStatus
      priority: number
      tasks: Array<{
        taskId: string
        taskType: string
        status: 'pending' | 'running' | 'completed' | 'failed'
        failureReason?: string
      }>
      createdAt: string
      updatedAt: string
    }
    const firstTask = payload.tasks[0]
    if (firstTask === undefined) {
      return null
    }

    let task = WorkflowTask.createPending(createTaskId(firstTask.taskId), firstTask.taskType)
    if (firstTask.status === 'running') {
      task = task.markRunning()
    }
    if (firstTask.status === 'completed') {
      task = task.markRunning().markCompleted(true)
    }
    if (firstTask.status === 'failed') {
      task = task.markRunning().markCompleted(false, firstTask.failureReason)
    }

    let workflow = WorkflowExecution.start({
      workflowId: createWorkflowId(payload.workflowId),
      conversationId: createConversationId(payload.conversationId),
      task,
      priority: payload.priority,
      now: new Date(payload.createdAt),
    })

    if (payload.status === 'running') {
      workflow = workflow.markRunning(new Date(payload.updatedAt))
    }
    if (payload.status === 'completed') {
      workflow = workflow
        .markRunning(new Date(payload.createdAt))
        .completeTask(createTaskId(firstTask.taskId), true, undefined, new Date(payload.updatedAt))
    }
    if (payload.status === 'failed') {
      workflow = workflow
        .markRunning(new Date(payload.createdAt))
        .completeTask(
          createTaskId(firstTask.taskId),
          false,
          firstTask.failureReason,
          new Date(payload.updatedAt),
        )
    }
    if (payload.status === 'cancelled') {
      workflow = workflow.cancel(undefined, new Date(payload.updatedAt))
    }

    return workflow
  }
}

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

describe.skipIf(!stackAvailable)('repository contract (postgres adapters)', () => {
  const client = createClient()

  beforeAll(async () => {
    await client.connect()
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${SNAPSHOT_TABLE} (
        repository_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        payload JSONB NOT NULL,
        PRIMARY KEY (repository_type, entity_id)
      )
    `)
    await client.query(`DELETE FROM ${SNAPSHOT_TABLE}`)
  })

  afterAll(async () => {
    await client.query(`DELETE FROM ${SNAPSHOT_TABLE}`)
    await client.end()
  })

  it('ConversationRepository contract', async () => {
    await exerciseConversationRepo(new PostgresConversationRepository(client))
  })

  it('SessionRepository contract', async () => {
    await exerciseSessionRepo(new PostgresSessionRepository(client))
  })

  it('WorkflowRepository contract', async () => {
    await exerciseWorkflowRepo(new PostgresWorkflowRepository(client))
  })
})
