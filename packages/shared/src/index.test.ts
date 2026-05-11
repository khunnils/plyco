import { describe, expect, it } from "vitest"

import {
  companyProfileSchema,
  vendorInputSchema,
  vendorCriticalitySchema,
} from "./index.js"

describe("shared security profile schemas", () => {
  it("requires a company name and a positive employee count", () => {
    const result = companyProfileSchema.safeParse({
      companyName: "",
      employeeCount: 0,
      industries: [],
      regions: [],
      handlesPii: false,
      handlesSensitiveData: false,
      complianceGoals: [],
    })

    expect(result.success).toBe(false)
  })

  it("requires operational vendor fields", () => {
    const result = vendorInputSchema.safeParse({
      name: "GitHub",
      category: "Source control",
      purpose: "Code hosting",
      hasSubprocessors: true,
      dataProcessed: ["source code"],
      dpaStatus: "signed",
      dataRegions: ["US"],
      criticality: "high",
      owner: "Engineering",
      notes: "",
    })

    expect(result.success).toBe(true)
  })

  it("limits vendor criticality to the supported readiness levels", () => {
    expect(vendorCriticalitySchema.safeParse("severe").success).toBe(false)
  })
})
