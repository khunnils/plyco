#!/usr/bin/env node
import { spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const cliRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const tsxExecutable = process.platform === "win32" ? "tsx.cmd" : "tsx"
const tsxPath = path.join(cliRoot, "node_modules", ".bin", tsxExecutable)
const entrypoint = path.join(cliRoot, "src", "index.ts")

const result = spawnSync(tsxPath, [entrypoint, ...process.argv.slice(2)], {
  stdio: "inherit",
})

if (result.error) {
  throw result.error
}

process.exit(result.status ?? 1)
