/**
 * Workflow Contract
 *
 * Defines types for workflow execution, routing, and job management.
 *
 * @module @chatbot/contracts/workflow
 * @version 1.0.0
 */

/**
 * Branded type for workflow identifiers.
 */
export type WorkflowId = string & { readonly __brand: 'WorkflowId' }

/**
 * Branded type for task identifiers.
 */
export type TaskId = string & { readonly __brand: 'TaskId' }

/**
 * Helper to create a branded WorkflowId.
 */
export function createWorkflowId(id: string): WorkflowId {
  if (id.trim().length === 0) {
    throw new Error('Workflow ID must not be empty')
  }
  return id as WorkflowId
}

/**
 * Helper to create a branded TaskId.
 */
export function createTaskId(id: string): TaskId {
  if (id.trim().length === 0) {
    throw new Error('Task ID must not be empty')
  }
  return id as TaskId
}

/**
 * Status of a workflow execution.
 */
export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

/**
 * Routing table entry mapping task types to agent identifiers.
 */
export interface RoutingEntry {
  readonly taskType: string
  readonly agentId: string
  readonly priority?: number
}

/**
 * Configuration for the routing table used by the orchestrator.
 */
export interface RoutingTable {
  readonly entries: readonly RoutingEntry[]
  readonly fallbackAgentId: string
}

/**
 * A job submitted to the queue for processing.
 */
export interface WorkflowJob {
  readonly workflowId: WorkflowId
  readonly taskId: TaskId
  readonly taskType: string
  readonly payload: unknown
  readonly createdAt: Date
  readonly priority: number
}
