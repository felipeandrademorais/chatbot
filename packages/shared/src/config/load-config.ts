import type { z } from 'zod'

export class ConfigValidationError extends Error {
  constructor(
    message: string,
    readonly issues: z.ZodIssue[],
  ) {
    super(message)
    this.name = 'ConfigValidationError'
  }
}

export function loadConfig<T extends z.ZodTypeAny>(
  schema: T,
  source: NodeJS.ProcessEnv = process.env,
): z.infer<T> {
  const result = schema.safeParse(source)
  if (!result.success) {
    const summary = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')
    throw new ConfigValidationError(`Invalid environment configuration: ${summary}`, result.error.issues)
  }
  return result.data as z.infer<T>
}
