import { shutdownInstrumentation } from "./infrastructure/instrumentation.js"
import { createApp } from "./app.js"
import { apiConfig } from "./config.js"
import { createApiLogger } from "./infrastructure/logger.js"

const app = await createApp({ logger: createApiLogger() })

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
