import { describe, expect, it } from 'vitest'

import type { OllamaClient } from '../../packages/tools/src/ollama-local-adapter.js'
import { OllamaLocalAdapter } from '../../packages/tools/src/ollama-local-adapter.js'
import { InMemoryProviderTelemetryStore } from '../../packages/tools/src/provider-telemetry.js'

function createClientWithPrimaryFailure(): OllamaClient {
  return {
    healthCheck: async () => true,
    listModels: async () => ['llama3.1:8b-instruct-q4_K_M', 'qwen2.5:7b-instruct-q4_K_M'],
    pull: async () => undefined,
    warmup: async () => undefined,
    generate: async ({ model }) => {
      if (model === 'llama3.1:8b-instruct-q4_K_M') {
        throw new Error('service unavailable')
      }

      return {
        model,
        outputText: 'fallback-path-used',
        finishReason: 'stop',
        inputTokens: 7,
        outputTokens: 9,
      }
    },
  }
}

describe('stage 05 fallback integration', () => {
  it('routes request to fallback model after primary failure', async () => {
    const telemetry = new InMemoryProviderTelemetryStore()
    const adapter = new OllamaLocalAdapter({
      client: createClientWithPrimaryFailure(),
      telemetryStore: telemetry,
      maxRetries: 0,
      retryDelayMs: 1,
    })

    const response = await adapter.generate({
      requestId: 'req-int-05',
      workflowId: 'wf-int-05',
      model: 'llama3.1:8b-instruct-q4_K_M',
      prompt: 'hello',
    })

    expect(response.model).toBe('qwen2.5:7b-instruct-q4_K_M')
    expect(response.outputText).toBe('fallback-path-used')

    const records = await telemetry.list()
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({
      requestId: 'req-int-05',
      workflowId: 'wf-int-05',
      model: 'qwen2.5:7b-instruct-q4_K_M',
    })
  })
})
