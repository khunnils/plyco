import { describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import {
  evaluateAdvisorRules,
  FileSystemAdvisorRuleSource,
  parseAdvisorRuleFile,
  StaticAdvisorRuleSource,
  type AdvisorRule,
} from "../src/features/recommendations/rules.js";
import {
  createTestApp,
  profileBody,
  saveProfileDraft,
  serviceBody,
} from "./helpers.js";

const mfaRule: AdvisorRule = {
  id: "security.mfa_required",
  title: "MFA is not required",
  category: "security",
  severity: "high",
  frameworks: ["soc_2", "iso_27001"],
  appliesWhen: {
    anyComplianceGoal: ["soc_2", "iso_27001"],
  },
  condition: {
    any: [
      {
        field: "security.authentication.mfaRequired",
        equals: false,
      },
      {
        field: "infrastructure.mfaEnabled",
        equals: false,
      },
    ],
  },
  message: "Multi-factor authentication is not required.",
  recommendation: "Require MFA for workforce and administrative access.",
  relatedFields: [
    "security.authentication.mfaRequired",
    "infrastructure.mfaEnabled",
  ],
};

const organization = {
  id: "org-test",
  ...profileBody,
  services: [
    {
      id: "service-platform",
      ...serviceBody,
      businessActivityIds: [],
      createdAt: "2026-05-15T00:00:00.000Z",
      updatedAt: "2026-05-15T00:00:00.000Z",
    },
  ],
  createdAt: "2026-05-15T00:00:00.000Z",
  updatedAt: "2026-05-15T00:00:00.000Z",
} as const;

describe("recommendation rules", () => {
  it("parses YAML rule files", () => {
    const rules = parseAdvisorRuleFile(`
- id: security.mfa_required
  title: MFA is not required
  category: security
  severity: high
  frameworks: [soc_2, iso_27001]
  appliesWhen:
    anyComplianceGoal: [soc_2, iso_27001]
  condition:
    any:
      - field: security.authentication.mfaRequired
        equals: false
      - field: infrastructure.mfaEnabled
        equals: false
  message: Multi-factor authentication is not required.
  recommendation: Require MFA for workforce and administrative access.
  relatedFields:
    - security.authentication.mfaRequired
    - infrastructure.mfaEnabled
`);

    expect(rules).toEqual([mfaRule]);
  });

  it("rejects null comparison values in YAML rules", () => {
    expect(() =>
      parseAdvisorRuleFile(`
- id: security.invalid_null_check
  title: Invalid null check
  category: security
  severity: high
  condition:
    field: access.mfaRequired
    in: [null, false]
  message: Invalid rule.
  recommendation: Invalid rule.
`),
    ).toThrowError(/invalid/i);
  });

  it("returns an MFA recommendation when MFA is false and SOC 2 is a goal", () => {
    const response = evaluateAdvisorRules([mfaRule], {
      ...organization,
      access: {
        ...organization.access,
        mfaRequired: false,
      },
      company: {
        ...organization.company,
        complianceGoals: ["soc_2"],
      },
    });

    expect(response.recommendations).toMatchObject([
      {
        id: "security.mfa_required",
        severity: "high",
      },
    ]);
    expect(response.countsBySeverity).toEqual({
      low: 0,
      medium: 0,
      high: 1,
      critical: 0,
    });
  });

  it("does not return the MFA recommendation when MFA is true", () => {
    const response = evaluateAdvisorRules([mfaRule], {
      ...organization,
      access: {
        ...organization.access,
        mfaRequired: true,
      },
      company: {
        ...organization.company,
        complianceGoals: ["soc_2"],
      },
    });

    expect(response.recommendations).toEqual([]);
  });

  it("returns an MFA recommendation when infrastructure MFA is disabled", () => {
    const response = evaluateAdvisorRules([mfaRule], {
      ...organization,
      access: {
        ...organization.access,
        mfaRequired: true,
      },
      infrastructure: {
        ...organization.infrastructure,
        mfaEnabled: false,
      },
      company: {
        ...organization.company,
        complianceGoals: ["soc_2"],
      },
    });

    expect(response.recommendations).toMatchObject([
      { id: "security.mfa_required", severity: "high" },
    ]);
  });

  it("does not return the MFA recommendation when compliance goals do not match", () => {
    const response = evaluateAdvisorRules([mfaRule], {
      ...organization,
      access: {
        ...organization.access,
        mfaRequired: false,
      },
      company: {
        ...organization.company,
        complianceGoals: ["gdpr"],
      },
    });

    expect(response.recommendations).toEqual([]);
  });

  it("does not treat unanswered MFA as false", () => {
    const response = evaluateAdvisorRules([mfaRule], {
      ...organization,
      access: {
        ...organization.access,
        mfaRequired: null,
      },
      company: {
        ...organization.company,
        complianceGoals: ["soc_2"],
      },
    });

    expect(response.recommendations).toEqual([]);
  });

  it("requires every alternative input to be answered before matching any", () => {
    const response = evaluateAdvisorRules([mfaRule], {
      ...organization,
      access: {
        ...organization.access,
        mfaRequired: false,
      },
      infrastructure: {
        ...organization.infrastructure,
        mfaEnabled: null,
      },
      company: {
        ...organization.company,
        complianceGoals: ["soc_2"],
      },
    });

    expect(response.recommendations).toEqual([]);
  });

  it.each([null, undefined, ""])(
    "does not match unset field value %s with field operators",
    (unsetValue) => {
      const conditions: AdvisorRule["condition"][] = [
        { field: "securityProfile.scanningCadence", equals: false },
        { field: "securityProfile.scanningCadence", in: ["none"] },
        { field: "securityProfile.scanningCadence", notIn: ["weekly"] },
        { field: "securityProfile.scanningCadence", empty: true },
        {
          field: "securityProfile.scanningCadence",
          includesAny: ["none"],
        },
      ];
      const rules = conditions.map(
        (condition, index): AdvisorRule => ({
          id: `security.unset_operator_${index}`,
          title: "Scanning needs attention",
          category: "security",
          severity: "high",
          frameworks: ["soc_2"],
          condition,
          message: "Scanning needs attention.",
          recommendation: "Configure scanning.",
          relatedFields: ["securityProfile.scanningCadence"],
        }),
      );
      const profileWithUnsetValue = {
        ...organization,
        security: {
          ...organization.security,
          scanningCadence: unsetValue,
        },
      } as unknown as NonNullable<Parameters<typeof evaluateAdvisorRules>[1]>;
      const response = evaluateAdvisorRules(rules, profileWithUnsetValue);

      expect(response.recommendations).toEqual([]);
    },
  );

  it("treats false, zero, and an explicit empty array as defined", () => {
    const rules: AdvisorRule[] = [
      {
        id: "defined.false",
        title: "False is defined",
        category: "test",
        severity: "low",
        frameworks: [],
        condition: { field: "access.mfaRequired", equals: false },
        message: "False is defined.",
        recommendation: "Review the answer.",
        relatedFields: ["access.mfaRequired"],
      },
      {
        id: "defined.zero",
        title: "Zero is defined",
        category: "test",
        severity: "low",
        frameworks: [],
        condition: { field: "privacy.responseTimelineDays", equals: 0 },
        message: "Zero is defined.",
        recommendation: "Review the answer.",
        relatedFields: ["privacy.responseTimelineDays"],
      },
      {
        id: "defined.empty_array",
        title: "An empty array is defined",
        category: "test",
        severity: "low",
        frameworks: [],
        condition: { field: "privacy.supportedRights", empty: true },
        message: "An empty array is defined.",
        recommendation: "Review the answer.",
        relatedFields: ["privacy.supportedRights"],
      },
    ];
    const response = evaluateAdvisorRules(rules, {
      ...organization,
      access: { ...organization.access, mfaRequired: false },
      privacy: {
        ...organization.privacy,
        responseTimelineDays: 0,
        supportedRights: [],
      },
    });

    expect(response.recommendations.map(({ id }) => id)).toEqual([
      "defined.false",
      "defined.zero",
      "defined.empty_array",
    ]);
  });

  it("supports in, empty, nested all, and appliesWhen predicates", () => {
    const response = evaluateAdvisorRules(
      [
        {
          id: "privacy.gdpr_transfer_mechanism_missing",
          title: "Cross-border transfer mechanism is missing",
          category: "privacy",
          severity: "high",
          frameworks: ["gdpr"],
          appliesWhen: {
            all: [
              { anyComplianceGoal: ["gdpr"] },
              { field: "privacy.crossBorderTransfers", equals: true },
            ],
          },
          condition: {
            field: "privacy.transferMechanisms",
            empty: true,
          },
          message:
            "Cross-border transfers are enabled, but no transfer mechanism is recorded.",
          recommendation:
            "Document the transfer mechanism used for international personal data transfers.",
          relatedFields: [
            "privacy.crossBorderTransfers",
            "privacy.transferMechanisms",
          ],
        },
        {
          id: "security.vulnerability_scanning_missing",
          title: "Vulnerability scanning is not configured",
          category: "security",
          severity: "high",
          frameworks: ["soc_2"],
          appliesWhen: { anyComplianceGoal: ["soc_2"] },
          condition: {
            field: "security.vulnerabilityManagement.scanningCadence",
            in: ["none", "not_defined"],
          },
          message: "Vulnerability scanning is not configured.",
          recommendation: "Configure recurring vulnerability scanning.",
          relatedFields: ["security.vulnerabilityManagement.scanningCadence"],
        },
      ],
      {
        ...organization,
        company: {
          ...organization.company,
          complianceGoals: ["gdpr", "soc_2"],
        },
        security: {
          ...organization.security,
          scanningCadence: "none",
        },
        privacy: {
          ...organization.privacy,
          crossBorderTransfers: true,
          transferMechanisms: [],
        },
      },
    );

    expect(
      response.recommendations.map((recommendation) => recommendation.id),
    ).toEqual([
      "privacy.gdpr_transfer_mechanism_missing",
      "security.vulnerability_scanning_missing",
    ]);
  });

  it("supports collection predicates and notIn", () => {
    const response = evaluateAdvisorRules(
      [
        {
          id: "vendors.processor_dpa_missing",
          title: "Data processor is missing DPA status",
          category: "vendors",
          severity: "high",
          frameworks: ["gdpr", "soc_2"],
          condition: {
            any: {
              collection: "vendors.dataProcessors",
              where: {
                all: [
                  {
                    field: "dataProcessingLevel",
                    in: ["limited", "subprocessor"],
                  },
                  {
                    field: "dpaStatus",
                    notIn: ["signed", "not_required"],
                  },
                ],
              },
            },
          },
          message:
            "A provider processing customer or user data is missing a signed or not-required DPA status.",
          recommendation: "Confirm each data processor has processing terms.",
          relatedFields: ["vendors.dataProcessors"],
        },
        {
          id: "privacy.cookies_tracking_without_consent",
          title:
            "Non-essential tracking cookies need stronger consent transparency",
          category: "privacy",
          severity: "high",
          frameworks: ["gdpr"],
          condition: {
            any: {
              collection: "services.all",
              where: {
                all: [
                  {
                    field: "privacy.usesCookiesOrTrackingTechnologies",
                    equals: true,
                  },
                  {
                    any: {
                      collection: "privacy.cookieCategories",
                      where: {
                        field: "requiresConsent",
                        equals: true,
                      },
                    },
                  },
                  {
                    any: [
                      {
                        field: "privacy.cookieConsentMechanism",
                        in: ["none", "not_set"],
                      },
                      {
                        field: "privacy.nonEssentialCookiesBlockedUntilConsent",
                        equals: false,
                      },
                      {
                        field: "privacy.cookieConsentWithdrawalMethod",
                        empty: true,
                      },
                      {
                        field: "privacy.globalPrivacyControlSupported",
                        equals: false,
                      },
                    ],
                  },
                ],
              },
            },
          },
          message:
            "A service uses non-essential tracking cookies without complete consent transparency.",
          recommendation:
            "Confirm the service blocks consent-required cookies until consent, provides a consent mechanism and withdrawal method, and supports Global Privacy Control.",
          relatedFields: [
            "services.all.privacy.cookieConsentMechanism",
            "services.all.privacy.nonEssentialCookiesBlockedUntilConsent",
            "services.all.privacy.cookieConsentWithdrawalMethod",
            "services.all.privacy.globalPrivacyControlSupported",
          ],
        },
      ],
      {
        ...organization,
        services: [
          {
            ...organization.services[0],
            privacy: {
              ...organization.services[0].privacy,
              usesCookiesOrTrackingTechnologies: true,
              cookieCategories: [
                {
                  category: "analytics",
                  requiresConsent: true,
                },
              ],
              cookieConsentMechanism: "none",
              nonEssentialCookiesBlockedUntilConsent: false,
              cookieConsentWithdrawalMethod: "none",
              globalPrivacyControlSupported: false,
            },
          },
        ],
      },
      {
        serviceProviderUsage: [
          {
            id: "usage-1",
            serviceId: "service-platform",
            serviceName: "Acme AI Platform",
            organizationProviderId: "provider-1",
            providerName: "Processor",
            systemType: null,
            purpose: "Processing",
            dataProcessingLevel: "limited",
            dataProcessed: ["Customer account data"],
            dpaStatus: "under_review",
            dataRegions: ["us"],
            notes: "",
            createdAt: "2026-05-15T00:00:00.000Z",
            updatedAt: "2026-05-15T00:00:00.000Z",
          },
        ],
      },
    );

    expect(
      response.recommendations.map((recommendation) => recommendation.id),
    ).toEqual([
      "vendors.processor_dpa_missing",
      "privacy.cookies_tracking_without_consent",
    ]);
  });

  it("does not flag necessary-only cookies for non-essential consent transparency", () => {
    const response = evaluateAdvisorRules(
      [
        {
          id: "privacy.cookies_tracking_without_consent",
          title:
            "Non-essential tracking cookies need stronger consent transparency",
          category: "privacy",
          severity: "high",
          frameworks: ["gdpr"],
          condition: {
            any: {
              collection: "services.all",
              where: {
                all: [
                  {
                    field: "privacy.usesCookiesOrTrackingTechnologies",
                    equals: true,
                  },
                  {
                    any: {
                      collection: "privacy.cookieCategories",
                      where: {
                        field: "requiresConsent",
                        equals: true,
                      },
                    },
                  },
                  {
                    any: [
                      {
                        field: "privacy.cookieConsentMechanism",
                        in: ["none", "not_set"],
                      },
                      {
                        field: "privacy.nonEssentialCookiesBlockedUntilConsent",
                        equals: false,
                      },
                    ],
                  },
                ],
              },
            },
          },
          message:
            "A service uses non-essential tracking cookies without complete consent transparency.",
          recommendation:
            "Confirm the service blocks non-essential cookies until consent.",
          relatedFields: ["services.all.privacy.cookieCategories"],
        },
      ],
      {
        ...organization,
        services: [
          {
            ...organization.services[0],
            privacy: {
              ...organization.services[0].privacy,
              usesCookiesOrTrackingTechnologies: true,
              cookieCategories: [
                {
                  category: "necessary",
                  requiresConsent: false,
                },
              ],
              cookieConsentMechanism: null,
              nonEssentialCookiesBlockedUntilConsent: null,
            },
          },
        ],
      },
    );

    expect(response.recommendations).toEqual([]);
  });

  it("loads and can trigger every shipped rule with complete inputs", async () => {
    const rules = await new FileSystemAdvisorRuleSource().listRules();
    const completeRiskProfile = {
      ...organization,
      company: {
        ...organization.company,
        complianceGoals: ["gdpr", "ccpa", "soc_2", "iso_27001"],
        handlesSensitiveData: false,
      },
      services: [
        {
          ...organization.services[0],
          privacy: {
            ...organization.services[0].privacy,
            usesCookiesOrTrackingTechnologies: true,
            cookieCategories: [
              { category: "analytics" as const, requiresConsent: true },
            ],
            cookieConsentMechanism: "none",
            nonEssentialCookiesBlockedUntilConsent: false,
            cookieConsentWithdrawalMethod: "none",
            globalPrivacyControlSupported: false,
          },
        },
      ],
      privacy: {
        ...organization.privacy,
        supportedRights: [],
        requestMethods: [],
        responseTimelineDaysStatus: "not_defined",
        sendsMarketingEmails: true,
        marketingOptOutMethod: "none",
        crossBorderTransfers: true,
        transferMechanisms: [],
        productionDataInDevelopment: true,
        retentionPolicyExists: false,
      },
      infrastructure: {
        ...organization.infrastructure,
        mfaEnabled: false,
        encryptedDevicesRequired: false,
        backupsEnabled: false,
        centralizedLoggingEnabled: false,
        securityMonitoring: "none",
        vendorReviewRequired: false,
        dpaRequiredForProcessors: false,
        encryptionAtRest: false,
        encryptionInTransit: false,
      },
      security: {
        ...organization.security,
        codeReviewRequired: false,
        dependencySecurityMonitoring: false,
        secretScanning: false,
        automatedTestingBeforeDeployment: false,
        cicdDeploymentProcess: false,
        productionDeploymentApprovalRequired: false,
        scanningCadence: "none",
        penetrationTestingStrategy: "none",
        patchingSlaCriticalDaysStatus: "not_defined",
        patchingSlaHighDaysStatus: "not_defined",
        vulnerabilityDisclosureProgramExists: false,
        incidentResponsePlanExists: false,
        incidentNotificationTimeline: "none",
        customerNotificationProcess: "none",
      },
      access: {
        ...organization.access,
        mfaRequired: false,
        sharedAccountsExist: true,
        offboardingProcessExists: false,
        accessReviewsPerformed: false,
        leastPrivilege: false,
        roleBasedAccess: false,
        adminApprovalRequired: false,
        passwordManagerRequired: false,
        securityTrainingRequired: false,
        confidentialityAgreementsRequired: false,
      },
    };
    const businessActivities = [
      {
        id: "activity-ai",
        sortOrder: 0,
        name: "AI support",
        purpose: "Support customers",
        role: "controller",
        legalBasis: ["contract"],
        dataTypeIds: [],
        retentionPolicy: "not_defined",
        retentionDays: 0,
        usesAi: true,
        aiUseCases: "Draft support replies",
        aiCustomerDataUsedForTraining: true,
        aiCustomerDataSentToProviders: true,
        aiHumanReviewOfOutputs: false,
        aiUsersInformedWhenUsed: false,
        createdAt: "2026-05-15T00:00:00.000Z",
        updatedAt: "2026-05-15T00:00:00.000Z",
      },
    ];
    const incompleteProviderUsage = {
      id: "usage-incomplete",
      serviceId: "service-platform",
      serviceName: "Acme AI Platform",
      organizationProviderId: "provider-incomplete",
      providerName: "Incomplete processor",
      systemType: null,
      purpose: "Processing",
      dataProcessingLevel: "limited" as const,
      dataProcessed: ["Customer account data"],
      dpaStatus: null,
      dataRegions: ["us"],
      notes: "",
      createdAt: "2026-05-15T00:00:00.000Z",
      updatedAt: "2026-05-15T00:00:00.000Z",
    };
    const completeProviderUsage = {
      ...incompleteProviderUsage,
      id: "usage-complete",
      organizationProviderId: "provider-complete",
      providerName: "Complete processor",
      dpaStatus: "under_review" as const,
    };
    const first = evaluateAdvisorRules(rules, completeRiskProfile, {
      businessActivities,
      serviceProviderUsage: [
        incompleteProviderUsage,
        completeProviderUsage,
      ],
    });
    const second = evaluateAdvisorRules(
      rules,
      {
        ...completeRiskProfile,
        services: [
          {
            ...completeRiskProfile.services[0],
            privacy: {
              ...completeRiskProfile.services[0].privacy,
              cookieCategories: [],
            },
          },
        ],
        security: {
          ...completeRiskProfile.security,
          incidentResponsePlanExists: true,
        },
      },
      { businessActivities, serviceProviderUsage: [completeProviderUsage] },
    );
    const triggeredIds = new Set(
      [...first.recommendations, ...second.recommendations].map(({ id }) => id),
    );

    expect([...triggeredIds].sort()).toEqual(rules.map(({ id }) => id));
    expect(
      evaluateAdvisorRules(rules, completeRiskProfile, {
        businessActivities,
        serviceProviderUsage: [incompleteProviderUsage],
      }).recommendations.some(({ id }) => id === "vendors.processor_dpa_missing"),
    ).toBe(false);
  });
});

describe("recommendations API", () => {
  it("returns empty recommendations when the organization has no profile", async () => {
    const app = await createApp({
      auth: false,
      advisorRuleSource: new StaticAdvisorRuleSource([mfaRule]),
    });

    const response = await app.inject({
      method: "GET",
      url: "/organizations/org-test/recommendations",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      recommendations: [],
      countsBySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
    });
  });

  it("evaluates recommendations for the current organization profile", async () => {
    const app = await createTestApp();
    await saveProfileDraft(app, "org-test", {
      ...profileBody,
      company: {
          ...profileBody.company,
          complianceGoals: ["soc_2"],
        },
        infrastructure: {
        ...profileBody.infrastructure,
        mfaEnabled: false,
      },
    });

    const response = await app.inject({
      method: "GET",
      url: "/organizations/org-test/recommendations",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "security.mfa_required",
          severity: "high",
        }),
      ]),
    );
    expect(body.countsBySeverity.high).toBe(4);
  });
});
