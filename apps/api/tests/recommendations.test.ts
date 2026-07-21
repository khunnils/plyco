import { describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import {
  evaluateAdvisorRules,
  FileSystemAdvisorRuleSource,
  parseAdvisorRuleFile,
  StaticAdvisorRuleSource,
  type AdvisorRule,
} from "../src/features/recommendations/rules.js";
import { InMemoryRuleSuppressionRepository } from "../src/features/recommendations/in-memory-repository.js";
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
  it("returns baseline and selected-goal rules with every evaluation status", () => {
    const makeRule = (
      id: string,
      overrides: Partial<AdvisorRule> = {},
    ): AdvisorRule => ({
      id,
      title: id,
      category: "access",
      severity: "medium",
      frameworks: [],
      condition: { field: "access.sharedAccountsExist", equals: false },
      message: `${id} message`,
      recommendation: `${id} recommendation`,
      relatedFields: [],
      ...overrides,
    });
    const result = evaluateAdvisorRules(
      [
        makeRule("baseline.failing"),
        makeRule("baseline.passing", {
          condition: { field: "access.sharedAccountsExist", equals: true },
        }),
        makeRule("baseline.missing", {
          condition: { field: "access.unknown", equals: true },
        }),
        makeRule("baseline.not_applicable", {
          appliesWhen: {
            field: "privacy.crossBorderTransfers",
            equals: true,
          },
        }),
        makeRule("gdpr.hidden", { frameworks: ["gdpr"] }),
        makeRule("soc.visible", { frameworks: ["soc_2"] }),
      ],
      {
        ...organization,
        company: { ...organization.company, complianceGoals: ["soc_2"] },
        privacy: { ...organization.privacy, crossBorderTransfers: false },
      },
      { suppressedRuleIds: ["baseline.passing"] },
    );

    expect(result.rules.map(({ id, status }) => [id, status])).toEqual([
      ["baseline.failing", "failing"],
      ["baseline.passing", "suppressed"],
      ["baseline.missing", "missing_data"],
      ["baseline.not_applicable", "not_applicable"],
      ["soc.visible", "failing"],
    ]);
    expect(result.countsByStatus).toEqual({
      all: 5,
      failing: 2,
      missingData: 1,
      passing: 0,
      notApplicable: 1,
      suppressed: 1,
    });
    expect(result.recommendations.map(({ id }) => id)).toEqual([
      "baseline.failing",
      "soc.visible",
    ]);
  });

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
      const rules = conditions.map((condition, index): AdvisorRule => ({
        id: `security.unset_operator_${index}`,
        title: "Scanning needs attention",
        category: "security",
        severity: "high",
        frameworks: ["soc_2"],
        condition,
        message: "Scanning needs attention.",
        recommendation: "Configure scanning.",
        relatedFields: ["securityProfile.scanningCadence"],
      }));
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
        category: "access",
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
        category: "privacy",
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
        category: "privacy",
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

  it("calculates severity-weighted overall and area scores", () => {
    const rules: AdvisorRule[] = [
      {
        id: "score.critical_pass",
        title: "Critical passing check",
        category: "security",
        severity: "critical",
        frameworks: [],
        condition: {
          field: "securityProfile.codeReviewRequired",
          equals: false,
        },
        message: "Critical passing check.",
        recommendation: "Keep the control in place.",
        relatedFields: ["securityProfile.codeReviewRequired"],
      },
      {
        id: "score.high_fail",
        title: "High failing check",
        category: "security",
        severity: "high",
        frameworks: [],
        condition: {
          field: "security.authentication.mfaRequired",
          equals: false,
        },
        message: "High failing check.",
        recommendation: "Enable the control.",
        relatedFields: ["security.authentication.mfaRequired"],
      },
      {
        id: "score.medium_pass",
        title: "Medium passing check",
        category: "privacy",
        severity: "medium",
        frameworks: [],
        condition: {
          field: "privacy.retentionPolicyExists",
          equals: true,
        },
        message: "Medium passing check.",
        recommendation: "Keep the control in place.",
        relatedFields: ["privacy.retentionPolicyExists"],
      },
      {
        id: "score.low_fail",
        title: "Low failing check",
        category: "access",
        severity: "low",
        frameworks: [],
        condition: {
          field: "access.sharedAccountsExist",
          equals: true,
        },
        message: "Low failing check.",
        recommendation: "Remove shared accounts.",
        relatedFields: ["access.sharedAccountsExist"],
      },
    ];
    const response = evaluateAdvisorRules(rules, {
      ...organization,
      access: {
        ...organization.access,
        mfaRequired: false,
        sharedAccountsExist: true,
      },
    });

    expect(response.recommendations.map(({ id }) => id)).toEqual([
      "score.high_fail",
      "score.low_fail",
    ]);
    expect(response.scores.overall).toEqual({
      value: 67,
      assessedRuleCount: 4,
      applicableRuleCount: 4,
    });
    expect(response.scores.byArea.security).toEqual({
      value: 67,
      assessedRuleCount: 2,
      applicableRuleCount: 2,
    });
    expect(response.scores.byArea.privacy.value).toBe(100);
    expect(response.scores.byArea.access.value).toBe(0);
    expect(response.scores.byArea.productAndData.value).toBeNull();
  });

  it("pools product, data, service, and vendor rules into one score", () => {
    const rules: AdvisorRule[] = [
      {
        id: "score.activity_fail",
        title: "Activity check",
        category: "activities",
        severity: "high",
        frameworks: [],
        condition: { field: "company.handlesPii", equals: true },
        message: "Activity check.",
        recommendation: "Review activities.",
        relatedFields: ["company.handlesPii"],
      },
      {
        id: "score.data_pass",
        title: "Data check",
        category: "data",
        severity: "medium",
        frameworks: [],
        condition: { field: "company.handlesSensitiveData", equals: false },
        message: "Data check.",
        recommendation: "Review data.",
        relatedFields: ["company.handlesSensitiveData"],
      },
      {
        id: "score.service_pass",
        title: "Service check",
        category: "services",
        severity: "medium",
        frameworks: [],
        condition: { field: "company.storesPii", equals: false },
        message: "Service check.",
        recommendation: "Review services.",
        relatedFields: ["company.storesPii"],
      },
      {
        id: "score.vendor_fail",
        title: "Vendor check",
        category: "vendors",
        severity: "high",
        frameworks: [],
        condition: { field: "company.storesHealthcareData", equals: false },
        message: "Vendor check.",
        recommendation: "Review vendors.",
        relatedFields: ["company.storesHealthcareData"],
      },
    ];
    const response = evaluateAdvisorRules(rules, organization);

    expect(response.scores.byArea.productAndData).toEqual({
      value: 33,
      assessedRuleCount: 4,
      applicableRuleCount: 4,
    });
    expect(response.scores.overall).toEqual(
      response.scores.byArea.productAndData,
    );
  });

  it("counts applicable unanswered rules as coverage without lowering scores", () => {
    const passingRule: AdvisorRule = {
      id: "score.passing",
      title: "Passing check",
      category: "access",
      severity: "high",
      frameworks: [],
      condition: {
        field: "access.mfaRequired",
        equals: false,
      },
      message: "Passing check.",
      recommendation: "Keep MFA enabled.",
      relatedFields: ["access.mfaRequired"],
    };
    const incompleteRule: AdvisorRule = {
      id: "score.incomplete",
      title: "Incomplete check",
      category: "access",
      severity: "high",
      frameworks: [],
      condition: {
        field: "access.securityTrainingRequired",
        equals: false,
      },
      message: "Incomplete check.",
      recommendation: "Answer the control.",
      relatedFields: ["access.securityTrainingRequired"],
    };
    const response = evaluateAdvisorRules([passingRule, incompleteRule], {
      ...organization,
      access: {
        ...organization.access,
        mfaRequired: true,
        securityTrainingRequired: null,
      },
    });

    expect(response.recommendations).toEqual([]);
    expect(response.scores.overall).toEqual({
      value: 100,
      assessedRuleCount: 1,
      applicableRuleCount: 2,
    });
    expect(response.scores.byArea.access).toEqual(response.scores.overall);
  });

  it("excludes rules whose applicability is false or unanswered", () => {
    const gatedRule: AdvisorRule = {
      ...mfaRule,
      id: "score.gated",
    };
    const wrongGoal = evaluateAdvisorRules([gatedRule], {
      ...organization,
      company: { ...organization.company, complianceGoals: ["gdpr"] },
      access: { ...organization.access, mfaRequired: false },
    });
    const unansweredGoal = evaluateAdvisorRules([gatedRule], {
      ...organization,
      company: { ...organization.company, complianceGoals: null },
      access: { ...organization.access, mfaRequired: false },
    });

    expect(wrongGoal.scores.overall.applicableRuleCount).toBe(0);
    expect(unansweredGoal.scores.overall.applicableRuleCount).toBe(0);
    expect(wrongGoal.scores.overall.value).toBeNull();
    expect(unansweredGoal.scores.overall.value).toBeNull();
  });

  it("returns 100 for a passing assessed rule and 0 for a failing one", () => {
    const rule: AdvisorRule = {
      id: "score.binary",
      title: "Binary check",
      category: "security",
      severity: "high",
      frameworks: [],
      condition: {
        field: "security.authentication.mfaRequired",
        equals: false,
      },
      message: "Binary check.",
      recommendation: "Enable MFA.",
      relatedFields: ["security.authentication.mfaRequired"],
    };
    const passing = evaluateAdvisorRules([rule], {
      ...organization,
      access: { ...organization.access, mfaRequired: true },
    });
    const failing = evaluateAdvisorRules([rule], {
      ...organization,
      access: { ...organization.access, mfaRequired: false },
    });

    expect(passing.scores.overall.value).toBe(100);
    expect(failing.scores.overall.value).toBe(0);
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
      serviceProviderUsage: [incompleteProviderUsage, completeProviderUsage],
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
    const incompleteCollection = evaluateAdvisorRules(
      rules.filter((rule) => rule.id === "vendors.processor_dpa_missing"),
      completeRiskProfile,
      {
        businessActivities,
        serviceProviderUsage: [incompleteProviderUsage],
      },
    );
    expect(
      incompleteCollection.recommendations.some(
        ({ id }) => id === "vendors.processor_dpa_missing",
      ),
    ).toBe(false);
    expect(incompleteCollection.scores.byArea.productAndData).toEqual({
      value: null,
      assessedRuleCount: 0,
      applicableRuleCount: 1,
    });
  });
});

describe("recommendations API", () => {
  it("returns empty recommendations when the organization has no profile", async () => {
    const app = await createApp({
      auth: false,
      advisorRuleSource: new StaticAdvisorRuleSource([mfaRule]),
      ruleSuppressionRepository: new InMemoryRuleSuppressionRepository(),
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
      scores: {
        overall: {
          value: null,
          assessedRuleCount: 0,
          applicableRuleCount: 0,
        },
        byArea: {
          security: {
            value: null,
            assessedRuleCount: 0,
            applicableRuleCount: 0,
          },
          privacy: {
            value: null,
            assessedRuleCount: 0,
            applicableRuleCount: 0,
          },
          access: {
            value: null,
            assessedRuleCount: 0,
            applicableRuleCount: 0,
          },
          infrastructure: {
            value: null,
            assessedRuleCount: 0,
            applicableRuleCount: 0,
          },
          productAndData: {
            value: null,
            assessedRuleCount: 0,
            applicableRuleCount: 0,
          },
        },
      },
      rules: [],
      countsByStatus: {
        all: 0,
        failing: 0,
        missingData: 0,
        passing: 0,
        notApplicable: 0,
        suppressed: 0,
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

  it("suppresses and restores a known rule idempotently", async () => {
    const app = await createTestApp();
    await saveProfileDraft(app);

    for (const method of ["PUT", "PUT"] as const) {
      const response = await app.inject({
        method,
        url: "/organizations/org-test/rule-suppressions/security.mfa_required",
      });
      expect(response.statusCode).toBe(204);
    }

    const suppressed = await app.inject({
      method: "GET",
      url: "/organizations/org-test/recommendations",
    });
    expect(
      suppressed
        .json()
        .rules.find(
          (rule: { id: string }) => rule.id === "security.mfa_required",
        ).status,
    ).toBe("suppressed");

    for (const method of ["DELETE", "DELETE"] as const) {
      const response = await app.inject({
        method,
        url: "/organizations/org-test/rule-suppressions/security.mfa_required",
      });
      expect(response.statusCode).toBe(204);
    }

    const restored = await app.inject({
      method: "GET",
      url: "/organizations/org-test/recommendations",
    });
    expect(
      restored
        .json()
        .rules.find(
          (rule: { id: string }) => rule.id === "security.mfa_required",
        ).status,
    ).not.toBe("suppressed");

    const unknown = await app.inject({
      method: "PUT",
      url: "/organizations/org-test/rule-suppressions/unknown.rule",
    });
    expect(unknown.statusCode).toBe(404);
  });
});
