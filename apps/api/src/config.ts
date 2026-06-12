import "./infrastructure/env-loader.js"

function readPort(value: string | undefined) {
  const port = Number(value ?? 4000)

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("PORT must be a positive integer")
  }

  return port
}

export type AuthConfig = {
  apiPublicUrl: string
  clientUrl: string
  webUrl: string
  googleClientId: string
  googleClientSecret: string
  sessionKey: string
  cookieSecure: boolean
  cookieSameSite: "lax" | "none"
}

function readRequired(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`${name} is required when authentication is enabled`)
  }

  return value
}

export function readAuthConfig(env: NodeJS.ProcessEnv = process.env): AuthConfig {
  const sessionKey = readRequired(env.SESSION_KEY, "SESSION_KEY")

  if (sessionKey.length < 32) {
    throw new Error("SESSION_KEY must be at least 32 characters")
  }

  const isProduction = env.NODE_ENV === "production"

  return {
    apiPublicUrl: readRequired(env.API_PUBLIC_URL, "API_PUBLIC_URL"),
    clientUrl: readRequired(env.CLIENT_URL, "CLIENT_URL"),
    webUrl: readRequired(env.WEB_URL, "WEB_URL"),
    googleClientId: readRequired(
      env.GOOGLE_OAUTH_CLIENT_ID,
      "GOOGLE_OAUTH_CLIENT_ID",
    ),
    googleClientSecret: readRequired(
      env.GOOGLE_OAUTH_CLIENT_SECRET,
      "GOOGLE_OAUTH_CLIENT_SECRET",
    ),
    sessionKey,
    cookieSecure: isProduction,
    cookieSameSite: isProduction ? "none" : "lax",
  }
}

export const apiConfig = {
  host: process.env.HOST ?? "0.0.0.0",
  port: readPort(process.env.PORT),
  airtableBase: process.env.AIRTABLE_BASE,
  airtableApiKey: process.env.AIRTABLE_API_KEY,
  apiKey: process.env.PLYCO_API_KEY,
  cliApiUrl:
    process.env.PLYCO_API_URL ??
    process.env.API_PUBLIC_URL ??
    "http://localhost:4000",
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiProviderLookupModel:
    process.env.GEMINI_PROVIDER_LOOKUP_MODEL ?? "gemini-2.5-flash",
  organizationLookupModel:
    process.env.ORGANIZATION_LOOKUP_MODEL ?? "gemini-flash-latest",
  langfusePublicKey: process.env.LANGFUSE_PUBLIC_KEY,
  langfuseSecretKey: process.env.LANGFUSE_SECRET_KEY,
  langfuseBaseUrl: process.env.LANGFUSE_BASE_URL,
  documentPdfBucket: process.env.DOCUMENT_PDF_BUCKET ?? "plyco-public",
  gcpProjectId: process.env.GCP_PROJECT_ID ?? "plyco-prod",
  auth: () => readAuthConfig(),
}
