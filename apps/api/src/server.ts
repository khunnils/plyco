import { shutdownInstrumentation } from "./infrastructure/instrumentation.js"
import { createApp } from "./app.js"
import { apiConfig } from "./config.js"

const app = await createApp({ logger: true })

const shutdown = async () => {
  await app.close()
  await shutdownInstrumentation()
}

process.once("SIGINT", () => {
  void shutdown().finally(() => process.exit(0))
})
process.once("SIGTERM", () => {
  void shutdown().finally(() => process.exit(0))
})

await app.listen({ port: apiConfig.port, host: apiConfig.host })
