import type {
  ModelLifecycleResult,
  OllamaModelContract,
  ProviderAdapter,
  ProviderError,
  ProviderErrorCode,
  ProviderRequest,
  ProviderResponse,
} from '@chatbot/contracts'

import type { ProviderTelemetryStore } from './provider-telemetry.js'

const DEFAULT_CIRCUIT_BREAKER_THRESHOLD = 3
const DEFAULT_CIRCUIT_BREAKER_COOLDOWN_MS = 30_000
const DEFAULT_RETRY_DELAY_MS = 200
const DEFAULT_PROVIDER_TIMEOUT_MS = 30_000
const MAX_PROVIDER_RETRIES = 2
const DEFAULT_MODEL_CONTRACT: OllamaModelContract = {
  approvedModels: [
    { name: 'llama3.1:8b-instruct-q4_K_M', quantization: 'q4_K_M', contextWindow: 8192 },
    { name: 'qwen2.5:7b-instruct-q4_K_M', quantization: 'q4_K_M', contextWindow: 8192 },
  ],
  fallbackModel: 'qwen2.5:7b-instruct-q4_K_M',
}

interface OllamaGenerateInput {
  readonly model: string
  readonly prompt: string
  readonly maxOutputTokens?: number
  readonly temperature?: number
}

interface OllamaGenerateOutput {
  readonly model: string
  readonly outputText: string
  readonly finishReason: 'stop' | 'length'
  readonly inputTokens: number
  readonly outputTokens: number
}

export interface OllamaClient {
  healthCheck(): Promise<boolean>
  listModels(): Promise<readonly string[]>
  pull(model: string): Promise<void>
  warmup(model: string): Promise<void>
  generate(input: OllamaGenerateInput): Promise<OllamaGenerateOutput>
}

export interface OllamaAdapterOptions {
  readonly client: OllamaClient
  readonly telemetryStore: ProviderTelemetryStore
  readonly modelContract?: OllamaModelContract
  readonly skipPull?: boolean
  readonly skipWarmup?: boolean
  readonly timeoutMs?: number
  readonly maxRetries?: number
  readonly retryDelayMs?: number
  readonly circuitBreakerThreshold?: number
  readonly circuitBreakerCooldownMs?: number
}

interface CircuitState {
  consecutiveFailures: number
  openedAt?: number
}

export class OllamaLocalAdapter implements ProviderAdapter {
  private readonly client: OllamaClient
  private readonly telemetryStore: ProviderTelemetryStore
  private readonly modelContract: OllamaModelContract
  private readonly skipPull: boolean
  private readonly skipWarmup: boolean
  private readonly timeoutMs: number
  private readonly maxRetries: number
  private readonly retryDelayMs: number
  private readonly circuitBreakerThreshold: number
  private readonly circuitBreakerCooldownMs: number
  private readonly circuitState: CircuitState = { consecutiveFailures: 0 }

  constructor(options: OllamaAdapterOptions) {
    this.client = options.client
    this.telemetryStore = options.telemetryStore
    this.modelContract = options.modelContract ?? DEFAULT_MODEL_CONTRACT
    this.skipPull = options.skipPull ?? false
    this.skipWarmup = options.skipWarmup ?? false
    this.timeoutMs = options.timeoutMs ?? DEFAULT_PROVIDER_TIMEOUT_MS
    this.maxRetries = options.maxRetries ?? MAX_PROVIDER_RETRIES
    this.retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS
    this.circuitBreakerThreshold = options.circuitBreakerThreshold ?? DEFAULT_CIRCUIT_BREAKER_THRESHOLD
    this.circuitBreakerCooldownMs = options.circuitBreakerCooldownMs ?? DEFAULT_CIRCUIT_BREAKER_COOLDOWN_MS
  }

  async generate(request: ProviderRequest): Promise<ProviderResponse> {
    this.assertCircuitAllowsRequest()
    this.validateModelIsApproved(request.model)

    await this.prepareModel(request.model)

    try {
      return await this.generateWithFallback(request)
    } catch (error: unknown) {
      const mappedError = mapProviderError(error)
      await this.persistTelemetry({
        request,
        model: request.model,
        inputTokens: 0,
        outputTokens: 0,
        estimatedCostUsd: 0,
        errorCode: mappedError.code,
        errorMessage: mappedError.message,
      })
      throw error
    }
  }

  async pullModel(model: string): Promise<ModelLifecycleResult> {
    this.validateModelIsApproved(model)
    await this.withTimeout(this.client.pull(model))
    return { operation: 'pull', model, success: true }
  }

  async warmupModel(model: string): Promise<ModelLifecycleResult> {
    this.validateModelIsApproved(model)
    await this.withTimeout(this.client.warmup(model))
    return { operation: 'warmup', model, success: true }
  }

  async healthCheck(): Promise<ModelLifecycleResult> {
    const healthy = await this.withTimeout(this.client.healthCheck())
    return {
      operation: 'health-check',
      model: this.modelContract.fallbackModel,
      success: healthy,
      message: healthy ? 'ok' : 'unhealthy',
    }
  }

  private async generateWithFallback(request: ProviderRequest): Promise<ProviderResponse> {
    try {
      return await this.runGenerateWithModel(request, request.model)
    } catch (error: unknown) {
      const fallbackModel = this.modelContract.fallbackModel
      if (fallbackModel === request.model) {
        throw error
      }

      await this.prepareModel(fallbackModel)
      return this.runGenerateWithModel(request, fallbackModel)
    }
  }

  private async runGenerateWithModel(request: ProviderRequest, model: string): Promise<ProviderResponse> {
    let retries = 0

    while (retries <= this.maxRetries) {
      try {
        const generateInput: OllamaGenerateInput = {
          model,
          prompt: request.prompt,
          ...(request.maxOutputTokens !== undefined
            ? { maxOutputTokens: request.maxOutputTokens }
            : {}),
          ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
        }

        const result = await this.withTimeout(
          this.client.generate(generateInput),
        )

        this.resetCircuitState()

        const response: ProviderResponse = {
          requestId: request.requestId,
          workflowId: request.workflowId,
          provider: 'ollama',
          model: result.model,
          outputText: result.outputText,
          finishReason: result.finishReason,
          usage: {
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            estimatedCostUsd: 0,
          },
        }

        await this.persistTelemetry({
          request,
          model: result.model,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          estimatedCostUsd: 0,
        })
        return response
      } catch (error: unknown) {
        const mappedError = mapProviderError(error)
        this.registerFailure()

        if (!mappedError.retryable || retries >= this.maxRetries) {
          throw new Error(mappedError.message)
        }

        const delayMs = this.retryDelayMs * 2 ** retries
        await sleep(delayMs)
        retries += 1
      }
    }

    throw new Error('Provider execution exhausted retries')
  }

  private async prepareModel(model: string): Promise<void> {
    if (!this.skipPull) {
      const installed = await this.withTimeout(this.client.listModels())
      if (!installed.includes(model)) {
        await this.pullModel(model)
      }
    }

    if (!this.skipWarmup) {
      await this.warmupModel(model)
    }
  }

  private validateModelIsApproved(model: string): void {
    const approvedModels = new Set(this.modelContract.approvedModels.map((entry) => entry.name))
    if (!approvedModels.has(model)) {
      throw new Error(`Model ${model} is not approved by OllamaModelContract`)
    }
  }

  private assertCircuitAllowsRequest(): void {
    const openedAt = this.circuitState.openedAt
    if (openedAt === undefined) {
      return
    }

    const elapsedMs = Date.now() - openedAt
    if (elapsedMs >= this.circuitBreakerCooldownMs) {
      this.resetCircuitState()
      return
    }

    throw new Error('Ollama circuit breaker is open')
  }

  private registerFailure(): void {
    this.circuitState.consecutiveFailures += 1
    if (this.circuitState.consecutiveFailures >= this.circuitBreakerThreshold) {
      this.circuitState.openedAt = Date.now()
    }
  }

  private resetCircuitState(): void {
    this.circuitState.consecutiveFailures = 0
    delete this.circuitState.openedAt
  }

  private async withTimeout<T>(promise: Promise<T>): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        clearTimeout(timer)
        reject(new Error('Provider timeout'))
      }, this.timeoutMs)
    })

    return Promise.race([promise, timeoutPromise])
  }

  private async persistTelemetry(params: {
    request: ProviderRequest
    model: string
    inputTokens: number
    outputTokens: number
    estimatedCostUsd: number
    errorCode?: ProviderErrorCode
    errorMessage?: string
  }): Promise<void> {
    const record = {
      requestId: params.request.requestId,
      workflowId: params.request.workflowId,
      provider: 'ollama',
      model: params.model,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      estimatedCostUsd: params.estimatedCostUsd,
      recordedAt: new Date().toISOString(),
    }

    await this.telemetryStore.save({
      ...record,
      ...(params.errorCode !== undefined ? { errorCode: params.errorCode } : {}),
      ...(params.errorMessage !== undefined ? { errorMessage: params.errorMessage } : {}),
    })
  }
}

export function createDefaultOllamaClient(baseUrl = 'http://127.0.0.1:11434'): OllamaClient {
  return {
    async healthCheck(): Promise<boolean> {
      const response = await fetch(`${baseUrl}/api/tags`)
      return response.ok
    },

    async listModels(): Promise<readonly string[]> {
      const response = await fetch(`${baseUrl}/api/tags`)
      if (!response.ok) {
        throw new Error('Failed to list Ollama models')
      }

      const body: unknown = await response.json()
      if (!isRecord(body)) {
        throw new Error('Invalid Ollama tags payload')
      }

      const models = body.models
      if (!Array.isArray(models)) {
        return []
      }

      const names: string[] = []
      for (const entry of models) {
        if (!isRecord(entry)) {
          continue
        }
        const name = entry.name
        if (typeof name === 'string' && name.length > 0) {
          names.push(name)
        }
      }

      return names
    },

    async pull(model: string): Promise<void> {
      const response = await fetch(`${baseUrl}/api/pull`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model, stream: false }),
      })
      if (!response.ok) {
        throw new Error(`Failed to pull model ${model}`)
      }
    },

    async warmup(model: string): Promise<void> {
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt: 'warmup',
          stream: false,
          options: { num_predict: 1 },
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to warmup model ${model}`)
      }
    },

    async generate(input: OllamaGenerateInput): Promise<OllamaGenerateOutput> {
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: input.model,
          prompt: input.prompt,
          stream: false,
          options: {
            temperature: input.temperature,
            num_predict: input.maxOutputTokens,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Ollama generate failed with status ' + response.status.toString())
      }

      const body: unknown = await response.json()
      if (!isRecord(body)) {
        throw new Error('Invalid Ollama response payload')
      }

      const model = body.model
      const outputText = body.response
      const doneReason = body.done_reason
      const inputTokens = body.prompt_eval_count
      const outputTokens = body.eval_count

      if (
        typeof model !== 'string' ||
        typeof outputText !== 'string' ||
        (doneReason !== 'stop' && doneReason !== 'length') ||
        typeof inputTokens !== 'number' ||
        typeof outputTokens !== 'number'
      ) {
        throw new Error('Invalid Ollama normalized payload')
      }

      return {
        model,
        outputText,
        finishReason: doneReason,
        inputTokens,
        outputTokens,
      }
    },
  }
}

function mapProviderError(error: unknown): ProviderError {
  const message = error instanceof Error ? error.message : String(error)
  const normalized = message.toLowerCase()

  if (normalized.includes('timeout')) {
    return { code: 'timeout', message, retryable: true }
  }

  if (normalized.includes('429') || normalized.includes('rate limit')) {
    return { code: 'rate_limited', message, retryable: true }
  }

  if (normalized.includes('not approved') || normalized.includes('invalid')) {
    return { code: 'invalid_request', message, retryable: false }
  }

  if (normalized.includes('connection') || normalized.includes('unavailable') || normalized.includes('status 5')) {
    return { code: 'unavailable', message, retryable: true }
  }

  return { code: 'unknown', message, retryable: false }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
