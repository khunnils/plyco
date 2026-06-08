import path from "node:path"
import { fileURLToPath } from "node:url"
import { config as loadDotenv } from "dotenv"

export function loadApiEnv() {
  const apiDir = path.resolve(fileURLToPath(import.meta.url), "../../../")
  const repoRoot = path.resolve(apiDir, "../..")

  loadDotenv({ path: path.join(repoRoot, ".env"), override: false, quiet: true })
  loadDotenv({ path: path.join(apiDir, ".env"), override: true, quiet: true })
}

loadApiEnv()
