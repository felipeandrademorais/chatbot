/**
 * Tool Contract
 *
 * Defines the interface for tool execution within the agent system.
 * Tools are capabilities that agents can invoke (file read, web search, etc.).
 *
 * @module @chatbot/contracts/tool
 * @version 1.0.0
 */

/**
 * Registered tool name. Must be a non-empty string identifier.
 * Used in agent allowlists to control tool access.
 */
export type ToolName = string & { readonly __brand: 'ToolName' }

/**
 * Helper to create a branded ToolName from a plain string.
 */
export function createToolName(name: string): ToolName {
  if (name.trim().length === 0) {
    throw new Error('Tool name must not be empty')
  }
  return name as ToolName
}

/**
 * The result of executing a tool.
 */
export interface ToolExecutionResult {
  readonly toolName: ToolName
  readonly success: boolean
  readonly output: unknown
  readonly error?: string
  readonly durationMs: number
}

export type StructuredToolInputValue =
  | string
  | number
  | boolean
  | null
  | readonly StructuredToolInputValue[]
  | StructuredToolInput

export interface StructuredToolInput {
  readonly [key: string]: StructuredToolInputValue
}

export interface ToolInvocationRequest {
  readonly requestId: string
  readonly toolName: ToolName
  readonly input: StructuredToolInput
}

export interface ToolInvocationResponse {
  readonly requestId: string
  readonly result: ToolExecutionResult
}

/**
 * Interface that all tools must implement.
 *
 * Tools receive typed input and return a promise of output.
 * Each tool declares its name for allowlist matching.
 */
export interface Tool {
  readonly name: ToolName

  execute(input: unknown): Promise<unknown>
}

export function validateToolInvocationRequest(value: unknown): value is ToolInvocationRequest {
  if (!isRecord(value)) {
    return false
  }

  const requestId = value.requestId
  const toolName = value.toolName
  const input = value.input

  return (
    typeof requestId === 'string' &&
    requestId.trim().length > 0 &&
    typeof toolName === 'string' &&
    toolName.trim().length > 0 &&
    isStructuredToolInput(input)
  )
}

function isStructuredToolInputValue(value: unknown): value is StructuredToolInputValue {
  if (value === null) {
    return true
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return true
  }

  if (Array.isArray(value)) {
    return value.every((item) => isStructuredToolInputValue(item))
  }

  return isStructuredToolInput(value)
}

function isStructuredToolInput(value: unknown): value is StructuredToolInput {
  if (!isRecord(value)) {
    return false
  }

  return Object.values(value).every((item) => isStructuredToolInputValue(item))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
