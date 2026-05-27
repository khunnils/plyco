import path from "node:path"
import { fileURLToPath } from "node:url"

import { LangfuseSpanProcessor } from "@langfuse/otel"
import { NodeSDK } from "@opentelemetry/sdk-node"
import { config as loadDotenv } from "dotenv"

const apiDir = path.resolve(fileURLToPath(import.meta.url), "../../")
const repoRoot = path.resolve(apiDir, "../..")

loadDotenv({ path: path.join(repoRoot, ".env"), override: false, quiet: true })
loadDotenv({ path: path.join(apiDir, ".env"), override: true, quiet: true })

let sdk: NodeSDK | null = null

if (process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY) {
  sdk = new NodeSDK({
    spanProcessors: [new LangfuseSpanProcessor()],
  })
  sdk.start()
}

export async function shutdownInstrumentation() {
  await sdk?.shutdown()
}
