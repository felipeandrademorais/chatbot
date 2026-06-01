import { describe, expect, it } from 'vitest'

import { createToolName, type Tool } from '@chatbot/contracts'

import { AllowlistedToolAdapter } from '../src/allowlisted-tool-adapter.js'

describe('AllowlistedToolAdapter', () => {
  it('denies invocation for non-allowlisted tools', async () => {
    const toolName = createToolName('unsafe-tool')
    const tool: Tool = {
      name: toolName,
      execute: async () => ({ ok: true }),
    }

    const adapter = new AllowlistedToolAdapter([tool], [])
    const response = await adapter.invoke({
      requestId: 'req-1',
      toolName,
      input: {},
    })

    expect(response.result.success).toBe(false)
    expect(response.result.error).toContain('not allowlisted')
  })

  it('enforces execution timeout sandbox', async () => {
    const toolName = createToolName('slow-tool')
    const slowTool: Tool = {
      name: toolName,
      execute: async () =>
        new Promise((resolve) => {
          setTimeout(() => resolve('late'), 50)
        }),
    }

    const adapter = new AllowlistedToolAdapter([slowTool], [toolName], { timeoutMs: 10 })
    const response = await adapter.invoke({
      requestId: 'req-2',
      toolName,
      input: {},
    })

    expect(response.result.success).toBe(false)
    expect(response.result.error).toContain('timed out')
  })

  it('blocks oversized tool input payloads', async () => {
    const toolName = createToolName('safe-tool')
    const tool: Tool = {
      name: toolName,
      execute: async () => ({ ok: true }),
    }

    const adapter = new AllowlistedToolAdapter([tool], [toolName], { maxInputBytes: 16 })
    const response = await adapter.invoke({
      requestId: 'req-3',
      toolName,
      input: { payload: 'this input is intentionally too large for limit' },
    })

    expect(response.result.success).toBe(false)
    expect(response.result.error).toContain('sandbox limit')
  })
})
