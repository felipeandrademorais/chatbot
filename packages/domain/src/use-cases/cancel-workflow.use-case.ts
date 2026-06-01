import type { CancelWorkflowInput, CancelWorkflowOutput } from '@chatbot/contracts'

import { DomainError } from '../errors/domain-error.js'
import type { WorkflowRepository } from '../repositories/workflow-repository.js'
import { createRequestId, createWorkflowId } from '../value-objects/ids.js'

export class CancelWorkflowUseCase {
  constructor(private readonly workflows: WorkflowRepository) {}

  async execute(input: CancelWorkflowInput): Promise<CancelWorkflowOutput> {
    createRequestId(input.requestId)

    const workflowId = createWorkflowId(input.workflowId)
    const workflow = await this.workflows.findById(workflowId)
    if (workflow === null) {
      throw new DomainError('NOT_FOUND', 'Workflow not found', { workflowId })
    }

    const cancelled = workflow.cancel(input.reason)
    await this.workflows.save(cancelled)

    return {
      workflowId: cancelled.workflowId,
      status: cancelled.status,
      updatedAt: cancelled.updatedAt.toISOString(),
    }
  }
}
