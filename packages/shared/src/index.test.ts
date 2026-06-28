import { describe, expect, it } from "vitest";

import {
  authStateSchema,
  authUserSchema,
  magicLinkRequestSchema,
  magicLinkResponseSchema,
  companyProfileSchema,
  createOrganizationSchema,
  businessActivityInputSchema,
  dataHandlingProfileSchema,
  documentSummarySchema,
  emptyAccessProfile,
  emptyInfrastructureProfile,
  emptySecurityProfile,
  emptyPrivacyProfile,
  emptyServiceProfile,
  privacyProfileSchema,
  accessProfileSchema,
  infrastructureProfileSchema,
  securityProfileSchema,
  isComplianceFieldVisible,
  organizationProviderInputSchema,
  organizationInvitationInputSchema,
  organizationInvitationSchema,
  organizationMemberRoleUpdateSchema,
  organizationLookupResultSchema,
  providerCriticalitySchema,
  providerSystemTypeSchema,
  recommendationsResponseSchema,
  recommendationSeveritySchema,
  serviceProfileInputSchema,
  serviceProfileSchema,
  serviceProviderUsageInputSchema,
  templateInputSchema,
  templatePreviewInputSchema,
  templatePreviewSchema,
  templateSchema,
  templateVariableCatalogSchema,
  countryCodeSchema,
  waitlistInputSchema,
} from "./index.js";

describe("waitlist schemas", () => {
  it("normalizes email and optional blocker text", () => {
    expect(
      waitlistInputSchema.parse({
        email: "  Founder@Example.COM ",
        blocker: "  Security questionnaires  ",
      }),
    ).toEqual({
      email: "founder@example.com",
      blocker: "Security questionnaires",
      website: "",
    });
  });

  it("rejects invalid email addresses", () => {
    expect(
      waitlistInputSchema.safeParse({ email: "not-an-email" }).success,
    ).toBe(false);
  });
});

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
    });

    expect(result.success).toBe(false);
  });

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
    });

    expect(result.success).toBe(true);
  });

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
    });

    expect(result.success).toBe(true);
  });

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
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        dataProcessed: [],
        dpaStatus: null,
        dataRegions: [],
      });
    }
  });

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
    ).toBe(true);
  });

  it("accepts plural onboarding lookup data types and activities", () => {
    const result = organizationLookupResultSchema.safeParse({
      company: {
        companyName: "Acme AI",
        legalEntityName: "Acme AI, Inc.",
        website: "https://acme.example",
        contactEmail: "hello@acme.example",
        securityContactEmail: "",
        privacyContactEmail: "",
        country: "US",
        address: "",
        employeeCount: null,
        industries: [],
        regions: ["us"],
        handlesPii: true,
        handlesSensitiveData: false,
        storesPii: true,
        storesHealthcareData: false,
        complianceGoals: ["soc_2"],
      },
      primaryService: {
        ...emptyServiceProfile,
        serviceName: "Acme AI",
        serviceUrl: "https://acme.example",
      },
      dataTypes: [
        {
          name: "Customer account data",
          description: "Customer account data",
          subjectTypes: null,
          collectionMethods: null,
          isSensitive: false,
          isRequired: true,
        },
        {
          name: "Payment data",
          description: "Payment data",
          subjectTypes: null,
          collectionMethods: null,
          isSensitive: false,
          isRequired: true,
        },
      ],
      activities: [
        {
          name: "Account management",
          purpose: "Operate user accounts",
          role: "",
          legalBasis: [],
          retentionPolicy: null,
          retentionDays: 0,
        },
        {
          name: "Billing",
          purpose: "Process customer payments",
          role: "",
          legalBasis: [],
          retentionPolicy: null,
          retentionDays: 0,
        },
      ],
      suggestedProviders: [],
      policyLinks: [],
      privacyPolicyUrl: null,
      warnings: [],
    });

    expect(result.success).toBe(true);
  });

  it("requires organization creation to include a name", () => {
    expect(createOrganizationSchema.safeParse({ name: "" }).success).toBe(
      false,
    );
  });

  it("requires auth users to have a valid email", () => {
    expect(
      authUserSchema.safeParse({
        id: "google-user-1",
        email: "not-an-email",
        name: "Startup Founder",
      }).success,
    ).toBe(false);
  });

  it("normalizes magic-link request emails", () => {
    const result = magicLinkRequestSchema.safeParse({
      email: " Founder@Example.COM ",
      returnTo: "/invites/token",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        email: "founder@example.com",
        returnTo: "/invites/token",
      });
    }
    expect(magicLinkResponseSchema.parse({ sent: true })).toEqual({
      sent: true,
    });
  });

  it("normalizes organization invitation emails", () => {
    const result = organizationInvitationInputSchema.safeParse({
      email: " Teammate@Example.COM ",
      role: "member",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        email: "teammate@example.com",
        role: "member",
      });
    }
  });

  it("requires organization invitations and member updates to use supported roles", () => {
    expect(
      organizationInvitationInputSchema.safeParse({
        email: "teammate@example.com",
        role: "admin",
      }).success,
    ).toBe(false);
    expect(
      organizationMemberRoleUpdateSchema.safeParse({ role: "owner" }).success,
    ).toBe(true);
  });

  it("accepts pending organization invitation summaries", () => {
    expect(
      organizationInvitationSchema.safeParse({
        id: "invite_1",
        organizationId: "org_1",
        email: "teammate@example.com",
        role: "owner",
        invitedByUserId: "user_1",
        invitedByName: "Founder",
        expiresAt: "2026-06-30T00:00:00.000Z",
        createdAt: "2026-06-18T00:00:00.000Z",
      }).success,
    ).toBe(true);
  });

  it("limits provider criticality to the supported readiness levels", () => {
    expect(providerCriticalitySchema.safeParse("severe").success).toBe(false);
  });

  it("accepts recommendation responses with severity counts", () => {
    const result = recommendationsResponseSchema.safeParse({
      recommendations: [
        {
          id: "security.mfa_required",
          title: "MFA is not required",
          category: "security",
          severity: "high",
          frameworks: ["soc_2"],
          message: "Multi-factor authentication is not required.",
          recommendation:
            "Require MFA for workforce and administrative access.",
          relatedFields: ["security.authentication.mfaRequired"],
        },
      ],
      countsBySeverity: {
        low: 0,
        medium: 0,
        high: 1,
        critical: 0,
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects unsupported recommendation severities", () => {
    expect(recommendationSeveritySchema.safeParse("urgent").success).toBe(
      false,
    );
  });

  it("validates ISO alpha-2 country codes", () => {
    expect(countryCodeSchema.safeParse("US").success).toBe(true);
    expect(countryCodeSchema.safeParse("United States").success).toBe(false);
  });

  it("accepts rich stored data type details", () => {
    const result = dataHandlingProfileSchema.safeParse({
      dataTypesStored: [
        {
          id: "data_type_customer_account",
          name: "Customer account data",
          description: "Account contact and notification data",
          subjectTypes: ["customer"],
          collectionMethods: ["account_signup"],
          isSensitive: true,
          isRequired: true,
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("accepts business activity purpose, role, and legal basis", () => {
    const result = businessActivityInputSchema.safeParse({
      name: "Account management",
      purpose: "Operate user accounts",
      role: "controller",
      legalBasis: ["contract"],
      dataTypeIds: ["data_type_customer_account"],
      retentionDays: 365,
      usesAi: true,
      aiUseCases: "Summarize account history for support agents",
      aiCustomerDataUsedForTraining: false,
      aiCustomerDataSentToProviders: true,
      aiHumanReviewOfOutputs: true,
      aiUsersInformedWhenUsed: true,
    });

    expect(result.success).toBe(true);
  });

  it("shows GDPR-targeted fields only when GDPR is a compliance goal", () => {
    expect(
      isComplianceFieldVisible("businessActivity.legalBasis", ["gdpr"]),
    ).toBe(true);
    expect(
      isComplianceFieldVisible("businessActivity.legalBasis", ["soc_2"]),
    ).toBe(false);
    expect(isComplianceFieldVisible("businessActivity.legalBasis", [])).toBe(
      false,
    );
    expect(isComplianceFieldVisible("businessActivity.legalBasis", null)).toBe(
      false,
    );
    expect(isComplianceFieldVisible("privacy.dpoStatus", ["gdpr"])).toBe(true);
    expect(isComplianceFieldVisible("privacy.dpoStatus", ["soc_2"])).toBe(
      false,
    );
    expect(
      isComplianceFieldVisible("infrastructure.dpaRequiredForProcessors", [
        "gdpr",
      ]),
    ).toBe(true);
    expect(
      isComplianceFieldVisible("infrastructure.dpaRequiredForProcessors", [
        "soc_2",
      ]),
    ).toBe(false);
  });

  it("shows untargeted fields by default", () => {
    expect(isComplianceFieldVisible("businessActivity.purpose", null)).toBe(
      true,
    );
  });

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
    ).toBe(true);
  });

  it("accepts the empty service profile defaults", () => {
    const result = serviceProfileInputSchema.safeParse(emptyServiceProfile);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        sortOrder: 0,
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
          usesCookiesOrTrackingTechnologies: null,
          cookieTrackingCategories: null,
          cookieConsentMechanism: null,
          nonEssentialCookiesBlockedUntilConsent: null,
          cookieRejectAsEasyAsAccept: null,
          cookieConsentWithdrawalMethod: null,
          cookieConsentNoPretickedBoxes: null,
          doNotTrackResponse: null,
          globalPrivacyControlSupported: null,
          primaryHostingRegion: null,
        },
      });
    }
  });

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
        usesCookiesOrTrackingTechnologies: true,
        cookieTrackingCategories: ["necessary", "analytics"],
        cookieConsentMechanism: "cookie_banner",
        nonEssentialCookiesBlockedUntilConsent: true,
        cookieRejectAsEasyAsAccept: true,
        cookieConsentWithdrawalMethod: "cookie_preferences",
        cookieConsentNoPretickedBoxes: true,
        doNotTrackResponse: false,
        globalPrivacyControlSupported: true,
        primaryHostingRegion: "us",
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects service profile code array values that violate the code id format", () => {
    const result = serviceProfileInputSchema.safeParse({
      ...emptyServiceProfile,
      userTypes: ["Invalid User"],
    });

    expect(result.success).toBe(false);
  });

  it("rejects negative minimum user age values", () => {
    const result = serviceProfileInputSchema.safeParse({
      ...emptyServiceProfile,
      minimumUserAge: -1,
    });

    expect(result.success).toBe(false);
  });

  it("accepts persisted service profile identity fields", () => {
    const result = serviceProfileSchema.safeParse({
      ...emptyServiceProfile,
      id: "service_1",
      createdAt: "2026-05-14T00:00:00.000Z",
      updatedAt: "2026-05-14T00:00:00.000Z",
    });

    expect(result.success).toBe(true);
  });

  it("accepts the empty privacy profile defaults", () => {
    const result = privacyProfileSchema.safeParse(emptyPrivacyProfile);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        supportedRights: null,
        requestMethods: null,
        responseTimelineDaysStatus: null,
        responseTimelineDays: null,
        identityVerificationRequired: null,
        authorizedAgentSupported: null,
        appealProcessExists: null,
        organizationProviders: [],
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
        productionDataInDevelopment: null,
        retentionPolicyExists: null,
      });
    }
  });

  it("accepts empty security control defaults", () => {
    expect(accessProfileSchema.parse(emptyAccessProfile)).toMatchObject({
      leastPrivilege: null,
      roleBasedAccess: null,
      accessReviewCadence: null,
      adminApprovalRequired: null,
      passwordManagerRequired: null,
    });
    expect(
      infrastructureProfileSchema.parse(emptyInfrastructureProfile),
    ).toMatchObject({
      atRestAlgorithm: null,
      inTransitMinimumTlsVersion: null,
      keyManagementProvider: null,
      securityMonitoring: null,
      backupCadence: null,
      backupRetentionDays: null,
      backupRetentionDaysStatus: null,
      restoreTestingCadence: null,
      vendorReviewRequired: null,
      vendorReviewCadence: null,
      dpaRequiredForProcessors: null,
    });
    expect(securityProfileSchema.parse(emptySecurityProfile)).toMatchObject({
      codeReviewRequired: null,
      dependencySecurityMonitoring: null,
      secretScanning: null,
      automatedTestingBeforeDeployment: null,
      cicdDeploymentProcess: null,
      productionDeploymentApprovalRequired: null,
      scanningCadence: null,
      penetrationTestingStrategy: null,
      penetrationTestingCadence: null,
      penetrationTestLastDate: null,
      patchingSlaCriticalDays: null,
      patchingSlaCriticalDaysStatus: null,
      patchingSlaHighDays: null,
      patchingSlaHighDaysStatus: null,
      incidentResponsePlanExists: null,
      incidentNotificationTimeline: null,
      customerNotificationProcess: null,
      incidentResponseLastTestedDate: null,
      vulnerabilityDisclosureProgramExists: null,
      vulnerabilityDisclosureUrl: null,
    });
  });

  it("preserves explicit empty, false, and zero profile answers", () => {
    const result = privacyProfileSchema.safeParse({
      ...emptyPrivacyProfile,
      supportedRights: [],
      responseTimelineDays: 0,
      identityVerificationRequired: false,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.supportedRights).toEqual([]);
      expect(result.data.responseTimelineDays).toBe(0);
      expect(result.data.identityVerificationRequired).toBe(false);
    }
  });

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
    ).toBe(true);
    expect(
      infrastructureProfileSchema.safeParse({
        ...emptyInfrastructureProfile,
        atRestAlgorithm: "aes_256",
        inTransitMinimumTlsVersion: "tls_1_2",
        keyManagementProvider: "aws_kms",
        securityMonitoring: "automated",
        backupCadence: "daily",
        backupRetentionDays: 30,
        restoreTestingCadence: "quarterly",
        vendorReviewRequired: true,
        vendorReviewCadence: "annually",
        dpaRequiredForProcessors: true,
      }).success,
    ).toBe(true);
    expect(
      securityProfileSchema.safeParse({
        ...emptySecurityProfile,
        codeReviewRequired: true,
        dependencySecurityMonitoring: true,
        secretScanning: true,
        automatedTestingBeforeDeployment: true,
        cicdDeploymentProcess: true,
        productionDeploymentApprovalRequired: true,
        scanningCadence: "weekly",
        penetrationTestingStrategy: "external",
        patchingSlaCriticalDays: 7,
        patchingSlaHighDays: 30,
        incidentResponsePlanExists: true,
        incidentNotificationTimeline: "within_72_hours",
        customerNotificationProcess: "email_notice",
        incidentResponseLastTestedDate: "2026-05-21",
      }).success,
    ).toBe(true);
  });

  it("rejects invalid security control codes and negative day counts", () => {
    expect(
      accessProfileSchema.safeParse({
        ...emptyAccessProfile,
        accessReviewCadence: "Every Quarter",
      }).success,
    ).toBe(false);
    expect(
      infrastructureProfileSchema.safeParse({
        ...emptyInfrastructureProfile,
        atRestAlgorithm: "AES 256",
      }).success,
    ).toBe(false);
    expect(
      securityProfileSchema.safeParse({
        ...emptySecurityProfile,
        patchingSlaCriticalDays: -1,
      }).success,
    ).toBe(false);
  });

  it("accepts a populated privacy profile with code-array fields", () => {
    const result = privacyProfileSchema.safeParse({
      supportedRights: ["access", "deletion", "opt_out"],
      requestMethods: ["email", "web_form"],
      responseTimelineDaysStatus: "defined",
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
      sendsMarketingEmails: true,
      marketingOptOutMethod: "unsubscribe_link",
      transactionalEmailsSent: true,
      crossBorderTransfers: true,
      transferMechanisms: ["sccs", "dpf"],
    });

    expect(result.success).toBe(true);
  });

  it("rejects privacy profile code array values that violate the code id format", () => {
    const result = privacyProfileSchema.safeParse({
      ...emptyPrivacyProfile,
      supportedRights: ["Opt Out"],
    });

    expect(result.success).toBe(false);
  });

  it("rejects negative privacy response timeline values", () => {
    const result = privacyProfileSchema.safeParse({
      ...emptyPrivacyProfile,
      responseTimelineDays: -1,
    });

    expect(result.success).toBe(false);
  });

  it("rejects service privacy values that violate the code id format", () => {
    const result = serviceProfileInputSchema.safeParse({
      ...emptyServiceProfile,
      privacy: {
        ...emptyServiceProfile.privacy,
        cookieTrackingCategories: ["Analytics Cookies"],
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects service cookie consent mechanism values that violate the code id format", () => {
    const result = serviceProfileInputSchema.safeParse({
      ...emptyServiceProfile,
      privacy: {
        ...emptyServiceProfile.privacy,
        cookieConsentMechanism: "Cookie Banner",
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects service cookie consent withdrawal method values that violate the code id format", () => {
    const result = serviceProfileInputSchema.safeParse({
      ...emptyServiceProfile,
      privacy: {
        ...emptyServiceProfile.privacy,
        cookieConsentWithdrawalMethod: "Cookie Preferences",
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects service cookie transparency values with invalid types", () => {
    const result = serviceProfileInputSchema.safeParse({
      ...emptyServiceProfile,
      privacy: {
        ...emptyServiceProfile.privacy,
        nonEssentialCookiesBlockedUntilConsent: "yes",
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects privacy marketing opt-out method values that violate the code id format", () => {
    const result = privacyProfileSchema.safeParse({
      ...emptyPrivacyProfile,
      marketingOptOutMethod: "Unsubscribe Link",
    });

    expect(result.success).toBe(false);
  });

  it("rejects privacy transfer values that violate the code id format", () => {
    expect(
      privacyProfileSchema.safeParse({
        ...emptyPrivacyProfile,
        transferMechanisms: ["Standard Contractual Clauses"],
      }).success,
    ).toBe(false);
  });

  it("rejects service privacy hosting region values that violate the code id format", () => {
    expect(
      serviceProfileInputSchema.safeParse({
        ...emptyServiceProfile,
        privacy: {
          ...emptyServiceProfile.privacy,
          primaryHostingRegion: "United States",
        },
      }).success,
    ).toBe(false);
  });

  it("accepts marketing and issue tracking provider system types", () => {
    expect(providerSystemTypeSchema.safeParse("ai").success).toBe(true);
    expect(providerSystemTypeSchema.safeParse("analytics").success).toBe(true);
    expect(providerSystemTypeSchema.safeParse("advertising").success).toBe(
      true,
    );
    expect(providerSystemTypeSchema.safeParse("issue_tracking").success).toBe(
      true,
    );
    expect(providerSystemTypeSchema.safeParse("newsletter").success).toBe(true);
  });

  it("accepts template input policy metadata fields", () => {
    const result = templateInputSchema.safeParse({
      name: "Privacy Policy",
      content: "# Privacy Policy\n",
    });

    expect(result.success).toBe(true);
  });

  it("accepts template preview input and output", () => {
    expect(
      templatePreviewInputSchema.safeParse({
        name: "Security Policy",
        content: "# {{ company.name }}",
      }).success,
    ).toBe(true);
    expect(
      templatePreviewSchema.safeParse({
        renderedContent: "# Acme AI",
      }).success,
    ).toBe(true);
  });

  it("accepts document summaries with stale reasons and source fingerprints", () => {
    const result = documentSummarySchema.safeParse({
      template: {
        id: "template-1",
        organizationId: "org-1",
        name: "Subprocessors",
        slug: "subprocessors",
        sourceSystemTemplateSlug: null,
        content: "# {{ vendors.byService }}",
        versionMajor: 1,
        versionMinor: 0,
        createdAt: "2026-06-17T00:00:00.000Z",
        updatedAt: "2026-06-17T00:00:00.000Z",
      },
      document: {
        id: "document-1",
        organizationId: "org-1",
        templateId: "template-1",
        title: "Subprocessors",
        renderedContent: "# Subprocessors",
        hasPdf: false,
        sourceHash: "abc123",
        sourceFingerprint: {
          version: 1,
          contentHash: "content-hash",
          entries: [
            {
              path: "vendors.byService",
              label: "subprocessor list",
              valueHash: "value-hash",
              summary: {
                display: "Mixpanel",
                names: ["Mixpanel"],
              },
            },
          ],
        },
        templateVersionMajor: 1,
        templateVersionMinor: 0,
        generatedAt: "2026-06-17T00:00:00.000Z",
      },
      status: "stale",
      staleReasons: ["Mixpanel added to subprocessor list."],
      documents: [],
    });

    expect(result.success).toBe(true);
  });

  it("accepts template variable catalogs with collection item fields", () => {
    const result = templateVariableCatalogSchema.safeParse({
      version: 1,
      variables: [
        {
          key: "organization.name",
          label: "Organization name",
          type: "string",
          category: "Organization",
          description: "Legal or display name.",
          example: "Acme AI",
        },
        {
          key: "vendors.dataProcessors",
          label: "Data processors",
          type: "collection",
          category: "Vendors",
          itemFields: [
            {
              key: "name",
              label: "Name",
              type: "string",
              example: "GitHub",
            },
          ],
        },
      ],
    });

    expect(result.success).toBe(true);
  });
});
