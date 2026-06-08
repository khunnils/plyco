import path from "node:path"
import { fileURLToPath } from "node:url"
import { config as loadDotenv } from "dotenv"

export function parseEnvName(argv: string[]): string | null {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === undefined) {
      continue
    }
    if (arg === "--env" && i + 1 < argv.length) {
      return argv[i + 1] ?? null
    } else if (arg.startsWith("--env=")) {
      return arg.substring(6)
    }
  }
  return null
}

export function loadEnv(argv: string[] = process.argv) {
  const envName = parseEnvName(argv)
  const envSuffix = envName ? `.${envName}` : ""
  const envFile = `.env${envSuffix}`

  const apiDir = path.resolve(fileURLToPath(import.meta.url), "../../../")
  const repoRoot = path.resolve(apiDir, "../..")

  loadDotenv({ path: path.join(repoRoot, envFile), override: false, quiet: true })
  loadDotenv({ path: path.join(apiDir, envFile), override: true, quiet: true })

  if (envName && !process.env.NODE_ENV) {
    process.env.NODE_ENV = envName
  }
}

// Auto-run environment loading on import to ensure configs are populated properly
loadEnv()

export function getFilteredArgs(argv: string[] = process.argv): string[] {
  const filtered: string[] = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === undefined) {
      continue
    }
    if (arg === "--env") {
      i++ // Skip value
    } else if (arg.startsWith("--env=")) {
      // Skip it
    } else {
      filtered.push(arg)
    }
  }
  return filtered
}
