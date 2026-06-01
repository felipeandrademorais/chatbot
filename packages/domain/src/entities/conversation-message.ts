import type { MessageRole } from '@chatbot/contracts'

import { assertValidMessageContent, assertValidMessageRole } from '../value-objects/message-content.js'

export interface ConversationMessageProps {
  readonly role: MessageRole
  readonly content: string
  readonly timestamp: Date
  readonly agentId?: string
  readonly toolName?: string
}

export class ConversationMessage {
  readonly role: MessageRole
  readonly content: string
  readonly timestamp: Date
  readonly agentId: string | undefined
  readonly toolName: string | undefined

  private constructor(props: ConversationMessageProps) {
    this.role = props.role
    this.content = props.content
    this.timestamp = props.timestamp
    this.agentId = props.agentId
    this.toolName = props.toolName
  }

  static create(props: ConversationMessageProps): ConversationMessage {
    assertValidMessageRole(props.role)
    assertValidMessageContent(props.content)
    return new ConversationMessage({
      ...props,
      timestamp: props.timestamp,
    })
  }
}
