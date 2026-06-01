import type { StartWorkflowInput, StartWorkflowOutput } from '@chatbot/contracts'

import { WorkflowExecution } from '../aggregates/workflow-execution.js'
import { WorkflowTask } from '../entities/workflow-task.js'
import { DomainError } from '../errors/domain-error.js'
import type { ConversationRepository } from '../repositories/conversation-repository.js'
import type { WorkflowRepository } from '../repositories/workflow-repository.js'
import {
  createConversationId,
  createRequestId,
  createTaskId,
  createWorkflowId,
} from '../value-objects/ids.js'

export class StartWorkflowUseCase {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly workflows: WorkflowRepository,
  ) {}

  async execute(input: StartWorkflowInput): Promise<StartWorkflowOutput> {
    createRequestId(input.requestId)

    const workflowId = createWorkflowId(input.workflowId)
    const conversationId = createConversationId(input.conversationId)
    const taskId = createTaskId(input.taskId)

    const existingWorkflow = await this.workflows.findById(workflowId)
    if (existingWorkflow !== null) {
      throw new DomainError('CONFLICT', 'Workflow already exists', { workflowId })
    }

    const conversation = await this.conversations.findById(conversationId)
    if (conversation === null) {
      throw new DomainError('NOT_FOUND', 'Conversation not found', { conversationId })
    }

    const task = WorkflowTask.createPending(taskId, input.taskType)
    const workflow = WorkflowExecution.start({
      workflowId,
      conversationId,
      task,
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
    })

    await this.workflows.save(workflow)

    return {
      workflowId: workflow.workflowId,
      conversationId: workflow.conversationId,
      status: workflow.status,
      createdAt: workflow.createdAt.toISOString(),
    }
  }
}
