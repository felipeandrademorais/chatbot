/**
 * @module @chatbot/shared
 */
export const SHARED_VERSION = '0.1.0' as const

export {
  baseEnvSchema,
  gatewayEnvSchema,
  migrateEnvSchema,
  orchestratorEnvSchema,
  webEnvSchema,
  workerEnvSchema,
} from './config/env-schema.js'
export type {
  BaseEnv,
  GatewayEnv,
  MigrateEnv,
  OrchestratorEnv,
  WebEnv,
  WorkerEnv,
} from './config/env-schema.js'

export { ConfigValidationError, loadConfig } from './config/load-config.js'

export {
  checkHttpEndpoint,
  checkPostgres,
  checkRedis,
  computeFileChecksum,
  createReadinessCheck,
  resolveMigrationsDir,
} from './health/checks.js'

export { createServiceServer, startServiceServer } from './server/create-service-server.js'
export type {
  ServiceApp,
  ServiceServerOptions,
} from './server/create-service-server.js'
export { createInMemoryDomainApiService, isDomainServiceError } from './api/domain-api-service.js'
export type { DomainApiService, DomainServiceError } from './api/domain-api-service.js'

export {
  metricLabelPolicy,
  normalizeWorkflowId,
  telemetryCorrelationSchema,
  telemetryLogRecordSchema,
  traceContextSchema,
} from './telemetry/schema.js'
export {
  buildTraceHeaders,
  finishSpan,
  getRecentSpans,
  parseTelemetryContext,
  startSpan,
  TRACE_HEADERS,
} from './telemetry/tracing.js'
export {
  recordAgentExecution,
  recordHttpError,
  recordHttpRequest,
  renderPrometheusMetrics,
  setOllamaHealth,
  setQueueDepth,
} from './telemetry/metrics.js'
export {
  calculateOverheadPercent,
  isTelemetryOverheadWithinBudget,
} from './telemetry/overhead.js'

export { authorizeRequest, extractBearerToken } from './security/auth.js'
export type { AuthCheckResult, AuthFailureReason, AuthPolicy } from './security/auth.js'

export { runMigrations } from './migrations/run-migrations.js'
export type { MigrationFile, MigrationResult } from './migrations/run-migrations.js'

export { AggregateCache } from './scalability/cache-policy.js'
export { evaluatePerformanceSuite } from './scalability/performance.js'
export { deriveQueueTuning, estimateQueuePressure } from './scalability/queue-tuning.js'
export { executeWithGracefulDegradation } from './scalability/resilience.js'
export type {
  PerformanceSample,
  PerformanceSuiteResult,
} from './scalability/performance.js'
export type {
  QueueTuningInput,
  QueueTuningResult,
} from './scalability/queue-tuning.js'
export type {
  ResilienceExecutionResult,
  ResilienceOptions,
} from './scalability/resilience.js'
