import type { RetryPolicyContract } from '@chatbot/contracts'

export interface ResilienceExecutionResult<T> {
  readonly status: 'ok' | 'degraded' | 'failed'
  readonly attempts: number
  readonly value?: T
  readonly error?: string
}

export interface ResilienceOptions<T> {
  readonly policy: RetryPolicyContract
  readonly fallback: () => T
  readonly now?: () => number
  readonly sleep?: (ms: number) => Promise<void>
}

const defaultSleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

function normalizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

export async function executeWithGracefulDegradation<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  options: ResilienceOptions<T>,
): Promise<ResilienceExecutionResult<T>> {
  const sleep = options.sleep ?? defaultSleep
  const now = options.now ?? Date.now

  const maxAttempts = options.policy.maxRetries + 1
  const startedAt = now()

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController()
    const timeoutHandle = setTimeout(() => {
      controller.abort()
    }, options.policy.timeoutMs)

    try {
      const value = await operation(controller.signal)
      clearTimeout(timeoutHandle)
      return { status: 'ok', attempts: attempt, value }
    } catch (error) {
      clearTimeout(timeoutHandle)
      const finalAttempt = attempt === maxAttempts
      if (finalAttempt) {
        return {
          status: 'degraded',
          attempts: attempt,
          value: options.fallback(),
          error: normalizeError(error),
        }
      }

      const nextBackoff = Math.min(
        options.policy.maxBackoffMs,
        Math.max(1, options.policy.timeoutMs) *
          Math.pow(options.policy.backoffMultiplier, attempt - 1),
      )
      await sleep(nextBackoff)
    }
  }

  const elapsed = now() - startedAt
  return {
    status: 'failed',
    attempts: maxAttempts,
    error: `exhausted retries after ${String(elapsed)}ms`,
  }
}
