import type { WorkflowId } from '@chatbot/contracts'

import type { WorkflowExecution } from '../aggregates/workflow-execution.js'

export interface WorkflowRepository {
  save(workflow: WorkflowExecution): Promise<void>
  findById(workflowId: WorkflowId): Promise<WorkflowExecution | null>
}
