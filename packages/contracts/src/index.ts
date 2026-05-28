/**
 * @chatbot/contracts
 *
 * Shared API schemas, event schemas, and DTO definitions.
 * This package is the single source of truth for all inter-module contracts.
 *
 * All modules must import types from this package rather than
 * defining their own copies.
 *
 * @module @chatbot/contracts
 * @version 1.0.0
 */

// Message contracts
export type { Message, MessageMetadata, MessageRole, RetrievedDocument } from './message.js'

// Tool contracts
export type { Tool, ToolExecutionResult, ToolName } from './tool.js'
export { createToolName } from './tool.js'

// Agent contracts
export type {
  Agent,
  AgentContext,
  AgentError,
  AgentInput,
  AgentMetadata,
  AgentNextAction,
  AgentResult,
  AgentUsage,
} from './agent.js'

// Workflow contracts
export type {
  RoutingEntry,
  RoutingTable,
  TaskId,
  WorkflowId,
  WorkflowJob,
  WorkflowStatus,
} from './workflow.js'
export { createTaskId, createWorkflowId } from './workflow.js'
