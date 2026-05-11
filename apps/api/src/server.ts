import { createApp } from "./app.js"
import { apiConfig } from "./config.js"

const app = await createApp({ logger: true })

await app.listen({ port: apiConfig.port, host: apiConfig.host })
