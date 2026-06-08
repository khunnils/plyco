import {
  emptyCompanyProfile,
  emptyServiceProfile,
  type OrganizationLookupResult,
} from "@plyco/shared"
import { describe, expect, it } from "vitest"

import {
  MARKETING_WEBSITE_SERVICE_NAME,
  WEBSITE_ACTIVITY_NAME,
  WEBSITE_DATA_TYPE_NAME,
  draftFromLookup,
  fallbackDraft,
  onboardingComplianceGoalOptions,
  toProfileDraft,
} from "./types"

describe("onboarding profile helpers", () => {
  it("keeps Airtable-provided onboarding compliance goals", () => {
    expect(
      onboardingComplianceGoalOptions([
        { value: "soc_2", label: "SOC 2" },
        { value: "gdpr", label: "GDPR" },
        { value: "ccpa", label: "CCPA" },
        { value: "iso_27001", label: "ISO 27001" },
      ])
    ).toEqual([
      { value: "soc_2", label: "SOC 2" },
      { value: "gdpr", label: "GDPR" },
      { value: "ccpa", label: "CCPA" },
      { value: "iso_27001", label: "ISO 27001" },
    ])
  })

  it("adds the default marketing website data type and activity to fallback drafts", () => {
    const draft = fallbackDraft({
      name: "Acme",
      website: "https://acme.example",
    })

    expect(draft.websiteService).toMatchObject({
      serviceName: MARKETING_WEBSITE_SERVICE_NAME,
      serviceUrl: "https://acme.example",
    })
    expect(draft.dataTypes.map((dataType) => dataType.name)).toContain(
      WEBSITE_DATA_TYPE_NAME
    )
    expect(draft.activities.map((activity) => activity.name)).toContain(
      WEBSITE_ACTIVITY_NAME
    )
  })

  it("preserves lookup primary service and activities while adding website defaults", () => {
    const lookupResult: OrganizationLookupResult = {
      company: {
        ...emptyCompanyProfile,
        companyName: "Lookup Co",
        website: "https://lookup.example",
      },
      primaryService: {
        ...emptyServiceProfile,
        serviceName: "Lookup App",
        serviceUrl: "https://app.lookup.example",
      },
      dataTypes: [
        {
          name: "Lookup account data",
          description: "Account data from lookup.",
          subjectTypes: null,
          collectionMethods: null,
          isSensitive: null,
          isRequired: true,
        },
      ],
      activities: [
        {
          name: "Lookup activity",
          purpose: "Operate the lookup app.",
          role: "",
          legalBasis: [],
          dataTypeIds: [],
          retentionPolicy: null,
          retentionDays: 0,
        },
      ],
      suggestedProviders: [],
      policyLinks: [],
      privacyPolicyUrl: null,
      warnings: [],
    }
    const draft = draftFromLookup(
      { name: "Input Co", website: "https://input.example" },
      lookupResult
    )

    expect(draft.primaryService.serviceName).toBe("Lookup App")
    expect(draft.activities.map((activity) => activity.name)).toEqual([
      "Lookup activity",
      WEBSITE_ACTIVITY_NAME,
    ])
    expect(draft.dataTypes.map((dataType) => dataType.name)).toEqual([
      "Lookup account data",
      WEBSITE_DATA_TYPE_NAME,
    ])
  })

  it("maps primary and website activity ids to separate services", () => {
    const draft = fallbackDraft({
      name: "Acme",
      website: "https://acme.example",
    })
    const profile = toProfileDraft(draft, {
      primaryActivityIds: ["activity_primary"],
      websiteActivityIds: ["activity_website"],
    })

    expect(profile.services).toEqual([
      expect.objectContaining({
        serviceName: "Acme",
        businessActivityIds: ["activity_primary"],
      }),
      expect.objectContaining({
        serviceName: MARKETING_WEBSITE_SERVICE_NAME,
        businessActivityIds: ["activity_website"],
      }),
    ])
  })
})
