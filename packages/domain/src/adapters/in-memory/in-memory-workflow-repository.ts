import type { WorkflowId } from '@chatbot/contracts'

import type { WorkflowExecution } from '../../aggregates/workflow-execution.js'
import type { WorkflowRepository } from '../../repositories/workflow-repository.js'

export class InMemoryWorkflowRepository implements WorkflowRepository {
  private readonly store = new Map<string, WorkflowExecution>()

  save(workflow: WorkflowExecution): Promise<void> {
    this.store.set(workflow.workflowId, workflow)
    return Promise.resolve()
  }

  findById(workflowId: WorkflowId): Promise<WorkflowExecution | null> {
    return Promise.resolve(this.store.get(workflowId) ?? null)
  }

  clear(): void {
    this.store.clear()
  }
}
