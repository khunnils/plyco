import { emptyServiceProfile } from "@plyco/shared"
import { describe, expect, it } from "vitest"

import { emptyProfileDraft } from "@/features/company/lib/profile"
import {
  dashboardProgress,
  activityProgress,
  infrastructureProgress,
  securityProgress,
  isActivityComplete,
  isAnswered,
  privacyProgress,
  serviceProgress,
} from "@/features/dashboard/lib/progress"

describe("dashboard progress", () => {
  it("counts false as answered", () => {
    expect(isAnswered(false)).toBe(true)
  })

  it("counts null, empty strings, and empty arrays as unanswered", () => {
    expect(isAnswered(null)).toBe(false)
    expect(isAnswered("")).toBe(false)
    expect(isAnswered("   ")).toBe(false)
    expect(isAnswered([])).toBe(false)
  })

  it("treats zero as unanswered only for unset-by-zero fields", () => {
    expect(isAnswered(0)).toBe(true)
    expect(isAnswered(0, { zeroMeansUnset: true })).toBe(false)
  })

  it("skips service conditional fields when they do not apply", () => {
    const progress = serviceProgress(
      {
        ...emptyServiceProfile,
        id: "svc_1",
        serviceName: "App",
        serviceDescription: "Customer app",
        serviceUrl: "https://app.example",
        businessActivityIds: ["activity_1"],
        userTypes: ["admin"],
        customerTypes: ["b2b"],
        availabilityRegions: ["us"],
        childrenDirected: false,
        minimumUserAge: 0,
        privacy: {
          ...emptyServiceProfile.privacy,
          usesCookiesOrTrackingTechnologies: false,
          cookieTrackingCategories: [],
          cookieConsentMechanism: null,
          doNotTrackResponse: null,
          globalPrivacyControlSupported: null,
          primaryHostingRegion: "us",
        },
      },
      []
    )
    const audience = progress.sections.find(
      (section) => section.title === "Audience and Availability"
    )
    const cookiePreferences = progress.sections.find(
      (section) => section.title === "Cookie Preferences"
    )
    const hosting = progress.sections.find(
      (section) => section.title === "Service Hosting"
    )

    expect(audience).toMatchObject({
      completedFields: 5,
      totalFields: 5,
    })
    expect(cookiePreferences).toMatchObject({
      completedFields: 1,
      totalFields: 1,
    })
    expect(hosting).toMatchObject({
      completedFields: 1,
      totalFields: 1,
    })
  })

  it("requires cookie transparency answers for non-essential cookie categories", () => {
    const progress = serviceProgress(
      {
        ...emptyServiceProfile,
        id: "svc_1",
        serviceName: "App",
        serviceDescription: "Customer app",
        serviceUrl: "https://app.example",
        businessActivityIds: ["activity_1"],
        userTypes: ["admin"],
        customerTypes: ["b2b"],
        availabilityRegions: ["us"],
        childrenDirected: false,
        minimumUserAge: 0,
        privacy: {
          ...emptyServiceProfile.privacy,
          usesCookiesOrTrackingTechnologies: true,
          cookieTrackingCategories: ["analytics"],
          cookieConsentMechanism: "cookie_banner",
          primaryHostingRegion: "us",
        },
      },
      []
    )
    const cookiePreferences = progress.sections.find(
      (section) => section.title === "Cookie Preferences"
    )

    expect(cookiePreferences).toMatchObject({
      completedFields: 3,
      totalFields: 9,
    })
  })

  it("skips privacy dependent fields when negative answers make them irrelevant", () => {
    const progress = privacyProgress({
      ...emptyProfileDraft,
      company: {
        ...emptyProfileDraft.company,
        complianceGoals: ["gdpr"],
      },
      privacy: {
        ...emptyProfileDraft.privacy,
        sendsMarketingEmails: false,
        marketingOptOutMethod: null,
        crossBorderTransfers: false,
        transferMechanisms: [],
        sellsOrSharesData: false,
        doNotSellLink: null,
        transactionalEmailsSent: false,
        usesAutomatedDecisionMaking: false,
        productionDataInDevelopment: false,
        retentionPolicyExists: false,
        dpoStatus: "not_appointed",
        euRepresentativeStatus: "not_appointed",
      },
    })
    const marketing = progress.sections.find(
      (section) => section.title === "Marketing & Communications"
    )
    const transfers = progress.sections.find(
      (section) => section.title === "International Transfers"
    )
    const disclosures = progress.sections.find(
      (section) => section.title === "Compliance & Disclosures"
    )
    const representation = progress.sections.find(
      (section) => section.title === "Privacy Officers & Representation"
    )

    expect(marketing).toMatchObject({ completedFields: 2, totalFields: 2 })
    expect(transfers).toMatchObject({ completedFields: 1, totalFields: 1 })
    expect(disclosures).toMatchObject({ completedFields: 4, totalFields: 4 })
    expect(representation).toMatchObject({ completedFields: 2, totalFields: 2 })
  })

  it("counts an explicit no-newsletter-provider answer", () => {
    const progress = privacyProgress({
      ...emptyProfileDraft,
      privacy: {
        ...emptyProfileDraft.privacy,
        sendsMarketingEmails: true,
        marketingOptOutMethod: "unsubscribe_link",
        transactionalEmailsSent: false,
        organizationProviders: [
          { systemType: "newsletter", providerId: "none" },
        ],
      },
    })
    const marketing = progress.sections.find(
      (section) => section.title === "Marketing & Communications"
    )

    expect(marketing).toMatchObject({ completedFields: 4, totalFields: 4 })
  })

  it("skips encryption detail progress when parent encryption answers are negative", () => {
    const progress = infrastructureProgress({
      ...emptyProfileDraft,
      infrastructure: {
        ...emptyProfileDraft.infrastructure,
        encryptionAtRest: false,
        atRestAlgorithm: null,
        encryptionInTransit: false,
        inTransitMinimumTlsVersion: null,
        keyManagementProvider: "aws_kms",
        encryptedDevicesRequired: false,
      },
    })
    const encryption = progress.sections.find(
      (section) => section.title === "Encryption"
    )

    expect(encryption).toMatchObject({ completedFields: 4, totalFields: 4 })
  })

  it("skips response timeline days when status is not_defined", () => {
    const progress = privacyProgress({
      ...emptyProfileDraft,
      privacy: {
        ...emptyProfileDraft.privacy,
        responseTimelineDaysStatus: "not_defined",
        responseTimelineDays: null,
      },
    })
    const rights = progress.sections.find(
      (section) => section.title === "Privacy Rights & Request Handling"
    )

    expect(rights).toMatchObject({ totalFields: 6 })
    expect(rights!.completedFields).toBeGreaterThanOrEqual(1)
  })

  it("includes response timeline days when status is defined", () => {
    const progress = privacyProgress({
      ...emptyProfileDraft,
      privacy: {
        ...emptyProfileDraft.privacy,
        responseTimelineDaysStatus: "defined",
        responseTimelineDays: null,
      },
    })
    const rights = progress.sections.find(
      (section) => section.title === "Privacy Rights & Request Handling"
    )

    expect(rights).toMatchObject({ totalFields: 7 })
  })

  it("skips privacy officer and representation progress for non-GDPR profiles", () => {
    const progress = privacyProgress({
      ...emptyProfileDraft,
      company: {
        ...emptyProfileDraft.company,
        complianceGoals: ["soc_2"],
      },
      privacy: {
        ...emptyProfileDraft.privacy,
        dpoStatus: null,
        euRepresentativeStatus: null,
      },
    })

    expect(
      progress.sections.find(
        (section) => section.title === "Privacy Officers & Representation"
      )
    ).toBeUndefined()
  })

  it("skips incident response last tested date when no plan exists", () => {
    const progressNoPlan = securityProgress({
      ...emptyProfileDraft,
      security: {
        ...emptyProfileDraft.security,
        incidentResponsePlanExists: false,
        incidentNotificationTimeline: "none",
        customerNotificationProcess: "none",
        incidentResponseLastTestedDate: null,
      },
    })
    const irNoPlan = progressNoPlan.sections.find(
      (section) => section.title === "Incident Response"
    )
    expect(irNoPlan).toMatchObject({
      completedFields: 3,
      totalFields: 3,
    })

    const progressWithPlan = securityProgress({
      ...emptyProfileDraft,
      security: {
        ...emptyProfileDraft.security,
        incidentResponsePlanExists: true,
        incidentNotificationTimeline: "none",
        customerNotificationProcess: "none",
        incidentResponseLastTestedDate: null,
      },
    })
    const irWithPlan = progressWithPlan.sections.find(
      (section) => section.title === "Incident Response"
    )
    expect(irWithPlan).toMatchObject({
      completedFields: 3,
      totalFields: 4,
    })
  })

  it("adjusts backups fields count based on backupsEnabled", () => {
    const progressNoBackups = infrastructureProgress({
      ...emptyProfileDraft,
      infrastructure: {
        ...emptyProfileDraft.infrastructure,
        backupsEnabled: false,
      },
    })
    const backupsNo = progressNoBackups.sections.find(
      (section) => section.title === "Backups"
    )
    expect(backupsNo).toMatchObject({
      totalFields: 1,
    })

    const progressWithBackups = infrastructureProgress({
      ...emptyProfileDraft,
      infrastructure: {
        ...emptyProfileDraft.infrastructure,
        backupsEnabled: true,
      },
    })
    const backupsYes = progressWithBackups.sections.find(
      (section) => section.title === "Backups"
    )
    expect(backupsYes).toMatchObject({
      totalFields: 4,
    })
  })

  it("tracks centralized logging and security monitoring", () => {
    const progressNoLogs = infrastructureProgress({
      ...emptyProfileDraft,
      infrastructure: {
        ...emptyProfileDraft.infrastructure,
        centralizedLoggingEnabled: false,
        securityMonitoring: "none",
      },
    })
    const logsNo = progressNoLogs.sections.find(
      (section) => section.title === "Monitoring & Detection"
    )
    expect(logsNo).toMatchObject({
      totalFields: 2,
    })

    const progressWithLogs = infrastructureProgress({
      ...emptyProfileDraft,
      infrastructure: {
        ...emptyProfileDraft.infrastructure,
        centralizedLoggingEnabled: true,
        securityMonitoring: "automated",
      },
    })
    const logsYes = progressWithLogs.sections.find(
      (section) => section.title === "Monitoring & Detection"
    )
    expect(logsYes).toMatchObject({
      totalFields: 2,
    })
  })

  it("counts explicit no-provider answers but not unanswered providers", () => {
    const unanswered = infrastructureProgress(emptyProfileDraft)
    const answered = infrastructureProgress({
      ...emptyProfileDraft,
      infrastructure: {
        ...emptyProfileDraft.infrastructure,
        organizationProviders: [
          { systemType: "cloud", providerId: "none" },
          { systemType: "ai", providerId: "none" },
          { systemType: "source_control", providerId: "none" },
          { systemType: "auth", providerId: "none" },
          { systemType: "password_manager", providerId: "none" },
        ],
      },
    })
    const unansweredProviders = unanswered.sections.find(
      (section) => section.title === "Infrastructure Providers"
    )
    const answeredProviders = answered.sections.find(
      (section) => section.title === "Infrastructure Providers"
    )

    expect(unansweredProviders?.completedFields).toBe(0)
    expect(answeredProviders?.completedFields).toBe(5)
  })

  it("requires AI details only when an activity uses AI", () => {
    const baseActivity = {
      id: "act_ai",
      sortOrder: 0,
      name: "Support triage",
      purpose: "Route support tickets",
      role: "controller",
      retentionPolicy: "fixed",
      retentionDays: 30,
      legalBasis: [],
      dataTypeIds: [],
      createdAt: "2026-06-17T00:00:00.000Z",
      updatedAt: "2026-06-17T00:00:00.000Z",
    }

    expect(
      isActivityComplete(
        {
          ...baseActivity,
          usesAi: false,
          aiUseCases: "",
          aiCustomerDataUsedForTraining: null,
          aiCustomerDataSentToProviders: null,
          aiHumanReviewOfOutputs: null,
          aiUsersInformedWhenUsed: null,
        },
        false
      )
    ).toBe(true)

    const incompleteAiActivity = {
      ...baseActivity,
      usesAi: true,
      aiUseCases: "Draft support replies",
      aiCustomerDataUsedForTraining: false,
      aiCustomerDataSentToProviders: true,
      aiHumanReviewOfOutputs: null,
      aiUsersInformedWhenUsed: true,
    }

    expect(isActivityComplete(incompleteAiActivity, false)).toBe(false)
    expect(activityProgress(incompleteAiActivity, false, 0)).toMatchObject({
      completedFields: 9,
      totalFields: 10,
    })
  })

  it("adjusts vendor risk fields count based on vendorReviewRequired and compliance goals", () => {
    const progressNoVendorGDPR = infrastructureProgress({
      ...emptyProfileDraft,
      company: {
        ...emptyProfileDraft.company,
        complianceGoals: ["gdpr"],
      },
      infrastructure: {
        ...emptyProfileDraft.infrastructure,
        vendorReviewRequired: false,
      },
    })
    const vendorNoGDPR = progressNoVendorGDPR.sections.find(
      (section) => section.title === "Vendor Risk"
    )
    expect(vendorNoGDPR).toMatchObject({
      totalFields: 2, // Vendor review required + DPA required for processors (since GDPR)
    })

    const progressWithVendorGDPR = infrastructureProgress({
      ...emptyProfileDraft,
      company: {
        ...emptyProfileDraft.company,
        complianceGoals: ["gdpr"],
      },
      infrastructure: {
        ...emptyProfileDraft.infrastructure,
        vendorReviewRequired: true,
      },
    })
    const vendorYesGDPR = progressWithVendorGDPR.sections.find(
      (section) => section.title === "Vendor Risk"
    )
    expect(vendorYesGDPR).toMatchObject({
      totalFields: 3, // Vendor review required + frequency + DPA required for processors
    })

    const progressWithVendorNoGDPR = infrastructureProgress({
      ...emptyProfileDraft,
      company: {
        ...emptyProfileDraft.company,
        complianceGoals: ["soc_2"],
      },
      infrastructure: {
        ...emptyProfileDraft.infrastructure,
        vendorReviewRequired: true,
      },
    })
    const vendorYesNoGDPR = progressWithVendorNoGDPR.sections.find(
      (section) => section.title === "Vendor Risk"
    )
    expect(vendorYesNoGDPR).toMatchObject({
      totalFields: 2, // Vendor review required + frequency (DPA is excluded since no GDPR)
    })
  })

  it("handles empty service, data type, and vendor lists", () => {
    const progress = dashboardProgress({
      organizationProviders: [],
      profile: {
        ...emptyProfileDraft,
        services: [],
        dataHandling: {
          ...emptyProfileDraft.dataHandling,
          dataTypesStored: [],
        },
      },
      serviceProviderUsage: [],
    })

    expect(progress.services).toEqual([])
    expect(progress.data.dataTypes).toEqual([])
    expect(progress.vendors).toEqual([])
  })

  it("consolidates services, data types, and activities into single top level sections for overall progress", () => {
    const progress = dashboardProgress({
      organizationProviders: [
        {
          id: "prov_1",
          name: "AWS",
          legalName: "Amazon Web Services",
          category: "hosting",
          countryOfRegistration: "US",
          criticality: "high",
          systemTypes: ["cloud"],
          createdAt: "2026-06-17T00:00:00.000Z",
          updatedAt: "2026-06-17T00:00:00.000Z",
        },
      ],
      profile: {
        ...emptyProfileDraft,
        services: [
          {
            id: "svc_1",
            sortOrder: 0,
            serviceName: "App",
            serviceDescription: "Customer app",
            serviceUrl: "https://app.example",
            businessActivityIds: ["act_1"],
            userTypes: ["admin"],
            customerTypes: ["b2b"],
            availabilityRegions: ["us"],
            childrenDirected: false,
            minimumUserAge: 0,
            privacy: {
              ...emptyServiceProfile.privacy,
              usesCookiesOrTrackingTechnologies: false,
              cookieTrackingCategories: [],
              cookieConsentMechanism: null,
              doNotTrackResponse: null,
              globalPrivacyControlSupported: null,
              primaryHostingRegion: "us",
            },
          },
        ],
        dataHandling: {
          ...emptyProfileDraft.dataHandling,
          dataTypesStored: [
            {
              name: "Email address",
              sortOrder: 0,
              description: "For login",
              subjectTypes: ["customer"],
              collectionMethods: ["form"],
              isSensitive: false,
              isRequired: true,
            },
          ],
        },
      },
      serviceProviderUsage: [
        {
          id: "use_1",
          organizationProviderId: "prov_1",
          serviceId: "svc_1",
          providerName: "AWS",
          serviceName: "App",
          systemType: null,
          purpose: "Hosting",
          dataProcessingLevel: "none",
          dataProcessed: [],
          dpaStatus: null,
          dataRegions: [],
          notes: "",
          createdAt: "2026-06-17T00:00:00.000Z",
          updatedAt: "2026-06-17T00:00:00.000Z",
        },
      ],
      businessActivities: [
        {
          id: "act_1",
          sortOrder: 0,
          name: "User registration",
          purpose: "Create account",
          role: "controller",
          retentionPolicy: "30 days",
          retentionDays: 30,
          legalBasis: ["consent"],
          dataTypeIds: [],
          usesAi: false,
          aiUseCases: "",
          aiCustomerDataUsedForTraining: null,
          aiCustomerDataSentToProviders: null,
          aiHumanReviewOfOutputs: null,
          aiUsersInformedWhenUsed: null,
          createdAt: "2026-06-17T00:00:00.000Z",
          updatedAt: "2026-06-17T00:00:00.000Z",
        },
      ],
    })

    // Profile, Privacy, Infrastructure, Security, Access, Services, Data Types, Activities
    // All 8 sections are active and should be counted
    expect(progress.overall.totalSections).toBe(8)

    // The single consolidated Services, Data Types, and Activities sections are fully complete
    // Because we filled all fields for our 1 service, 1 data type, and 1 activity
    // So completedSections should be at least 3
    // Profile, Privacy, Infrastructure, Security, Access, Services, Data Types, Activities
    // All 8 sections are active and should be counted
    expect(progress.overall.totalSections).toBe(8)

    // The single consolidated Services, Data Types, and Activities sections are fully complete
    // Because we filled all fields for our 1 service, 1 data type, and 1 activity
    // So completedSections should be at least 3
    expect(progress.overall.completedSections).toBe(3)
  })
})
