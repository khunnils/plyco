import { describe, expect, it } from "vitest"

import {
  authStateSchema,
  authUserSchema,
  companyProfileSchema,
  createOrganizationSchema,
  dataHandlingProfileSchema,
  emptyPrivacyProfile,
  emptyServiceProfile,
  privacyProfileSchema,
  providerSystemTypeSchema,
  serviceProfileSchema,
  templateInputSchema,
  templateSchema,
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
          purposes: "account_management",
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

  it("accepts blank template policy metadata defaults", () => {
    expect(
      templateSchema.safeParse({
        id: "template_1",
        organizationId: "org_1",
        name: "Privacy Policy",
        slug: "privacy-policy",
        sourceSystemTemplateSlug: "privacy-policy",
        content: "# Privacy Policy\n",
        createdAt: "2026-05-14T00:00:00.000Z",
        updatedAt: "2026-05-14T00:00:00.000Z",
      }).success,
    ).toBe(true)
  })

  it("accepts the empty service profile defaults", () => {
    const result = serviceProfileSchema.safeParse(emptyServiceProfile)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        serviceName: "",
        serviceDescription: "",
        serviceUrl: "",
        audiences: [],
        userTypes: [],
        customerTypes: [],
        availabilityRegions: [],
        childrenDirected: false,
        minimumUserAge: 0,
      })
    }
  })

  it("accepts a populated service profile with code-array fields", () => {
    const result = serviceProfileSchema.safeParse({
      serviceName: "Acme AI Platform",
      serviceDescription: "Customer security review automation",
      serviceUrl: "https://app.acme.example",
      audiences: ["businesses", "developers"],
      userTypes: ["workspace_admins", "end_users"],
      customerTypes: ["smb", "mid_market"],
      availabilityRegions: ["us", "eu"],
      childrenDirected: false,
      minimumUserAge: 13,
    })

    expect(result.success).toBe(true)
  })

  it("rejects service profile code array values that violate the code id format", () => {
    const result = serviceProfileSchema.safeParse({
      ...emptyServiceProfile,
      audiences: ["Invalid Audience"],
    })

    expect(result.success).toBe(false)
  })

  it("rejects negative minimum user age values", () => {
    const result = serviceProfileSchema.safeParse({
      ...emptyServiceProfile,
      minimumUserAge: -1,
    })

    expect(result.success).toBe(false)
  })

  it("accepts the empty privacy profile defaults", () => {
    const result = privacyProfileSchema.safeParse(emptyPrivacyProfile)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        supportedRights: [],
        requestMethods: [],
        responseTimelineDays: 0,
        identityVerificationRequired: false,
        authorizedAgentSupported: false,
        appealProcessExists: false,
        usesCookies: false,
        cookieTypes: [],
        organizationProviders: [],
        cookieConsentMechanism: "",
        doNotTrackResponse: false,
        globalPrivacyControlSupported: false,
      })
    }
  })

  it("accepts a populated privacy profile with code-array fields", () => {
    const result = privacyProfileSchema.safeParse({
      supportedRights: ["access", "deletion", "opt_out"],
      requestMethods: ["email", "web_form"],
      responseTimelineDays: 30,
      identityVerificationRequired: true,
      authorizedAgentSupported: true,
      appealProcessExists: false,
      usesCookies: true,
      cookieTypes: ["necessary", "analytics"],
      organizationProviders: [
        {
          systemType: "analytics",
          providerId: "prov-google-analytics",
        },
        {
          systemType: "advertising",
          providerId: "prov-google-ads",
        },
      ],
      cookieConsentMechanism: "cookie_banner",
      doNotTrackResponse: false,
      globalPrivacyControlSupported: true,
    })

    expect(result.success).toBe(true)
  })

  it("rejects privacy profile code array values that violate the code id format", () => {
    const result = privacyProfileSchema.safeParse({
      ...emptyPrivacyProfile,
      supportedRights: ["Opt Out"],
    })

    expect(result.success).toBe(false)
  })

  it("rejects negative privacy response timeline values", () => {
    const result = privacyProfileSchema.safeParse({
      ...emptyPrivacyProfile,
      responseTimelineDays: -1,
    })

    expect(result.success).toBe(false)
  })

  it("rejects privacy cookie type values that violate the code id format", () => {
    const result = privacyProfileSchema.safeParse({
      ...emptyPrivacyProfile,
      cookieTypes: ["Analytics Cookies"],
    })

    expect(result.success).toBe(false)
  })

  it("rejects privacy cookie consent mechanism values that violate the code id format", () => {
    const result = privacyProfileSchema.safeParse({
      ...emptyPrivacyProfile,
      cookieConsentMechanism: "Cookie Banner",
    })

    expect(result.success).toBe(false)
  })

  it("accepts analytics and advertising provider system types", () => {
    expect(providerSystemTypeSchema.safeParse("analytics").success).toBe(true)
    expect(providerSystemTypeSchema.safeParse("advertising").success).toBe(true)
  })

  it("accepts template input policy metadata fields", () => {
    const result = templateInputSchema.safeParse({
      name: "Privacy Policy",
      slug: "privacy-policy",
      content: "# Privacy Policy\n",
      policyEffectiveDate: "2026-05-18",
      policyLastReviewedDate: "2026-05-18",
      policyVersion: "1.0",
      policyOwnerUserId: "user_security",
      policyApproverUserId: "user_legal",
      policyReviewCadence: "Annual",
    })

    expect(result.success).toBe(true)
  })
})
