import { describe, expect, it } from "vitest"

import { createApp } from "../src/app.js"
import {
  evaluateAdvisorRules,
  parseAdvisorRuleFile,
  StaticAdvisorRuleSource,
  type AdvisorRule,
} from "../src/features/recommendations/rules.js"
import {
  createTestApp,
  profileBody,
  saveProfileDraft,
  serviceBody,
} from "./helpers.js"

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
}

const organization = ({
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
} as const)

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
`)

    expect(rules).toEqual([mfaRule])
  })

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
    })

    expect(response.recommendations).toMatchObject([
      {
        id: "security.mfa_required",
        severity: "high",
      },
    ])
    expect(response.countsBySeverity).toEqual({
      low: 0,
      medium: 0,
      high: 1,
      critical: 0,
    })
  })

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
    })

    expect(response.recommendations).toEqual([])
  })

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
    })

    expect(response.recommendations).toMatchObject([
      { id: "security.mfa_required", severity: "high" },
    ])
  })

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
    })

    expect(response.recommendations).toEqual([])
  })

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
    })

    expect(response.recommendations).toEqual([])
  })

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
            in: [null, "none", "not_defined"],
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
          scanningCadence: null,
        },
        privacy: {
          ...organization.privacy,
          crossBorderTransfers: true,
          transferMechanisms: [],
        },
      },
    )

    expect(response.recommendations.map((recommendation) => recommendation.id))
      .toEqual([
        "privacy.gdpr_transfer_mechanism_missing",
        "security.vulnerability_scanning_missing",
      ])
  })

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
          title: "Non-essential tracking cookies need stronger consent transparency",
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
                    field: "privacy.cookieTrackingCategories",
                    includesAny: ["analytics", "marketing", "advertising"],
                  },
                  {
                    any: [
                      {
                        field: "privacy.cookieConsentMechanism",
                        in: [null, "none", "not_set"],
                      },
                      {
                        field:
                          "privacy.nonEssentialCookiesBlockedUntilConsent",
                        in: [null, false],
                      },
                      {
                        field: "privacy.cookieRejectAsEasyAsAccept",
                        in: [null, false],
                      },
                      {
                        field: "privacy.cookieConsentNoPretickedBoxes",
                        in: [null, false],
                      },
                      {
                        field: "privacy.cookieConsentWithdrawalMethod",
                        empty: true,
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
            "Confirm the service blocks non-essential cookies until consent, offers rejection as easily as acceptance, avoids pre-ticked boxes, and has a clear withdrawal method. Cookie purposes, providers, and durations should be available through the configured consent mechanism.",
          relatedFields: [
            "services.all.privacy.cookieConsentMechanism",
            "services.all.privacy.nonEssentialCookiesBlockedUntilConsent",
            "services.all.privacy.cookieRejectAsEasyAsAccept",
            "services.all.privacy.cookieConsentNoPretickedBoxes",
            "services.all.privacy.cookieConsentWithdrawalMethod",
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
              cookieTrackingCategories: ["analytics"],
              cookieConsentMechanism: null,
              nonEssentialCookiesBlockedUntilConsent: null,
              cookieRejectAsEasyAsAccept: null,
              cookieConsentWithdrawalMethod: null,
              cookieConsentNoPretickedBoxes: null,
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
    )

    expect(response.recommendations.map((recommendation) => recommendation.id))
      .toEqual([
        "vendors.processor_dpa_missing",
        "privacy.cookies_tracking_without_consent",
      ])
  })

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
                    field: "privacy.cookieTrackingCategories",
                    includesAny: ["analytics", "marketing", "advertising"],
                  },
                  {
                    any: [
                      {
                        field: "privacy.cookieConsentMechanism",
                        in: [null, "none", "not_set"],
                      },
                      {
                        field:
                          "privacy.nonEssentialCookiesBlockedUntilConsent",
                        in: [null, false],
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
          relatedFields: ["services.all.privacy.cookieTrackingCategories"],
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
              cookieTrackingCategories: ["necessary"],
              cookieConsentMechanism: null,
              nonEssentialCookiesBlockedUntilConsent: null,
            },
          },
        ],
      },
    )

    expect(response.recommendations).toEqual([])
  })
})

describe("recommendations API", () => {
  it("returns empty recommendations when the organization has no profile", async () => {
    const app = await createApp({
      auth: false,
      advisorRuleSource: new StaticAdvisorRuleSource([mfaRule]),
    })

    const response = await app.inject({
      method: "GET",
      url: "/organizations/org-test/recommendations",
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      recommendations: [],
      countsBySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
    })
  })

  it("evaluates recommendations for the current organization profile", async () => {
    const app = await createTestApp()
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
      })

    const response = await app.inject({
      method: "GET",
      url: "/organizations/org-test/recommendations",
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      recommendations: [
        {
          id: "security.mfa_required",
          severity: "high",
        },
      ],
      countsBySeverity: {
        high: 1,
      },
    })
  })
})
