import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    exclude: ["dist/**", "node_modules/**"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@plyco/contracts": path.resolve(
        __dirname,
        "../../packages/contracts/src/index.ts"
      ),
      "@plyco/db": path.resolve(
        __dirname,
        "../../packages/db/src/index.ts"
      ),
    },
  },
})
