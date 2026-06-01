/**
 * Provider Contracts (Stage 05 - Integrations)
 *
 * Stable, provider-agnostic contracts for LLM request/response exchange.
 * Includes Ollama Local First model policy and lifecycle operations.
 *
 * @module @chatbot/contracts/provider
 * @version 1.0.0
 */

export const DEFAULT_PROVIDER_TIMEOUT_MS = 30_000
export const MAX_PROVIDER_RETRIES = 2

export type ProviderName = 'ollama'

export type ProviderFinishReason = 'stop' | 'length' | 'error'

export type ProviderErrorCode = 'timeout' | 'rate_limited' | 'unavailable' | 'invalid_request' | 'unknown'

export interface ProviderError {
  readonly code: ProviderErrorCode
  readonly message: string
  readonly retryable: boolean
}

export interface ProviderRequest {
  readonly requestId: string
  readonly workflowId: string
  readonly model: string
  readonly prompt: string
  readonly maxOutputTokens?: number
  readonly temperature?: number
}

export interface ProviderUsageTelemetry {
  readonly inputTokens: number
  readonly outputTokens: number
  readonly estimatedCostUsd: number
  readonly errorCode?: ProviderErrorCode
}

export interface ProviderResponse {
  readonly requestId: string
  readonly workflowId: string
  readonly provider: ProviderName
  readonly model: string
  readonly outputText: string
  readonly finishReason: ProviderFinishReason
  readonly usage: ProviderUsageTelemetry
  readonly error?: ProviderError
}

export interface ProviderAdapter {
  generate(request: ProviderRequest): Promise<ProviderResponse>
}

export type ModelLifecycleOperation = 'pull' | 'warmup' | 'health-check' | 'fallback'

export interface ModelLifecycleResult {
  readonly operation: ModelLifecycleOperation
  readonly model: string
  readonly success: boolean
  readonly message?: string
}

export interface OllamaApprovedModel {
  readonly name: string
  readonly quantization: string
  readonly contextWindow: number
}

export interface OllamaModelContract {
  readonly approvedModels: readonly OllamaApprovedModel[]
  readonly fallbackModel: string
}

export const DEFAULT_OLLAMA_MODEL_CONTRACT: OllamaModelContract = {
  approvedModels: [
    { name: 'llama3.1:8b-instruct-q4_K_M', quantization: 'q4_K_M', contextWindow: 8192 },
    { name: 'qwen2.5:7b-instruct-q4_K_M', quantization: 'q4_K_M', contextWindow: 8192 },
  ],
  fallbackModel: 'qwen2.5:7b-instruct-q4_K_M',
}

export function validateProviderRequest(value: unknown): value is ProviderRequest {
  if (!isRecord(value)) {
    return false
  }

  const requestId = value.requestId
  const workflowId = value.workflowId
  const model = value.model
  const prompt = value.prompt
  const maxOutputTokens = value.maxOutputTokens
  const temperature = value.temperature

  const hasRequiredIdentifiers = isNonEmptyString(requestId) && isNonEmptyString(workflowId)
  const hasPromptFields = isNonEmptyString(model) && isNonEmptyString(prompt)
  const hasValidMaxOutputTokens = isOptionalPositiveInteger(maxOutputTokens)
  const hasValidTemperature = isOptionalFiniteNumber(temperature)

  return hasRequiredIdentifiers && hasPromptFields && hasValidMaxOutputTokens && hasValidTemperature
}

export function validateProviderResponse(value: unknown): value is ProviderResponse {
  if (!isRecord(value)) {
    return false
  }

  const provider = value.provider
  const finishReason = value.finishReason
  const requestId = value.requestId
  const workflowId = value.workflowId
  const model = value.model
  const outputText = value.outputText
  const usage = value.usage
  const error = value.error

  const hasKnownProvider = provider === 'ollama'
  const hasValidFinishReason = isProviderFinishReason(finishReason)
  const hasRequiredIdentifiers = isNonEmptyString(requestId) && isNonEmptyString(workflowId)
  const hasNormalizedOutput = isNonEmptyString(model) && typeof outputText === 'string'
  const hasValidUsage = validateProviderUsageTelemetry(usage)
  const hasValidError = error === undefined || validateProviderError(error)

  return hasKnownProvider && hasValidFinishReason && hasRequiredIdentifiers && hasNormalizedOutput && hasValidUsage && hasValidError
}

function validateProviderUsageTelemetry(value: unknown): value is ProviderUsageTelemetry {
  if (!isRecord(value)) {
    return false
  }

  const inputTokens = value.inputTokens
  const outputTokens = value.outputTokens
  const estimatedCostUsd = value.estimatedCostUsd
  const errorCode = value.errorCode

  const hasValidTokenCounts = isNonNegativeFiniteNumber(inputTokens) && isNonNegativeFiniteNumber(outputTokens)
  const hasValidEstimatedCost = isNonNegativeFiniteNumber(estimatedCostUsd)
  const hasKnownErrorCode = errorCode === undefined || isProviderErrorCode(errorCode)

  return hasValidTokenCounts && hasValidEstimatedCost && hasKnownErrorCode
}

function validateProviderError(value: unknown): value is ProviderError {
  if (!isRecord(value)) {
    return false
  }

  const code = value.code
  const message = value.message
  const retryable = value.retryable

  if (
    code !== 'timeout' &&
    code !== 'rate_limited' &&
    code !== 'unavailable' &&
    code !== 'invalid_request' &&
    code !== 'unknown'
  ) {
    return false
  }

  return typeof message === 'string' && typeof retryable === 'boolean'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function isOptionalPositiveInteger(value: unknown): boolean {
  return value === undefined || (typeof value === 'number' && Number.isInteger(value) && value > 0)
}

function isOptionalFiniteNumber(value: unknown): boolean {
  return value === undefined || (typeof value === 'number' && Number.isFinite(value))
}

function isProviderFinishReason(value: unknown): value is ProviderFinishReason {
  return value === 'stop' || value === 'length' || value === 'error'
}

function isProviderErrorCode(value: unknown): value is ProviderErrorCode {
  return (
    value === 'timeout' ||
    value === 'rate_limited' ||
    value === 'unavailable' ||
    value === 'invalid_request' ||
    value === 'unknown'
  )
}
