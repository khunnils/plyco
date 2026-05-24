import { describe, expect, it } from "vitest"

import {
  authStateSchema,
  authUserSchema,
  companyProfileSchema,
  createOrganizationSchema,
  businessActivityInputSchema,
  dataHandlingProfileSchema,
  emptyAccessProfile,
  emptyInfrastructureProfile,
  emptyPrivacyProfile,
  emptyServiceProfile,
  privacyProfileSchema,
  accessProfileSchema,
  infrastructureProfileSchema,
  organizationProviderInputSchema,
  providerCriticalitySchema,
  providerSystemTypeSchema,
  serviceProfileInputSchema,
  serviceProfileSchema,
  serviceProviderUsageInputSchema,
  templateInputSchema,
  templateSchema,
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

  it("requires operational provider fields", () => {
    const result = organizationProviderInputSchema.safeParse({
      providerId: "prov-github",
      systemTypes: [],
      name: "GitHub",
      legalName: "GitHub, Inc.",
      category: "source_control",
      countryOfRegistration: "US",
      criticality: "high",
      notes: "",
    })

    expect(result.success).toBe(true)
  })

  it("accepts service-specific provider processing fields", () => {
    const result = serviceProviderUsageInputSchema.safeParse({
      serviceId: "service_1",
      organizationProviderId: "provider_1",
      systemType: "analytics",
      purpose: "Code hosting",
      dataProcessingLevel: "limited",
      dataProcessed: ["source_code"],
      dpaStatus: "signed",
      dataRegions: ["us"],
      notes: "",
    })

    expect(result.success).toBe(true)
  })

  it("normalizes non-processing provider usage", () => {
    const result = serviceProviderUsageInputSchema.safeParse({
      serviceId: "service_1",
      organizationProviderId: "provider_1",
      systemType: null,
      purpose: "Issue tracking",
      dataProcessingLevel: "none",
      dataProcessed: ["source_code"],
      dpaStatus: "signed",
      dataRegions: ["us"],
      notes: "",
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toMatchObject({
        dataProcessed: [],
        dpaStatus: "not_required",
        dataRegions: [],
      })
    }
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

  it("limits provider criticality to the supported readiness levels", () => {
    expect(providerCriticalitySchema.safeParse("severe").success).toBe(false)
  })

  it("validates ISO alpha-2 country codes", () => {
    expect(countryCodeSchema.safeParse("US").success).toBe(true)
    expect(countryCodeSchema.safeParse("United States").success).toBe(false)
  })

  it("accepts rich stored data type details", () => {
    const result = dataHandlingProfileSchema.safeParse({
      dataTypesStored: [
        {
          name: "Customer account data",
          description: "Account contact and notification data",
          subjectTypes: ["customer"],
          collectionMethods: ["account_signup"],
          isSensitive: true,
          isRequired: true,
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

  it("accepts business activity purpose, role, and legal basis", () => {
    const result = businessActivityInputSchema.safeParse({
      name: "Account management",
      purpose: "Operate user accounts",
      role: "controller",
      legalBasis: ["contract"],
      retentionDays: 365,
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
    const result = serviceProfileInputSchema.safeParse(emptyServiceProfile)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        serviceName: null,
        serviceDescription: null,
        serviceUrl: null,
        businessActivityIds: [],
        userTypes: null,
        customerTypes: null,
        availabilityRegions: null,
        childrenDirected: null,
        minimumUserAge: null,
        privacy: {
          usesCookies: null,
          cookieTypes: null,
          primaryHostingRegion: null,
          dataResidencyOptions: null,
        },
      })
    }
  })

  it("accepts a populated service profile with code-array fields", () => {
    const result = serviceProfileInputSchema.safeParse({
      serviceName: "Acme AI Platform",
      serviceDescription: "Customer security review automation",
      serviceUrl: "https://app.acme.example",
      businessActivityIds: ["activity_1"],
      userTypes: ["workspace_admins", "end_users"],
      customerTypes: ["smb", "mid_market"],
      availabilityRegions: ["us", "eu"],
      childrenDirected: false,
      minimumUserAge: 13,
      privacy: {
        usesCookies: true,
        cookieTypes: ["necessary", "analytics"],
        primaryHostingRegion: "us",
        dataResidencyOptions: ["us", "eu"],
      },
    })

    expect(result.success).toBe(true)
  })

  it("rejects service profile code array values that violate the code id format", () => {
    const result = serviceProfileInputSchema.safeParse({
      ...emptyServiceProfile,
      userTypes: ["Invalid User"],
    })

    expect(result.success).toBe(false)
  })

  it("rejects negative minimum user age values", () => {
    const result = serviceProfileInputSchema.safeParse({
      ...emptyServiceProfile,
      minimumUserAge: -1,
    })

    expect(result.success).toBe(false)
  })

  it("accepts persisted service profile identity fields", () => {
    const result = serviceProfileSchema.safeParse({
      ...emptyServiceProfile,
      id: "service_1",
      createdAt: "2026-05-14T00:00:00.000Z",
      updatedAt: "2026-05-14T00:00:00.000Z",
    })

    expect(result.success).toBe(true)
  })

  it("accepts the empty privacy profile defaults", () => {
    const result = privacyProfileSchema.safeParse(emptyPrivacyProfile)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        supportedRights: null,
        requestMethods: null,
        responseTimelineDays: null,
        identityVerificationRequired: null,
        authorizedAgentSupported: null,
        appealProcessExists: null,
        organizationProviders: [],
        cookieConsentMechanism: null,
        doNotTrackResponse: null,
        globalPrivacyControlSupported: null,
        sendsMarketingEmails: null,
        marketingOptOutMethod: null,
        transactionalEmailsSent: null,
        crossBorderTransfers: null,
        transferMechanisms: null,
        sellsOrSharesData: null,
        doNotSellLink: null,
        dpoStatus: null,
        dpoName: null,
        dpoEmail: null,
        euRepresentativeStatus: null,
        euRepresentativeName: null,
        euRepresentativeAddress: null,
        usesAutomatedDecisionMaking: null,
      })
    }
  })

  it("accepts empty security control defaults", () => {
    expect(accessProfileSchema.parse(emptyAccessProfile)).toMatchObject({
      leastPrivilege: null,
      roleBasedAccess: null,
      accessReviewCadence: null,
      adminApprovalRequired: null,
      passwordManagerRequired: null,
    })
    expect(infrastructureProfileSchema.parse(emptyInfrastructureProfile)).toMatchObject({
      atRestAlgorithm: null,
      inTransitMinimumTlsVersion: null,
      keyManagementProvider: null,
      logRetentionDays: null,
      securityMonitoringOwner: null,
      scanningCadence: null,
      patchingSlaCriticalDays: null,
      patchingSlaHighDays: null,
      incidentResponsePlanExists: null,
      incidentNotificationTimeline: null,
      customerNotificationProcess: null,
      incidentResponseLastTestedDate: null,
      backupCadence: null,
      backupRetentionDays: null,
      restoreTestingCadence: null,
      vendorReviewRequired: null,
      vendorReviewCadence: null,
      dpaRequiredForProcessors: null,
    })
  })

  it("preserves explicit empty, false, and zero profile answers", () => {
    const result = privacyProfileSchema.safeParse({
      ...emptyPrivacyProfile,
      supportedRights: [],
      responseTimelineDays: 0,
      identityVerificationRequired: false,
      cookieConsentMechanism: "",
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.supportedRights).toEqual([])
      expect(result.data.responseTimelineDays).toBe(0)
      expect(result.data.identityVerificationRequired).toBe(false)
      expect(result.data.cookieConsentMechanism).toBe("")
    }
  })

  it("accepts populated security control detail", () => {
    expect(
      accessProfileSchema.safeParse({
        ...emptyAccessProfile,
        leastPrivilege: true,
        roleBasedAccess: true,
        accessReviewCadence: "quarterly",
        adminApprovalRequired: true,
        passwordManagerRequired: true,
      }).success,
    ).toBe(true)
    expect(
      infrastructureProfileSchema.safeParse({
        ...emptyInfrastructureProfile,
        atRestAlgorithm: "aes_256",
        inTransitMinimumTlsVersion: "tls_1_2",
        keyManagementProvider: "aws_kms",
        logRetentionDays: 365,
        securityMonitoringOwner: "security",
        scanningCadence: "weekly",
        patchingSlaCriticalDays: 7,
        patchingSlaHighDays: 30,
        incidentResponsePlanExists: true,
        incidentNotificationTimeline: "within_72_hours",
        customerNotificationProcess: "email_notice",
        incidentResponseLastTestedDate: "2026-05-21",
        backupCadence: "daily",
        backupRetentionDays: 30,
        restoreTestingCadence: "quarterly",
        vendorReviewRequired: true,
        vendorReviewCadence: "annually",
        dpaRequiredForProcessors: true,
      }).success,
    ).toBe(true)
  })

  it("rejects invalid security control codes and negative day counts", () => {
    expect(
      accessProfileSchema.safeParse({
        ...emptyAccessProfile,
        accessReviewCadence: "Every Quarter",
      }).success,
    ).toBe(false)
    expect(
      infrastructureProfileSchema.safeParse({
        ...emptyInfrastructureProfile,
        atRestAlgorithm: "AES 256",
      }).success,
    ).toBe(false)
    expect(
      infrastructureProfileSchema.safeParse({
        ...emptyInfrastructureProfile,
        logRetentionDays: -1,
      }).success,
    ).toBe(false)
  })

  it("accepts a populated privacy profile with code-array fields", () => {
    const result = privacyProfileSchema.safeParse({
      supportedRights: ["access", "deletion", "opt_out"],
      requestMethods: ["email", "web_form"],
      responseTimelineDays: 30,
      identityVerificationRequired: true,
      authorizedAgentSupported: true,
      appealProcessExists: false,
      organizationProviders: [
        {
          systemType: "newsletter",
          providerId: "prov-mailchimp",
        },
      ],
      cookieConsentMechanism: "cookie_banner",
      doNotTrackResponse: false,
      globalPrivacyControlSupported: true,
      sendsMarketingEmails: true,
      marketingOptOutMethod: "unsubscribe_link",
      transactionalEmailsSent: true,
      crossBorderTransfers: true,
      transferMechanisms: ["sccs", "dpf"],
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

  it("rejects service privacy values that violate the code id format", () => {
    const result = serviceProfileInputSchema.safeParse({
      ...emptyServiceProfile,
      privacy: {
        ...emptyServiceProfile.privacy,
        cookieTypes: ["Analytics Cookies"],
      },
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

  it("rejects privacy marketing opt-out method values that violate the code id format", () => {
    const result = privacyProfileSchema.safeParse({
      ...emptyPrivacyProfile,
      marketingOptOutMethod: "Unsubscribe Link",
    })

    expect(result.success).toBe(false)
  })

  it("rejects privacy transfer values that violate the code id format", () => {
    expect(
      privacyProfileSchema.safeParse({
        ...emptyPrivacyProfile,
        transferMechanisms: ["Standard Contractual Clauses"],
      }).success,
    ).toBe(false)
  })

  it("rejects service privacy residency values that violate the code id format", () => {
    expect(
      serviceProfileInputSchema.safeParse({
        ...emptyServiceProfile,
        privacy: {
          ...emptyServiceProfile.privacy,
          primaryHostingRegion: "United States",
        },
      }).success,
    ).toBe(false)
    expect(
      serviceProfileInputSchema.safeParse({
        ...emptyServiceProfile,
        privacy: {
          ...emptyServiceProfile.privacy,
          dataResidencyOptions: ["European Union"],
        },
      }).success,
    ).toBe(false)
  })

  it("accepts analytics and advertising provider system types", () => {
    expect(providerSystemTypeSchema.safeParse("analytics").success).toBe(true)
    expect(providerSystemTypeSchema.safeParse("advertising").success).toBe(true)
    expect(providerSystemTypeSchema.safeParse("newsletter").success).toBe(true)
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
