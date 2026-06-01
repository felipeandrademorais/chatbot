/**
 * Domain DTO contracts (Stage 03).
 *
 * @module @chatbot/contracts/domain
 * @version 1.0.0
 */

export type { DomainErrorCode, DomainErrorPayload } from './errors.js'

export type {
  AppendMessageInput,
  AppendMessageOutput,
  CreateConversationInput,
  CreateConversationOutput,
} from './conversation.js'

export type {
  CancelWorkflowInput,
  CancelWorkflowOutput,
  CompleteWorkflowTaskInput,
  CompleteWorkflowTaskOutput,
  StartWorkflowInput,
  StartWorkflowOutput,
} from './workflow.js'

export type { CreateSessionInput, CreateSessionOutput } from './session.js'
