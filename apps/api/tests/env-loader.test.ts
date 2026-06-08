import { describe, expect, it, vi, beforeEach } from "vitest"

const { mockConfig } = vi.hoisted(() => ({
  mockConfig: vi.fn(),
}))

vi.mock("dotenv", () => ({
  config: (options?: any) => mockConfig(options),
}))

import { parseEnvName, getFilteredArgs, loadEnv } from "../src/infrastructure/env-loader.js"

describe("env-loader", () => {
  beforeEach(() => {
    mockConfig.mockClear()
  })

  describe("parseEnvName", () => {
    it("returns null if no env argument is provided", () => {
      expect(parseEnvName(["node", "script.js", "codes", "load"])).toBeNull()
    })

    it("parses env from space-separated option", () => {
      expect(parseEnvName(["node", "script.js", "--env", "production"])).toBe("production")
      expect(parseEnvName(["node", "script.js", "codes", "load", "--env", "test"])).toBe("test")
    })

    it("parses env from equals-separated option", () => {
      expect(parseEnvName(["node", "script.js", "--env=production"])).toBe("production")
      expect(parseEnvName(["node", "script.js", "codes", "load", "--env=test"])).toBe("test")
    })
  })

  describe("getFilteredArgs", () => {
    it("returns unmodified args if no env flags are present", () => {
      const input = ["node", "script.js", "codes", "load"]
      expect(getFilteredArgs(input)).toEqual(input)
    })

    it("filters out space-separated env flags", () => {
      const input = ["node", "script.js", "codes", "load", "--env", "test"]
      expect(getFilteredArgs(input)).toEqual(["node", "script.js", "codes", "load"])
    })

    it("filters out equals-separated env flags", () => {
      const input = ["node", "script.js", "--env=production", "codes", "load"]
      expect(getFilteredArgs(input)).toEqual(["node", "script.js", "codes", "load"])
    })
  })

  describe("loadEnv", () => {
    it("loads default .env files if no env flag is present", () => {
      loadEnv(["node", "script.js"])
      expect(mockConfig).toHaveBeenCalledTimes(2)
      expect(mockConfig.mock.calls[0][0].path).toMatch(/\.env$/)
      expect(mockConfig.mock.calls[1][0].path).toMatch(/\.env$/)
    })

    it("loads test environment files if --env=test is present", () => {
      loadEnv(["node", "script.js", "--env=test"])
      expect(mockConfig).toHaveBeenCalledTimes(2)
      expect(mockConfig.mock.calls[0][0].path).toMatch(/\.env\.test$/)
      expect(mockConfig.mock.calls[1][0].path).toMatch(/\.env\.test$/)
    })

    it("loads production environment files if --env production is present", () => {
      loadEnv(["node", "script.js", "--env", "production"])
      expect(mockConfig).toHaveBeenCalledTimes(2)
      expect(mockConfig.mock.calls[0][0].path).toMatch(/\.env\.production$/)
      expect(mockConfig.mock.calls[1][0].path).toMatch(/\.env\.production$/)
    })
  })
})
