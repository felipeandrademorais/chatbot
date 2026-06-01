import { loadConfig, orchestratorEnvSchema, startServiceServer } from '@chatbot/shared'

import { createOrchestratorServer } from './server.js'

async function main(): Promise<void> {
  const env = loadConfig(orchestratorEnvSchema)
  const app = await createOrchestratorServer(env)
  await startServiceServer(app, env.ORCHESTRATOR_PORT)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`${JSON.stringify({ event: 'orchestrator_startup_failed', error: message })}\n`)
  process.exit(1)
})
