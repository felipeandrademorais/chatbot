import type { OllamaModelContract } from '@chatbot/contracts'

export interface OllamaEnvConfig {
  readonly model: string
  readonly approvedModelsCsv: string
  readonly fallbackModel?: string
}

export function createOllamaModelContractFromEnv(config: OllamaEnvConfig): OllamaModelContract {
  const parsed = config.approvedModelsCsv
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)

  const modelNames = new Set(parsed)
  modelNames.add(config.model)

  const approvedModels = [...modelNames].map((name) => ({
    name,
    quantization: 'local',
    contextWindow: 8192,
  }))

  const orderedNames = [...modelNames]
  const fallbackModel =
    config.fallbackModel ??
    (orderedNames.includes(config.model) && orderedNames[0] !== config.model
      ? orderedNames.find((name) => name !== config.model)
      : undefined) ??
    config.model

  return {
    approvedModels,
    fallbackModel,
  }
}
