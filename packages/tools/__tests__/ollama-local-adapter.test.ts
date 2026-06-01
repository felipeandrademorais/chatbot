import { createToolName, type ProviderRequest, type Tool } from '@chatbot/contracts'
import { describe, expect, it, vi } from 'vitest'

import { AllowlistedToolAdapter } from '../src/allowlisted-tool-adapter.js'
import { OllamaLocalAdapter, type OllamaClient } from '../src/ollama-local-adapter.js'
import { InMemoryProviderTelemetryStore } from '../src/provider-telemetry.js'

function createRequest(overrides: Partial<ProviderRequest> = {}): ProviderRequest {
  return {
    requestId: 'req-1',
    workflowId: 'wf-1',
    model: 'llama3.1:8b-instruct-q4_K_M',
    prompt: 'hello',
    ...overrides,
  }
}

function createClient(overrides: Partial<OllamaClient> = {}): OllamaClient {
  return {
    healthCheck: async () => true,
    listModels: async () => ['llama3.1:8b-instruct-q4_K_M', 'qwen2.5:7b-instruct-q4_K_M'],
    pull: async () => undefined,
    warmup: async () => undefined,
    generate: async ({ model }) => ({
      model,
      outputText: 'ok',
      finishReason: 'stop',
      inputTokens: 4,
      outputTokens: 6,
    }),
    ...overrides,
  }
}

describe('OllamaLocalAdapter', () => {
  it('normalizes provider response and persists telemetry', async () => {
    const telemetry = new InMemoryProviderTelemetryStore()
    const adapter = new OllamaLocalAdapter({
      client: createClient(),
      telemetryStore: telemetry,
    })

    const response = await adapter.generate(createRequest())
    expect(response.provider).toBe('ollama')
    expect(response.model).toBe('llama3.1:8b-instruct-q4_K_M')
    expect(response.usage.inputTokens).toBe(4)
    expect(response.usage.outputTokens).toBe(6)

    const records = await telemetry.list()
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({
      requestId: 'req-1',
      workflowId: 'wf-1',
      provider: 'ollama',
      model: 'llama3.1:8b-instruct-q4_K_M',
      inputTokens: 4,
      outputTokens: 6,
      estimatedCostUsd: 0,
    })
  })

  it('retries transient failures with exponential backoff', async () => {
    const telemetry = new InMemoryProviderTelemetryStore()
    const generate = vi
      .fn<OllamaClient['generate']>()
      .mockRejectedValueOnce(new Error('connection reset'))
      .mockRejectedValueOnce(new Error('service unavailable'))
      .mockResolvedValue({
        model: 'llama3.1:8b-instruct-q4_K_M',
        outputText: 'recovered',
        finishReason: 'stop',
        inputTokens: 2,
        outputTokens: 3,
      })

    const adapter = new OllamaLocalAdapter({
      client: createClient({ generate }),
      telemetryStore: telemetry,
      retryDelayMs: 1,
    })

    const response = await adapter.generate(createRequest())
    expect(response.outputText).toBe('recovered')
    expect(generate).toHaveBeenCalledTimes(3)
  })

  it('uses fallback model when primary fails', async () => {
    const telemetry = new InMemoryProviderTelemetryStore()
    const generate = vi.fn<OllamaClient['generate']>(async ({ model }) => {
      if (model === 'llama3.1:8b-instruct-q4_K_M') {
        throw new Error('service unavailable')
      }
      return {
        model,
        outputText: 'fallback-ok',
        finishReason: 'stop',
        inputTokens: 1,
        outputTokens: 1,
      }
    })

    const adapter = new OllamaLocalAdapter({
      client: createClient({ generate }),
      telemetryStore: telemetry,
      retryDelayMs: 1,
      maxRetries: 0,
    })

    const response = await adapter.generate(createRequest())
    expect(response.model).toBe('qwen2.5:7b-instruct-q4_K_M')
    expect(response.outputText).toBe('fallback-ok')
  })

  it('opens circuit breaker after repeated failures', async () => {
    const telemetry = new InMemoryProviderTelemetryStore()
    const adapter = new OllamaLocalAdapter({
      client: createClient({
        generate: async () => {
          throw new Error('service unavailable')
        },
      }),
      telemetryStore: telemetry,
      maxRetries: 0,
      circuitBreakerThreshold: 1,
      retryDelayMs: 1,
      circuitBreakerCooldownMs: 10_000,
    })

    await expect(adapter.generate(createRequest())).rejects.toThrow('service unavailable')
    await expect(adapter.generate(createRequest())).rejects.toThrow('circuit breaker is open')
  })

  it('skips pull when the model is already installed', async () => {
    const pull = vi.fn<OllamaClient['pull']>(async () => undefined)
    const telemetry = new InMemoryProviderTelemetryStore()
    const adapter = new OllamaLocalAdapter({
      client: createClient({
        listModels: async () => ['llama3.1:8b-instruct-q4_K_M'],
        pull,
      }),
      telemetryStore: telemetry,
    })

    await adapter.generate(createRequest())
    expect(pull).not.toHaveBeenCalled()
  })

  it('never pulls when skipPull is enabled', async () => {
    const pull = vi.fn<OllamaClient['pull']>(async () => undefined)
    const telemetry = new InMemoryProviderTelemetryStore()
    const adapter = new OllamaLocalAdapter({
      client: createClient({
        listModels: async () => [],
        pull,
      }),
      telemetryStore: telemetry,
      skipPull: true,
      skipWarmup: true,
    })

    await adapter.generate(createRequest())
    expect(pull).not.toHaveBeenCalled()
  })

  it('enforces request timeout', async () => {
    const telemetry = new InMemoryProviderTelemetryStore()
    const adapter = new OllamaLocalAdapter({
      client: createClient({
        generate: async () => new Promise(() => undefined),
      }),
      telemetryStore: telemetry,
      timeoutMs: 5,
      maxRetries: 0,
      retryDelayMs: 1,
    })

    await expect(adapter.generate(createRequest())).rejects.toThrow('Provider timeout')

    const records = await telemetry.list()
    expect(records).toHaveLength(1)
    expect(records[0]?.errorCode).toBe('timeout')
  })
})

describe('AllowlistedToolAdapter', () => {
  it('executes allowlisted and registered tool', async () => {
    const tool: Tool = {
      name: createToolName('web-search'),
      execute: async (input) => ({ echo: input }),
    }

    const adapter = new AllowlistedToolAdapter([tool], [tool.name])
    const response = await adapter.invoke({
      requestId: 'req-tool-1',
      toolName: tool.name,
      input: { query: 'llm' },
    })

    expect(response.result.success).toBe(true)
    expect(response.result.output).toMatchObject({ echo: { query: 'llm' } })
  })

  it('rejects non-allowlisted tools', async () => {
    const tool: Tool = {
      name: createToolName('shell'),
      execute: async () => 'ok',
    }

    const adapter = new AllowlistedToolAdapter([tool], [])
    const response = await adapter.invoke({
      requestId: 'req-tool-2',
      toolName: tool.name,
      input: { command: 'date' },
    })

    expect(response.result.success).toBe(false)
    expect(response.result.error).toContain('not allowlisted')
  })
})
