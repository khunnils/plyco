import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import { afterEach, describe, expect, it } from "vitest"

import { readCliConfig } from "./config.js"

const tempDirs: string[] = []

afterEach(() => {
  for (const tempDir of tempDirs.splice(0)) {
    fs.rmSync(tempDir, { force: true, recursive: true })
  }
})

describe("readCliConfig", () => {
  it("loads profile config from .plyco/<profile>.env", () => {
    const cwd = createProfile("production", {
      PLYCO_API_KEY: "profile-key",
      PLYCO_API_URL: "https://api.example.com",
    })

    expect(readCliConfig({ cwd, env: {}, profile: "production" })).toEqual({
      apiKey: "profile-key",
      apiUrl: "https://api.example.com",
      profile: "production",
    })
  })

  it("lets direct environment values override profile values", () => {
    const cwd = createProfile("production", {
      PLYCO_API_KEY: "profile-key",
      PLYCO_API_URL: "https://api.example.com",
    })

    expect(
      readCliConfig({
        cwd,
        env: {
          PLYCO_API_KEY: "env-key",
          PLYCO_API_URL: "https://env.example.com",
        },
        profile: "production",
      }),
    ).toEqual({
      apiKey: "env-key",
      apiUrl: "https://env.example.com",
      profile: "production",
    })
  })

  it("rejects missing URL and key", () => {
    expect(() => readCliConfig({ cwd: createTempDir(), env: {}, profile: "local" }))
      .toThrow(/PLYCO_API_URL and PLYCO_API_KEY are required/)
  })
})

function createProfile(profile: string, values: Record<string, string>) {
  const cwd = createTempDir()
  const profileDir = path.join(cwd, ".plyco")

  fs.mkdirSync(profileDir)
  fs.writeFileSync(
    path.join(profileDir, `${profile}.env`),
    Object.entries(values)
      .map(([key, value]) => `${key}=${value}`)
      .join("\n"),
  )

  return cwd
}

function createTempDir() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "plyco-cli-"))
  tempDirs.push(tempDir)

  return tempDir
}
