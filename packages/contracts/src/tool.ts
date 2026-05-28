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
