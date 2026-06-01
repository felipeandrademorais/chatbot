import { z } from 'zod'

const logLevelSchema = z.enum(['debug', 'info', 'warn', 'error'])
const nodeEnvSchema = z.enum(['development', 'test', 'production'])

export const baseEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema.default('development'),
  LOG_LEVEL: logLevelSchema.default('info'),
  POSTGRES_HOST: z.string().min(1),
  POSTGRES_PORT: z.coerce.number().int().positive(),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1, 'POSTGRES_PASSWORD is required'),
  POSTGRES_DB: z.string().min(1),
  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number().int().positive(),
})

export type BaseEnv = z.infer<typeof baseEnvSchema>

export const gatewayEnvSchema = baseEnvSchema.extend({
  GATEWAY_PORT: z.coerce.number().int().positive().default(3000),
  ORCHESTRATOR_URL: z.string().url(),
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters for HS256 signing key strength'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(1_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_BURST_ALLOWANCE: z.coerce.number().int().nonnegative().default(30),
  RETRY_TIMEOUT_MS: z.coerce.number().int().positive().default(3_000),
  RETRY_MAX_RETRIES: z.coerce.number().int().nonnegative().max(2).default(2),
  RETRY_BACKOFF_MULTIPLIER: z.coerce.number().positive().default(2),
  RETRY_MAX_BACKOFF_MS: z.coerce.number().int().positive().default(8_000),
})

export type GatewayEnv = z.infer<typeof gatewayEnvSchema>

export const orchestratorEnvSchema = baseEnvSchema.extend({
  ORCHESTRATOR_PORT: z.coerce.number().int().positive().default(3001),
  WORKER_TARGET_TPS: z.coerce.number().int().positive().default(40),
  WORKER_AVERAGE_JOB_LATENCY_MS: z.coerce.number().int().positive().default(150),
  WORKER_MAX_CONCURRENCY: z.coerce.number().int().positive().default(32),
  QUEUE_PARTITION_KEYS: z.string().min(1).default('workflowId,taskType'),
  QUEUE_MAX_IN_FLIGHT_PER_PARTITION: z.coerce.number().int().positive().default(8),
})

export type OrchestratorEnv = z.infer<typeof orchestratorEnvSchema>

export const workerEnvSchema = baseEnvSchema.extend({
  WORKER_PORT: z.coerce.number().int().positive().default(3002),
  CACHE_DEFAULT_TTL_MS: z.coerce.number().int().positive().default(30_000),
  CACHE_STALE_REVALIDATE_MS: z.coerce.number().int().nonnegative().default(5_000),
  RETRY_TIMEOUT_MS: z.coerce.number().int().positive().default(3_000),
  RETRY_MAX_RETRIES: z.coerce.number().int().nonnegative().max(2).default(2),
  RETRY_BACKOFF_MULTIPLIER: z.coerce.number().positive().default(2),
  RETRY_MAX_BACKOFF_MS: z.coerce.number().int().positive().default(8_000),
  OLLAMA_BASE_URL: z.string().url().default('http://127.0.0.1:11434'),
  OLLAMA_MODEL: z.string().min(1).default('gemma4:e2b'),
  OLLAMA_APPROVED_MODELS: z.string().min(1).default('gemma4:e2b,gemma4:e4b'),
  OLLAMA_FALLBACK_MODEL: z.string().min(1).optional(),
  OLLAMA_SKIP_PULL: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  OLLAMA_SKIP_WARMUP: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
})

export type WorkerEnv = z.infer<typeof workerEnvSchema>

export const webEnvSchema = baseEnvSchema.extend({
  WEB_PORT: z.coerce.number().int().positive().default(3003),
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters for HS256 signing key strength'),
  WORKFLOW_API_BASE_URL: z.string().url().default('http://localhost:3000'),
})

export type WebEnv = z.infer<typeof webEnvSchema>

export const migrateEnvSchema = baseEnvSchema.pick({
  NODE_ENV: true,
  LOG_LEVEL: true,
  POSTGRES_HOST: true,
  POSTGRES_PORT: true,
  POSTGRES_USER: true,
  POSTGRES_PASSWORD: true,
  POSTGRES_DB: true,
})

export type MigrateEnv = z.infer<typeof migrateEnvSchema>
