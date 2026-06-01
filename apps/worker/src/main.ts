import { loadConfig, startServiceServer, workerEnvSchema } from '@chatbot/shared'

import { createWorkerServer } from './server.js'

async function main(): Promise<void> {
  const env = loadConfig(workerEnvSchema)
  const app = await createWorkerServer(env)
  await startServiceServer(app, env.WORKER_PORT)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`${JSON.stringify({ event: 'worker_startup_failed', error: message })}\n`)
  process.exit(1)
})
