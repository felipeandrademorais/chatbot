import type {
  AppendMessageInput,
  AppendMessageOutput,
  CancelWorkflowInput,
  CancelWorkflowOutput,
  CompleteWorkflowTaskInput,
  CompleteWorkflowTaskOutput,
  CreateConversationInput,
  CreateConversationOutput,
  CreateSessionInput,
  CreateSessionOutput,
  DomainErrorCode,
  StartWorkflowInput,
  StartWorkflowOutput,
} from '@chatbot/contracts'
import {
  AppendMessageUseCase,
  CancelWorkflowUseCase,
  CompleteWorkflowTaskUseCase,
  CreateConversationUseCase,
  CreateSessionUseCase,
  InMemoryConversationRepository,
  InMemorySessionRepository,
  InMemoryWorkflowRepository,
  StartWorkflowUseCase,
} from '@chatbot/domain'

export interface DomainServiceError extends Error {
  readonly code: DomainErrorCode
  readonly details?: Readonly<Record<string, string | number | boolean>>
}

export interface DomainApiService {
  createSession(input: CreateSessionInput): Promise<CreateSessionOutput>
  createConversation(input: CreateConversationInput): Promise<CreateConversationOutput>
  appendMessage(input: AppendMessageInput): Promise<AppendMessageOutput>
  startWorkflow(input: StartWorkflowInput): Promise<StartWorkflowOutput>
  completeWorkflowTask(input: CompleteWorkflowTaskInput): Promise<CompleteWorkflowTaskOutput>
  cancelWorkflow(input: CancelWorkflowInput): Promise<CancelWorkflowOutput>
}

class InMemoryDomainApiService implements DomainApiService {
  private readonly sessions = new InMemorySessionRepository()
  private readonly conversations = new InMemoryConversationRepository()
  private readonly workflows = new InMemoryWorkflowRepository()

  private readonly createSessionUseCase = new CreateSessionUseCase(this.sessions)
  private readonly createConversationUseCase = new CreateConversationUseCase(this.sessions, this.conversations)
  private readonly appendMessageUseCase = new AppendMessageUseCase(this.conversations)
  private readonly startWorkflowUseCase = new StartWorkflowUseCase(this.conversations, this.workflows)
  private readonly completeWorkflowTaskUseCase = new CompleteWorkflowTaskUseCase(this.workflows)
  private readonly cancelWorkflowUseCase = new CancelWorkflowUseCase(this.workflows)

  createSession(input: CreateSessionInput): Promise<CreateSessionOutput> {
    return this.createSessionUseCase.execute(input)
  }

  createConversation(input: CreateConversationInput): Promise<CreateConversationOutput> {
    return this.createConversationUseCase.execute(input)
  }

  appendMessage(input: AppendMessageInput): Promise<AppendMessageOutput> {
    return this.appendMessageUseCase.execute(input)
  }

  startWorkflow(input: StartWorkflowInput): Promise<StartWorkflowOutput> {
    return this.startWorkflowUseCase.execute(input)
  }

  completeWorkflowTask(input: CompleteWorkflowTaskInput): Promise<CompleteWorkflowTaskOutput> {
    return this.completeWorkflowTaskUseCase.execute(input)
  }

  cancelWorkflow(input: CancelWorkflowInput): Promise<CancelWorkflowOutput> {
    return this.cancelWorkflowUseCase.execute(input)
  }
}

export function createInMemoryDomainApiService(): DomainApiService {
  return new InMemoryDomainApiService()
}

export function isDomainServiceError(error: unknown): error is DomainServiceError {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string' &&
    ((error as { details?: unknown }).details === undefined ||
      typeof (error as { details?: unknown }).details === 'object')
  )
}
