/**
 * @chatbot/contracts
 *
 * Shared API schemas, event schemas, and DTO definitions.
 * This package is the single source of truth for all inter-module contracts.
 *
 * All modules must import types from this package rather than
 * defining their own copies.
 *
 * @module @chatbot/contracts
 * @version 1.0.0
 */

// Message contracts
export type { Message, MessageMetadata, MessageRole, RetrievedDocument } from './message.js'

// Tool contracts
export type {
  StructuredToolInput,
  StructuredToolInputValue,
  Tool,
  ToolExecutionResult,
  ToolInvocationRequest,
  ToolInvocationResponse,
  ToolName,
} from './tool.js'
export { createToolName, validateToolInvocationRequest } from './tool.js'

// Security contracts (Stage 08)
export type {
  AuthorizationAction,
  AuthorizationMatrix,
  AuthRole,
  JwtClaims,
} from './security.js'
export {
  createAuthorizationMatrix,
  DEFAULT_AUTHORIZATION_MATRIX,
  isAuthorizationAction,
  isAuthRole,
  isJwtClaims,
} from './security.js'

// Provider contracts (Stage 05)
export type {
  ModelLifecycleOperation,
  ModelLifecycleResult,
  OllamaApprovedModel,
  OllamaModelContract,
  ProviderAdapter,
  ProviderError,
  ProviderErrorCode,
  ProviderFinishReason,
  ProviderName,
  ProviderRequest,
  ProviderResponse,
  ProviderUsageTelemetry,
} from './provider.js'
export {
  DEFAULT_OLLAMA_MODEL_CONTRACT,
  DEFAULT_PROVIDER_TIMEOUT_MS,
  MAX_PROVIDER_RETRIES,
  validateProviderRequest,
  validateProviderResponse,
} from './provider.js'

// Agent contracts
export type {
  Agent,
  AgentContext,
  AgentError,
  AgentInput,
  AgentMetadata,
  AgentNextAction,
  AgentResult,
  AgentUsage,
} from './agent.js'

// Health contracts (Stage 02)
export type {
  HealthStatus,
  LivenessResponse,
  ReadinessCheck,
  ReadinessResponse,
} from './health.js'
export { HEALTH_ROUTES } from './health.js'

// Workflow contracts
export type {
  RoutingEntry,
  RoutingTable,
  TaskId,
  WorkflowId,
  WorkflowJob,
  WorkflowStatus,
} from './workflow.js'
export { createTaskId, createWorkflowId } from './workflow.js'

// Telemetry contracts (Stage 07)
export type {
  TelemetryCorrelation,
  TelemetryLogRecord,
  TelemetryRoute,
  TraceContext,
  TraceSpanRecord,
} from './telemetry.js'
export { createTelemetryCorrelation, TELEMETRY_ROUTES } from './telemetry.js'

// Scalability contracts (Stage 09)
export type {
  CacheInvalidationContract,
  CachePolicyContract,
  LoadProfile,
  LoadProfileId,
  QueuePartitionContract,
  RateLimitContract,
  RetryPolicyContract,
  ScalabilityBudgets,
} from './scalability.js'
export {
  DEFAULT_CACHE_INVALIDATION_CONTRACTS,
  DEFAULT_CACHE_POLICIES,
  DEFAULT_LOAD_PROFILES,
  DEFAULT_QUEUE_PARTITION_CONTRACT,
  DEFAULT_RATE_LIMIT_POLICY,
  DEFAULT_RETRY_POLICY,
  DEFAULT_SCALABILITY_BUDGETS,
} from './scalability.js'

// Domain DTO contracts (Stage 03)
export type {
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
  DomainErrorPayload,
  StartWorkflowInput,
  StartWorkflowOutput,
} from './domain/index.js'
