import { describe, it, expect } from 'vitest'
import { createToolName } from '../src/tool.js'
import { createWorkflowId, createTaskId } from '../src/workflow.js'
import {
  DEFAULT_OLLAMA_MODEL_CONTRACT,
  validateProviderRequest,
  validateProviderResponse,
} from '../src/provider.js'
import { validateToolInvocationRequest } from '../src/tool.js'

describe('Tool Contract', () => {
  describe('createToolName', () => {
    it('should create a branded ToolName from a valid string', () => {
      const name = createToolName('web-search')
      expect(name).toBe('web-search')
    })

    it('should throw when given an empty string', () => {
      expect(() => createToolName('')).toThrow('Tool name must not be empty')
    })

    it('should throw when given a whitespace-only string', () => {
      expect(() => createToolName('   ')).toThrow('Tool name must not be empty')
    })
  })
})

describe('Workflow Contract', () => {
  describe('createWorkflowId', () => {
    it('should create a branded WorkflowId from a valid string', () => {
      const id = createWorkflowId('wf-123')
      expect(id).toBe('wf-123')
    })

    it('should throw when given an empty string', () => {
      expect(() => createWorkflowId('')).toThrow('Workflow ID must not be empty')
    })

    it('should throw when given a whitespace-only string', () => {
      expect(() => createWorkflowId('   ')).toThrow('Workflow ID must not be empty')
    })
  })

  describe('createTaskId', () => {
    it('should create a branded TaskId from a valid string', () => {
      const id = createTaskId('TASK-01-001')
      expect(id).toBe('TASK-01-001')
    })

    it('should throw when given an empty string', () => {
      expect(() => createTaskId('')).toThrow('Task ID must not be empty')
    })

    it('should throw when given a whitespace-only string', () => {
      expect(() => createTaskId('   ')).toThrow('Task ID must not be empty')
    })
  })
})

describe('Provider Contract', () => {
  it('accepts a valid provider request payload', () => {
    const payload: unknown = {
      requestId: 'req-1',
      workflowId: 'wf-1',
      model: DEFAULT_OLLAMA_MODEL_CONTRACT.approvedModels[0]?.name,
      prompt: 'hello',
      maxOutputTokens: 128,
      temperature: 0.2,
    }

    expect(validateProviderRequest(payload)).toBe(true)
  })

  it('accepts a normalized provider response payload', () => {
    const payload: unknown = {
      requestId: 'req-1',
      workflowId: 'wf-1',
      provider: 'ollama',
      model: DEFAULT_OLLAMA_MODEL_CONTRACT.approvedModels[0]?.name,
      outputText: 'hi',
      finishReason: 'stop',
      usage: {
        inputTokens: 10,
        outputTokens: 8,
        estimatedCostUsd: 0,
      },
    }

    expect(validateProviderResponse(payload)).toBe(true)
  })

  it('rejects provider responses with unsupported providers', () => {
    const payload: unknown = {
      requestId: 'req-1',
      workflowId: 'wf-1',
      provider: 'remote-openai',
      model: 'gpt-4o',
      outputText: 'hi',
      finishReason: 'stop',
      usage: {
        inputTokens: 1,
        outputTokens: 1,
        estimatedCostUsd: 0.01,
      },
    }

    expect(validateProviderResponse(payload)).toBe(false)
  })
})

describe('Tool Invocation Contract', () => {
  it('accepts structured input object', () => {
    const payload: unknown = {
      requestId: 'req-tool-1',
      toolName: createToolName('web-search'),
      input: {
        query: 'latest weather',
        limit: 5,
        options: {
          region: 'ar',
          exact: false,
        },
      },
    }

    expect(validateToolInvocationRequest(payload)).toBe(true)
  })

  it('rejects unstructured input payloads', () => {
    const payload: unknown = {
      requestId: 'req-tool-2',
      toolName: createToolName('shell'),
      input: () => 'not-json',
    }

    expect(validateToolInvocationRequest(payload)).toBe(false)
  })
})
