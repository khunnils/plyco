import { describe, expect, it } from "vitest"

import {
  companyProfileSchema,
  dataHandlingProfileSchema,
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
      dataProcessingLevel: "limited",
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

  it("requires stored data types to include a name, sensitivity, and description", () => {
    const result = dataHandlingProfileSchema.safeParse({
      dataTypesStored: [
        {
          name: "customer emails",
          isSensitive: true,
          description: "Account contact and notification data",
        },
      ],
      storesPii: true,
      storesHealthcareData: false,
      encryptionAtRest: true,
      encryptionInTransit: true,
      productionDataInDevelopment: false,
      retentionPolicyExists: true,
    })

    expect(result.success).toBe(true)
  })
})
