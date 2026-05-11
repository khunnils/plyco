import path from "node:path"
import { fileURLToPath } from "node:url"

import { config as loadDotenv } from "dotenv"

const apiDir = path.resolve(fileURLToPath(import.meta.url), "../../")
const repoRoot = path.resolve(apiDir, "../..")

loadDotenv({ path: path.join(repoRoot, ".env"), override: false })
loadDotenv({ path: path.join(apiDir, ".env"), override: true })

function readPort(value: string | undefined) {
  const port = Number(value ?? 4000)

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("PORT must be a positive integer")
  }

  return port
}

export const apiConfig = {
  host: process.env.HOST ?? "0.0.0.0",
  port: readPort(process.env.PORT),
}
