import {
  DEFAULT_CACHE_INVALIDATION_CONTRACTS,
  DEFAULT_CACHE_POLICIES,
  DEFAULT_RETRY_POLICY,
  validateProviderRequest,
  type ProviderRequest,
  type ProviderResponse,
} from '@chatbot/contracts'
import {
  checkPostgres,
  checkRedis,
  createServiceServer,
  executeWithGracefulDegradation,
  setOllamaHealth,
  type ServiceApp,
  type WorkerEnv,
} from '@chatbot/shared'
import {
  createDefaultOllamaClient,
  createOllamaModelContractFromEnv,
  InMemoryProviderTelemetryStore,
  OllamaLocalAdapter,
} from '@chatbot/tools'

function createWorkerOllamaAdapter(env: WorkerEnv): OllamaLocalAdapter {
  const skipLifecycleInTest = env.NODE_ENV === 'test'

  return new OllamaLocalAdapter({
    client: createDefaultOllamaClient(env.OLLAMA_BASE_URL),
    telemetryStore: new InMemoryProviderTelemetryStore(),
    modelContract: createOllamaModelContractFromEnv({
      model: env.OLLAMA_MODEL,
      approvedModelsCsv: env.OLLAMA_APPROVED_MODELS,
      ...(env.OLLAMA_FALLBACK_MODEL !== undefined
        ? { fallbackModel: env.OLLAMA_FALLBACK_MODEL }
        : {}),
    }),
    skipPull: env.OLLAMA_SKIP_PULL === true || skipLifecycleInTest,
    skipWarmup: env.OLLAMA_SKIP_WARMUP === true || skipLifecycleInTest,
    timeoutMs: env.RETRY_TIMEOUT_MS,
    maxRetries: env.RETRY_MAX_RETRIES,
    retryDelayMs: 1,
  })
}

function resolveProviderRequest(body: unknown, defaultModel: string): ProviderRequest | null {
  if (!isRecord(body)) {
    return null
  }

  const model =
    typeof body.model === 'string' && body.model.trim().length > 0 ? body.model : defaultModel
  const candidate = { ...body, model }

  if (!validateProviderRequest(candidate)) {
    return null
  }

  return candidate
}

export async function createWorkerServer(env: WorkerEnv): Promise<ServiceApp> {
  const ollamaAdapter = createWorkerOllamaAdapter(env)

  return createServiceServer({
    serviceName: 'worker',
    logLevel: env.LOG_LEVEL,
    readinessChecks: async () => ({
      postgres: await checkPostgres(env),
      redis: await checkRedis(env),
    }),
    registerRoutes: (app) => {
      app.get('/internal/scalability/cache-policy', () => ({
        cachePolicies: DEFAULT_CACHE_POLICIES.map((policy) => ({
          ...policy,
          ttlMs: env.CACHE_DEFAULT_TTL_MS,
          staleWhileRevalidateMs: env.CACHE_STALE_REVALIDATE_MS,
        })),
        invalidation: DEFAULT_CACHE_INVALIDATION_CONTRACTS,
      }))

      app.get('/internal/provider/health', async () => {
        const result = await ollamaAdapter.healthCheck()
        setOllamaHealth('worker', result.success)
        return result
      })

      app.post('/internal/provider/generate', async (request, reply) => {
        const providerRequest = resolveProviderRequest(request.body, env.OLLAMA_MODEL)
        if (providerRequest === null) {
          return reply.code(400).send({ error: 'invalid_provider_request' })
        }

        try {
          const response = await ollamaAdapter.generate(providerRequest)
          setOllamaHealth('worker', true)
          return response
        } catch (error: unknown) {
          setOllamaHealth('worker', false)
          const message = error instanceof Error ? error.message : String(error)
          return reply.code(503).send({ error: 'provider_unavailable', message })
        }
      })

      app.get('/internal/scalability/ollama-resilience', async () => {
        const probeRequest: ProviderRequest = {
          requestId: 'ollama-resilience-probe',
          workflowId: 'wf-ollama-resilience',
          model: env.OLLAMA_MODEL,
          prompt: 'ping',
          maxOutputTokens: 1,
        }

        type OllamaResilienceValue =
          | ProviderResponse
          | { readonly message: string; readonly provider: 'fallback' }

        const result = await executeWithGracefulDegradation<OllamaResilienceValue>(
          async () => ollamaAdapter.generate(probeRequest),
          {
            policy: {
              ...DEFAULT_RETRY_POLICY,
              timeoutMs: env.RETRY_TIMEOUT_MS,
              maxRetries: env.RETRY_MAX_RETRIES,
              backoffMultiplier: env.RETRY_BACKOFF_MULTIPLIER,
              maxBackoffMs: env.RETRY_MAX_BACKOFF_MS,
            },
            fallback: () => ({ message: 'degraded response', provider: 'fallback' as const }),
            sleep: () => Promise.resolve(),
          },
        )

        if (result.status === 'ok') {
          setOllamaHealth('worker', true)
        } else {
          setOllamaHealth('worker', false)
        }

        return result
      })
    },
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
