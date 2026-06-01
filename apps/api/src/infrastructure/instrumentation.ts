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
let langfuseSpanProcessor: LangfuseSpanProcessor | null = null

if (process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY) {
  langfuseSpanProcessor = new LangfuseSpanProcessor({
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    baseUrl: process.env.LANGFUSE_BASE_URL,
    exportMode:
      process.env.NODE_ENV === "production" ? "batched" : "immediate",
  })
  sdk = new NodeSDK({
    spanProcessors: [langfuseSpanProcessor],
  })
  sdk.start()
}

export async function shutdownInstrumentation() {
  await sdk?.shutdown()
}

export async function flushInstrumentation() {
  await langfuseSpanProcessor?.forceFlush()
}
