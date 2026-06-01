import { loadConfig, startServiceServer, webEnvSchema } from '@chatbot/shared'

import { createWebServer } from './server.js'

async function main(): Promise<void> {
  const env = loadConfig(webEnvSchema)
  const app = await createWebServer(env)
  await startServiceServer(app, env.WEB_PORT)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`${JSON.stringify({ event: 'web_startup_failed', error: message })}\n`)
  process.exit(1)
})
