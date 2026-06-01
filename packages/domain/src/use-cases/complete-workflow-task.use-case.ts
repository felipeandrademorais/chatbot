import type { CompleteWorkflowTaskInput, CompleteWorkflowTaskOutput } from '@chatbot/contracts'

import { DomainError } from '../errors/domain-error.js'
import type { WorkflowRepository } from '../repositories/workflow-repository.js'
import { createRequestId, createTaskId, createWorkflowId } from '../value-objects/ids.js'

export class CompleteWorkflowTaskUseCase {
  constructor(private readonly workflows: WorkflowRepository) {}

  async execute(input: CompleteWorkflowTaskInput): Promise<CompleteWorkflowTaskOutput> {
    createRequestId(input.requestId)

    const workflowId = createWorkflowId(input.workflowId)
    const taskId = createTaskId(input.taskId)

    const workflow = await this.workflows.findById(workflowId)
    if (workflow === null) {
      throw new DomainError('NOT_FOUND', 'Workflow not found', { workflowId })
    }

    const running = workflow.status === 'pending' ? workflow.markRunning() : workflow
    const updated = running.completeTask(taskId, input.success, input.failureReason)

    await this.workflows.save(updated)

    return {
      workflowId: updated.workflowId,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    }
  }
}
