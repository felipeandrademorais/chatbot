/**
 * Domain Package
 *
 * Pure business logic — framework-independent.
 *
 * @module @chatbot/domain
 * @stage 03-core-domain
 */

export const DOMAIN_VERSION = '1.0.0' as const

export {
  TERM_CONVERSATION,
  TERM_CONVERSATION_MESSAGE,
  TERM_SESSION,
  TERM_WORKFLOW_EXECUTION,
  TERM_WORKFLOW_TASK,
} from './glossary.js'

export { DomainError, isDomainError } from './errors/index.js'

export { ConversationMessage } from './entities/conversation-message.js'
export { WorkflowTask } from './entities/workflow-task.js'
export type { WorkflowTaskStatus } from './entities/workflow-task.js'

export { Conversation } from './aggregates/conversation.js'
export { Session } from './aggregates/session.js'
export { WorkflowExecution } from './aggregates/workflow-execution.js'

export type {
  ConversationId,
  RequestId,
  SessionId,
  UserId,
} from './value-objects/index.js'
export {
  assertValidMessageContent,
  assertValidMessageRole,
  createConversationId,
  createRequestId,
  createSessionId,
  createTaskId,
  createUserId,
  createWorkflowId,
} from './value-objects/index.js'

export type {
  ConversationRepository,
  SessionRepository,
  WorkflowRepository,
} from './repositories/index.js'

export { InMemoryConversationRepository } from './adapters/in-memory/in-memory-conversation-repository.js'
export { InMemorySessionRepository } from './adapters/in-memory/in-memory-session-repository.js'
export { InMemoryWorkflowRepository } from './adapters/in-memory/in-memory-workflow-repository.js'

export {
  AppendMessageUseCase,
  CancelWorkflowUseCase,
  CompleteWorkflowTaskUseCase,
  CreateConversationUseCase,
  CreateSessionUseCase,
  StartWorkflowUseCase,
} from './use-cases/index.js'
