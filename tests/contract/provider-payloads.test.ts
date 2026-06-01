import { describe, expect, it } from 'vitest'

import {
  validateProviderRequest,
  validateProviderResponse,
  validateToolInvocationRequest,
} from '../../packages/contracts/src/index.js'

describe('stage 05 provider payload contract', () => {
  it('accepts normalized ProviderRequest payload', () => {
    const payload: unknown = {
      requestId: 'req-05-1',
      workflowId: 'wf-05-1',
      model: 'llama3.1:8b-instruct-q4_K_M',
      prompt: 'hello',
      maxOutputTokens: 128,
      temperature: 0.1,
    }

    expect(validateProviderRequest(payload)).toBe(true)
  })

  it('accepts normalized ProviderResponse payload', () => {
    const payload: unknown = {
      requestId: 'req-05-1',
      workflowId: 'wf-05-1',
      provider: 'ollama',
      model: 'llama3.1:8b-instruct-q4_K_M',
      outputText: 'pong',
      finishReason: 'stop',
      usage: {
        inputTokens: 3,
        outputTokens: 2,
        estimatedCostUsd: 0,
      },
    }

    expect(validateProviderResponse(payload)).toBe(true)
  })

  it('enforces structured tool invocation payload input', () => {
    const payload: unknown = {
      requestId: 'req-tool-05',
      toolName: 'web-search',
      input: {
        query: 'ollama',
        options: { region: 'local' },
      },
    }

    expect(validateToolInvocationRequest(payload)).toBe(true)
  })
})
