import {
  checkPostgres,
  checkRedis,
  createServiceServer,
  deriveQueueTuning,
  type OrchestratorEnv,
  type ServiceApp,
} from '@chatbot/shared'

export async function createOrchestratorServer(env: OrchestratorEnv): Promise<ServiceApp> {
  const partitionKeys = env.QUEUE_PARTITION_KEYS.split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
  const queueTuning = deriveQueueTuning({
    targetTps: env.WORKER_TARGET_TPS,
    averageJobLatencyMs: env.WORKER_AVERAGE_JOB_LATENCY_MS,
    partitionKeys,
    maxConcurrency: env.WORKER_MAX_CONCURRENCY,
    maxInFlightPerPartition: env.QUEUE_MAX_IN_FLIGHT_PER_PARTITION,
  })

  return createServiceServer({
    serviceName: 'orchestrator',
    logLevel: env.LOG_LEVEL,
    readinessChecks: async () => ({
      postgres: await checkPostgres(env),
      redis: await checkRedis(env),
    }),
    registerRoutes: (app) => {
      app.get('/internal/scalability/queue-tuning', () => ({
        queueTuning,
      }))
    },
  })
}
