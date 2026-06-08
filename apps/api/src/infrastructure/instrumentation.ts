import { LangfuseSpanProcessor } from "@langfuse/otel"
import { NodeSDK } from "@opentelemetry/sdk-node"
import "./env-loader.js"

let sdk: NodeSDK | null = null
let langfuseSpanProcessor: LangfuseSpanProcessor | null = null

const langfuseExportMode =
  process.env.NODE_ENV === "production" ? "batched" : "immediate"

if (process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY) {
  langfuseSpanProcessor = new LangfuseSpanProcessor({
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    baseUrl: process.env.LANGFUSE_BASE_URL,
    exportMode: langfuseExportMode,
    flushAt: process.env.NODE_ENV === "production" ? undefined : 1,
    flushInterval: process.env.NODE_ENV === "production" ? undefined : 1,
  })
  sdk = new NodeSDK({
    spanProcessors: [langfuseSpanProcessor],
  })
  sdk.start()
  console.info(
    JSON.stringify({
      msg: "langfuse tracing enabled",
      baseUrl: process.env.LANGFUSE_BASE_URL ?? "https://cloud.langfuse.com",
      exportMode: langfuseExportMode,
    }),
  )
} else {
  console.warn(
    JSON.stringify({
      msg: "langfuse tracing disabled",
      missing: [
        process.env.LANGFUSE_PUBLIC_KEY ? null : "LANGFUSE_PUBLIC_KEY",
        process.env.LANGFUSE_SECRET_KEY ? null : "LANGFUSE_SECRET_KEY",
      ].filter(Boolean),
    }),
  )
}

export async function shutdownInstrumentation() {
  await sdk?.shutdown()
}

export async function flushInstrumentation() {
  await langfuseSpanProcessor?.forceFlush()
}

export function isInstrumentationEnabled() {
  return Boolean(langfuseSpanProcessor)
}
