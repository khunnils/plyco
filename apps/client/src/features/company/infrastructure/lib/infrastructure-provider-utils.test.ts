import { describe, expect, it } from "vitest"

import {
  infrastructureSystemTypes,
  updateInfrastructureProviderSelection,
} from "@/features/company/infrastructure/lib/infrastructure-provider-utils"

describe("infrastructure provider selections", () => {
  it.each(infrastructureSystemTypes)(
    "preserves an explicit none answer for %s",
    (systemType) => {
      expect(
        updateInfrastructureProviderSelection([], systemType, ["none"])
      ).toEqual([{ systemType, providerId: "none" }])
    }
  )

  it("switches between none, real providers, and unanswered", () => {
    const explicitNone = updateInfrastructureProviderSelection(
      [],
      "password_manager",
      ["none"]
    )
    const selectedProvider = updateInfrastructureProviderSelection(
      explicitNone,
      "password_manager",
      ["none", "prov-1password"]
    )
    const unanswered = updateInfrastructureProviderSelection(
      selectedProvider,
      "password_manager",
      []
    )

    expect(selectedProvider).toEqual([
      { systemType: "password_manager", providerId: "prov-1password" },
    ])
    expect(unanswered).toEqual([])
  })
})
