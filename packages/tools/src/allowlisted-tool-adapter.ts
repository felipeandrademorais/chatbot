import {
  type Tool,
  type ToolExecutionResult,
  type ToolInvocationRequest,
  type ToolInvocationResponse,
  type ToolName,
} from '@chatbot/contracts'

const DEFAULT_TOOL_TIMEOUT_MS = 3_000
const DEFAULT_MAX_INPUT_BYTES = 64 * 1024

function now(): number {
  return Date.now()
}

export interface ToolSandboxOptions {
  readonly timeoutMs?: number
  readonly maxInputBytes?: number
}

export class AllowlistedToolAdapter {
  private readonly toolsByName: Map<ToolName, Tool>
  private readonly allowedTools: ReadonlySet<ToolName>
  private readonly timeoutMs: number
  private readonly maxInputBytes: number

  constructor(tools: readonly Tool[], allowedTools: readonly ToolName[], options: ToolSandboxOptions = {}) {
    this.toolsByName = new Map<ToolName, Tool>(tools.map((tool) => [tool.name, tool]))
    this.allowedTools = new Set(allowedTools)
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TOOL_TIMEOUT_MS
    this.maxInputBytes = options.maxInputBytes ?? DEFAULT_MAX_INPUT_BYTES
  }

  async invoke(payload: unknown): Promise<ToolInvocationResponse> {
    if (!isToolInvocationRequest(payload)) {
      throw new Error('Invalid tool invocation payload')
    }

    const request: ToolInvocationRequest = payload
    const startedAt = now()

    if (!this.allowedTools.has(request.toolName)) {
      return {
        requestId: request.requestId,
        result: {
          toolName: request.toolName,
          success: false,
          output: null,
          error: `Tool ${request.toolName} is not allowlisted`,
          durationMs: now() - startedAt,
        },
      }
    }

    const payloadBytes = Buffer.byteLength(JSON.stringify(request.input), 'utf8')
    if (payloadBytes > this.maxInputBytes) {
      return {
        requestId: request.requestId,
        result: {
          toolName: request.toolName,
          success: false,
          output: null,
          error: 'Tool input exceeds sandbox limit (' + this.maxInputBytes.toString() + ' bytes)',
          durationMs: now() - startedAt,
        },
      }
    }

    const tool = this.toolsByName.get(request.toolName)
    if (!tool) {
      return {
        requestId: request.requestId,
        result: {
          toolName: request.toolName,
          success: false,
          output: null,
          error: `Tool ${request.toolName} is not registered`,
          durationMs: now() - startedAt,
        },
      }
    }

    try {
      const output = await this.withTimeout(tool.execute(request.input))
      const result: ToolExecutionResult = {
        toolName: request.toolName,
        success: true,
        output,
        durationMs: now() - startedAt,
      }

      return {
        requestId: request.requestId,
        result,
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        requestId: request.requestId,
        result: {
          toolName: request.toolName,
          success: false,
          output: null,
          error: message,
          durationMs: now() - startedAt,
        },
      }
    }
  }

  private async withTimeout<T>(promise: Promise<T>): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        clearTimeout(timer)
        reject(new Error('Tool execution timed out after ' + this.timeoutMs.toString() + 'ms'))
      }, this.timeoutMs)
    })

    return Promise.race([promise, timeoutPromise])
  }
}

function isToolInvocationRequest(value: unknown): value is ToolInvocationRequest {
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
    isStructuredObject(input)
  )
}

function isStructuredObject(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) {
    return false
  }

  return Object.values(value).every((item) => isStructuredValue(item))
}

function isStructuredValue(value: unknown): boolean {
  if (value === null) {
    return true
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return true
  }

  if (Array.isArray(value)) {
    return value.every((entry) => isStructuredValue(entry))
  }

  return isStructuredObject(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
