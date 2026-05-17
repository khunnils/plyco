import { describe, expect, it } from "vitest"

import {
  authStateSchema,
  authUserSchema,
  companyProfileSchema,
  createOrganizationSchema,
  dataHandlingProfileSchema,
  vendorInputSchema,
  vendorCriticalitySchema,
  countryCodeSchema,
} from "./index.js"

describe("shared security profile schemas", () => {
  it("requires a company name and a positive employee count", () => {
    const result = companyProfileSchema.safeParse({
      companyName: "",
      legalEntityName: "",
      website: "",
      contactEmail: "",
      securityContactEmail: "",
      privacyContactEmail: "",
      country: "",
      address: "",
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
      category: "source_control",
      purpose: "Code hosting",
      countryOfRegistration: "US",
      hasSubprocessors: true,
      dataProcessingLevel: "limited",
      dataProcessed: ["source_code"],
      dpaStatus: "signed",
      dataRegions: ["us"],
      criticality: "high",
      owner: "Engineering",
      notes: "",
    })

    expect(result.success).toBe(true)
  })

  it("accepts authenticated user state", () => {
    expect(
      authStateSchema.safeParse({
        user: {
          id: "google-user-1",
          email: "founder@example.com",
          name: "Startup Founder",
          picture: "https://example.com/avatar.png",
        },
        organizations: [
          {
            id: "org_1",
            name: "Acme AI",
            role: "owner",
            createdAt: "2026-05-14T00:00:00.000Z",
            updatedAt: "2026-05-14T00:00:00.000Z",
          },
        ],
      }).success,
    ).toBe(true)
  })

  it("requires organization creation to include a name", () => {
    expect(createOrganizationSchema.safeParse({ name: "" }).success).toBe(false)
  })

  it("requires auth users to have a valid email", () => {
    expect(
      authUserSchema.safeParse({
        id: "google-user-1",
        email: "not-an-email",
        name: "Startup Founder",
      }).success,
    ).toBe(false)
  })

  it("limits vendor criticality to the supported readiness levels", () => {
    expect(vendorCriticalitySchema.safeParse("severe").success).toBe(false)
  })

  it("validates ISO alpha-2 country codes", () => {
    expect(countryCodeSchema.safeParse("US").success).toBe(true)
    expect(countryCodeSchema.safeParse("United States").success).toBe(false)
  })

  it("accepts rich stored data type details", () => {
    const result = dataHandlingProfileSchema.safeParse({
      dataTypesStored: [
        {
          name: "account_data",
          description: "Account contact and notification data",
          subjectTypes: ["customer"],
          purposes: ["account_management"],
          collectionMethods: ["account_signup"],
          legalBasis: ["contract"],
          retentionDays: 365,
          isSensitive: true,
          isRequired: true,
          sharedWithThirdParties: true,
          thirdParties: ["email delivery provider"],
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
