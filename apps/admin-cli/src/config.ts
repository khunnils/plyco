import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { parse } from "dotenv"

export type CliConfig = {
  apiKey: string
  apiUrl: string
  profile: string
}

export type CliConfigOptions = {
  cwd?: string
  env?: NodeJS.ProcessEnv
  profile?: string
}

export function readCliConfig({
  cwd = defaultProfileRoot(),
  env = process.env,
  profile = "local",
}: CliConfigOptions = {}): CliConfig {
  const profileEnv = readProfileEnv(cwd, profile)
  const apiUrl = env.PLYCO_API_URL ?? profileEnv.PLYCO_API_URL
  const apiKey = env.PLYCO_API_KEY ?? profileEnv.PLYCO_API_KEY
  const missing = [
    apiUrl ? null : "PLYCO_API_URL",
    apiKey ? null : "PLYCO_API_KEY",
  ].filter((name): name is string => Boolean(name))

  if (missing.length > 0) {
    throw new Error(
      `${missing.join(" and ")} ${missing.length === 1 ? "is" : "are"} required. Set ${missing.join(
        " and ",
      )} or add .plyco/${profile}.env.`,
    )
  }

  if (!apiKey || !apiUrl) {
    throw new Error("PLYCO_API_URL and PLYCO_API_KEY are required.")
  }

  return {
    apiKey,
    apiUrl,
    profile,
  }
}

function readProfileEnv(cwd: string, profile: string) {
  const filePath = path.join(cwd, ".plyco", `${profile}.env`)

  if (!fs.existsSync(filePath)) {
    return {}
  }

  return parse(fs.readFileSync(filePath))
}

function defaultProfileRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../")
}
