import { describe, expect, it } from "vitest"

import { providerNamesForSystem } from "@/features/company/lib/profile"

describe("provider profile display", () => {
  it("displays an explicit no-provider answer as None", () => {
    expect(
      providerNamesForSystem(
        [{ systemType: "password_manager", providerId: "none" }],
        [],
        "password_manager"
      )
    ).toBe("None")
  })
})
