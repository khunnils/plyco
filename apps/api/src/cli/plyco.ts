import { config as loadDotenv } from "dotenv"

import { apiConfig } from "../config.js"
import { ApiError } from "../infrastructure/errors.js"
import { loadCodesFromAirtable } from "../infrastructure/code-loader.js"

loadDotenv({ path: ".env", override: false, quiet: true })
loadDotenv({ path: "apps/api/.env", override: true, quiet: true })

const [, , command, subcommand] = process.argv

const usage = () => {
  console.error(
    [
      "Usage:",
      "  pnpm plyco codes load",
      "  pnpm plyco providers lookup --url <url>",
      "  pnpm plyco providers import --url <url>",
    ].join("\n"),
  )
}

if (command === "codes" && subcommand === "load") {
  if (!apiConfig.airtableBase || !apiConfig.airtableApiKey) {
    console.error("AIRTABLE_BASE and AIRTABLE_API_KEY are required.")
    process.exit(1)
  }

  try {
    const result = await loadCodesFromAirtable({
      apiKey: apiConfig.airtableApiKey,
      baseId: apiConfig.airtableBase,
    })

    console.log(
      `Loaded ${result.codeSetCount} code sets, ${result.codeCount} codes, and ${result.countryCount} countries.`,
    )
  } catch (error) {
    printError(error)
  }

  process.exit(0)
}

if (command === "providers" && (subcommand === "lookup" || subcommand === "import")) {
  const inputUrl = providerUrlFromArgs(process.argv.slice(4))

  if (!inputUrl) {
    usage()
    process.exit(1)
  }

  if (!apiConfig.apiKey) {
    console.error("PLYCO_API_KEY is required.")
    process.exit(1)
  }

  try {
    const response = await postProviderCommand(
      subcommand,
      inputUrl,
      apiConfig.apiKey,
    )
    const body = await readJsonResponse(response)

    if (!response.ok) {
      printStructuredApiError(body)
    }

    console.log(JSON.stringify(body, null, 2))
  } catch (error) {
    printError(error)
  }

  process.exit(0)
}

usage()
process.exit(1)

function printStructuredApiError(body: unknown): never {
  if (
    typeof body === "object" &&
    body &&
    "error" in body &&
    typeof body.error === "object" &&
    body.error
  ) {
    console.error(JSON.stringify(body.error, null, 2))
  } else {
    console.error(JSON.stringify(body, null, 2))
  }

  process.exit(1)
}

function providerUrlFromArgs(args: string[]) {
  const urlFlagIndex = args.indexOf("--url")

  if (urlFlagIndex >= 0) {
    return args[urlFlagIndex + 1] ?? ""
  }

  return args[0] ?? ""
}

async function postProviderCommand(
  subcommand: "lookup" | "import",
  inputUrl: string,
  apiKey: string,
) {
  const urls = Array.from(
    new Set(
      [
        apiConfig.cliApiUrl,
        process.env.API_PUBLIC_URL && process.env.API_PUBLIC_URL !== apiConfig.cliApiUrl
          ? process.env.API_PUBLIC_URL
          : null,
      ].filter((url): url is string => Boolean(url)),
    ),
  )
  let lastError: unknown

  for (const apiUrl of urls) {
    try {
      return await fetch(new URL(`/providers/${subcommand}`, apiUrl), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputUrl }),
      })
    } catch (error) {
      lastError = error
    }
  }

  throw new Error(
    `Could not reach Plyco API at ${urls.join(" or ")}. Start the API or set PLYCO_API_URL to the running API URL.`,
    { cause: lastError },
  )
}

async function readJsonResponse(response: Response) {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new Error(
      `Plyco API returned non-JSON response with status ${response.status}: ${text.slice(0, 500)}`,
    )
  }
}

function printError(error: unknown): never {
  if (error instanceof ApiError && error.details) {
    console.error(error.message, error.details)
  } else if (error instanceof Error) {
    console.error(error.message)

    if (error.cause instanceof Error) {
      console.error(error.cause.message)
    }
  } else {
    console.error(error)
  }

  process.exit(1)
}
