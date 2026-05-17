import { config as loadDotenv } from "dotenv"

import { apiConfig } from "../config.js"
import { loadCodesFromAirtable } from "../code-loader.js"

loadDotenv({ path: ".env", override: false })
loadDotenv({ path: "apps/api/.env", override: true })

const [, , command, subcommand] = process.argv

if (command !== "codes" || subcommand !== "load") {
  console.error("Usage: pnpm plyco codes load")
  process.exit(1)
}

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
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
