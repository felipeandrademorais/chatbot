/**
 * Agent Contract
 *
 * Defines the core agent communication interfaces:
 * AgentInput (execution context), AgentResult (standardized output),
 * and the Agent interface.
 *
 * These contracts are the primary communication layer between
 * the Orchestrator and Agent Workers. They must remain stable and versioned.
 *
 * @module @chatbot/contracts/agent
 * @version 1.0.0
 */

import type { Message, RetrievedDocument } from './message.js'
import type { ToolExecutionResult, ToolName } from './tool.js'

/**
 * Execution context passed from the Orchestrator into an Agent.
 */
export interface AgentInput {
  /** Unique identifier for the workflow execution */
  readonly workflowId: string

  /** Unique identifier for this specific task */
  readonly taskId: string

  /** The original user message to process */
  readonly userMessage: string

  /** Conversation history for context continuity */
  readonly conversationHistory: readonly Message[]

  /** Additional context from previous steps */
  readonly context: AgentContext

  /** Request and session metadata */
  readonly metadata: AgentMetadata
}

/**
 * Contextual information from previous workflow steps.
 */
export interface AgentContext {
  readonly summaries?: readonly string[]
  readonly retrievedDocuments?: readonly RetrievedDocument[]
  readonly previousAgentResults?: readonly AgentResult[]
}

/**
 * Metadata associated with a request.
 */
export interface AgentMetadata {
  readonly userId?: string
  readonly channel?: string
  readonly requestId: string
}

/**
 * Standardized output returned by an Agent after execution.
 */
export interface AgentResult {
  /** Whether the agent completed successfully */
  readonly success: boolean

  /** Human-readable output text */
  readonly output: string

  /** Optional structured data output */
  readonly structuredOutput?: unknown

  /** Results from tool executions during this agent run */
  readonly toolResults?: readonly ToolExecutionResult[]

  /** Token usage and cost tracking */
  readonly usage?: AgentUsage

  /** Directive for workflow continuation */
  readonly nextActions?: AgentNextAction

  /** Error details if the agent failed */
  readonly error?: AgentError
}

/**
 * Token usage and cost tracking for an agent execution.
 */
export interface AgentUsage {
  readonly inputTokens: number
  readonly outputTokens: number
  readonly estimatedCostUsd: number
}

/**
 * Directive indicating what should happen after an agent completes.
 */
export interface AgentNextAction {
  readonly type: 'continue' | 'complete' | 'handoff'
  readonly targetAgent?: string
}

/**
 * Error information from a failed agent execution.
 */
export interface AgentError {
  readonly message: string
  readonly retryable: boolean
}

/**
 * The core Agent interface that all agent implementations must satisfy.
 */
export interface Agent {
  /** Unique identifier for this agent */
  readonly id: string

  /** The role this agent fulfills */
  readonly role: string

  /** Tools this agent is permitted to use */
  readonly allowedTools: readonly ToolName[]

  /** Execute a task with the given input context */
  execute(input: AgentInput): Promise<AgentResult>
}
