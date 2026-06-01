/**
 * Workflow execution use-case DTO contracts.
 *
 * @module @chatbot/contracts/domain/workflow
 * @version 1.0.0
 * @since stage-03-core-domain
 */

import type { WorkflowStatus } from '../workflow.js'

/** Input for starting a workflow bound to a conversation. */
export interface StartWorkflowInput {
  readonly workflowId: string
  readonly conversationId: string
  readonly taskId: string
  readonly taskType: string
  readonly requestId: string
  readonly priority?: number
}

/** Output after a workflow is started. */
export interface StartWorkflowOutput {
  readonly workflowId: string
  readonly conversationId: string
  readonly status: WorkflowStatus
  readonly createdAt: string
}

/** Input for marking a workflow task complete. */
export interface CompleteWorkflowTaskInput {
  readonly workflowId: string
  readonly taskId: string
  readonly requestId: string
  readonly success: boolean
  readonly failureReason?: string
}

/** Output after a task completion is recorded. */
export interface CompleteWorkflowTaskOutput {
  readonly workflowId: string
  readonly status: WorkflowStatus
  readonly updatedAt: string
}

/** Input for cancelling a workflow. */
export interface CancelWorkflowInput {
  readonly workflowId: string
  readonly requestId: string
  readonly reason?: string
}

/** Output after a workflow is cancelled. */
export interface CancelWorkflowOutput {
  readonly workflowId: string
  readonly status: WorkflowStatus
  readonly updatedAt: string
}
