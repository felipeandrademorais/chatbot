/**
 * Tools Package
 *
 * Tool adapters with allowlists and sandbox wrappers.
 * Implements the Tool interface from @chatbot/contracts.
 *
 * @module @chatbot/tools
 * @stage 05-integrations (full implementation)
 */
export const TOOLS_VERSION = '0.0.1' as const

export { AllowlistedToolAdapter } from './allowlisted-tool-adapter.js'

export {
  OllamaLocalAdapter,
  createDefaultOllamaClient,
  type OllamaAdapterOptions,
  type OllamaClient,
} from './ollama-local-adapter.js'

export { createOllamaModelContractFromEnv, type OllamaEnvConfig } from './ollama-config.js'

export {
  InMemoryProviderTelemetryStore,
  type ProviderTelemetryRecord,
  type ProviderTelemetryStore,
} from './provider-telemetry.js'
