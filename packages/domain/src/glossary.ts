/**
 * Ubiquitous language for the chatbot domain.
 *
 * @module @chatbot/domain/glossary
 */

/** A bounded exchange of messages tied to a user session. */
export const TERM_CONVERSATION = 'Conversation' as const

/** A durable container for one or more conversations for a principal. */
export const TERM_SESSION = 'Session' as const

/** An orchestrated multi-step execution bound to a conversation. */
export const TERM_WORKFLOW_EXECUTION = 'WorkflowExecution' as const

/** A single unit of work within a workflow execution. */
export const TERM_WORKFLOW_TASK = 'WorkflowTask' as const

/** A normalized utterance within a conversation thread. */
export const TERM_CONVERSATION_MESSAGE = 'ConversationMessage' as const
