import { describe, expect, it } from 'vitest'

import type {
  AppendMessageInput,
  CreateConversationInput,
  StartWorkflowInput,
} from '../src/domain/index.js'

describe('domain DTO contracts', () => {
  it('accepts minimal create conversation input shape', () => {
    const input: CreateConversationInput = {
      sessionId: 'sess-1',
      requestId: 'req-1',
    }
    expect(input.sessionId).toBe('sess-1')
  })

  it('accepts append message input with optional metadata', () => {
    const input: AppendMessageInput = {
      conversationId: 'conv-1',
      role: 'user',
      content: 'hello',
      requestId: 'req-2',
      agentId: 'agent-a',
    }
    expect(input.role).toBe('user')
  })

  it('accepts start workflow input with optional priority', () => {
    const input: StartWorkflowInput = {
      workflowId: 'wf-1',
      conversationId: 'conv-1',
      taskId: 'task-1',
      taskType: 'chat',
      requestId: 'req-3',
      priority: 5,
    }
    expect(input.priority).toBe(5)
  })
})
