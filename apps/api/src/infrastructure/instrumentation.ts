import { LangfuseSpanProcessor } from "@langfuse/otel"
import * as Sentry from "@sentry/node"
import { NodeSDK } from "@opentelemetry/sdk-node"
import { type FastifyInstance } from "fastify"
import "./env-loader.js"

let sdk: NodeSDK | null = null
let langfuseSpanProcessor: LangfuseSpanProcessor | null = null
let sentryEnabled = false

const colors = {
  gray: "\u001b[90m",
  green: "\u001b[32m",
  reset: "\u001b[0m",
  yellow: "\u001b[33m",
}

const langfuseExportMode =
  process.env.NODE_ENV === "production" ? "batched" : "immediate"

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE,
  })
  sentryEnabled = true
  info(
    {
      msg: "sentry error monitoring enabled",
      environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    },
  )
} else {
  warn(
    {
      msg: "sentry error monitoring disabled",
      missing: ["SENTRY_DSN"],
    },
  )
}

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
  info(
    {
      msg: "langfuse tracing enabled",
      baseUrl: process.env.LANGFUSE_BASE_URL ?? "https://cloud.langfuse.com",
      exportMode: langfuseExportMode,
    },
  )
} else {
  warn(
    {
      msg: "langfuse tracing disabled",
      missing: [
        process.env.LANGFUSE_PUBLIC_KEY ? null : "LANGFUSE_PUBLIC_KEY",
        process.env.LANGFUSE_SECRET_KEY ? null : "LANGFUSE_SECRET_KEY",
      ].filter(Boolean),
    },
  )
}

export async function shutdownInstrumentation() {
  if (sentryEnabled) {
    await Sentry.close(2000)
  }
  await sdk?.shutdown()
}

export async function flushInstrumentation() {
  if (sentryEnabled) {
    await Sentry.flush(2000)
  }
  await langfuseSpanProcessor?.forceFlush()
}

export function isInstrumentationEnabled() {
  return sentryEnabled || Boolean(langfuseSpanProcessor)
}

export function setupFastifyErrorInstrumentation(app: FastifyInstance) {
  if (!sentryEnabled) {
    return
  }

  Sentry.setupFastifyErrorHandler(app)
}

function info(record: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") {
    console.info(JSON.stringify(record))
    return
  }

  console.info(`${colors.green}${record.msg}${colors.reset}${details(record)}`)
}

function warn(record: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") {
    console.warn(JSON.stringify(record))
    return
  }

  console.warn(`${colors.yellow}${record.msg}${colors.reset}${details(record)}`)
}

function details(record: Record<string, unknown>) {
  const values = Object.entries(record)
    .filter(([key]) => key !== "msg")
    .map(([key, value]) => `${key}: ${formatDetail(value)}`)

  return values.length > 0 ? `${colors.gray} (${values.join(", ")})${colors.reset}` : ""
}

function formatDetail(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(", ")
  }

  return String(value)
}
