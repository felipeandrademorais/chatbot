import { gatewayEnvSchema, loadConfig, startServiceServer } from '@chatbot/shared'

import { createGatewayServer } from './server.js'

async function main(): Promise<void> {
  const env = loadConfig(gatewayEnvSchema)
  const app = await createGatewayServer(env)
  await startServiceServer(app, env.GATEWAY_PORT)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`${JSON.stringify({ event: 'gateway_startup_failed', error: message })}\n`)
  process.exit(1)
})
