import { createTaskId, createWorkflowId } from '@chatbot/contracts'

import { DomainError } from '../errors/domain-error.js'

export type ConversationId = string & { readonly __brand: 'ConversationId' }
export type SessionId = string & { readonly __brand: 'SessionId' }
export type UserId = string & { readonly __brand: 'UserId' }
export type RequestId = string & { readonly __brand: 'RequestId' }

const NON_EMPTY_ID = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/

function assertNonEmptyId(value: string, label: string): void {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    throw new DomainError('INVALID_ARGUMENT', `${label} must not be empty`)
  }
  if (!NON_EMPTY_ID.test(trimmed)) {
    throw new DomainError('INVALID_ARGUMENT', `${label} has invalid format`, { label })
  }
}

export function createConversationId(id: string): ConversationId {
  assertNonEmptyId(id, 'conversationId')
  return id.trim() as ConversationId
}

export function createSessionId(id: string): SessionId {
  assertNonEmptyId(id, 'sessionId')
  return id.trim() as SessionId
}

export function createUserId(id: string): UserId {
  assertNonEmptyId(id, 'userId')
  return id.trim() as UserId
}

export function createRequestId(id: string): RequestId {
  assertNonEmptyId(id, 'requestId')
  return id.trim() as RequestId
}

export { createTaskId, createWorkflowId }
