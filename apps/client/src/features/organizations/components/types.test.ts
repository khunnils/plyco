import {
  emptyCompanyProfile,
  emptyServiceProfile,
  type OrganizationLookupResult,
} from "@plyco/contracts"
import { describe, expect, it } from "vitest"

import {
  MARKETING_WEBSITE_SERVICE_NAME,
  WEBSITE_ACTIVITY_NAME,
  WEBSITE_DATA_TYPE_NAME,
  activitiesWithSavedDataTypes,
  complianceGoalsForRegions,
  draftFromLookup,
  fallbackDraft,
  onboardingComplianceGoalOptions,
  onboardingDataProfile,
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

  it("defaults compliance goals from simplified onboarding regions", () => {
    expect(complianceGoalsForRegions(["global"])).toEqual([
      "iso_27001",
      "soc_2",
    ])
    expect(complianceGoalsForRegions(["us"])).toEqual([
      "soc_2",
      "iso_27001",
      "ccpa",
    ])
    expect(complianceGoalsForRegions(["eu"])).toEqual(["gdpr", "iso_27001"])
    expect(complianceGoalsForRegions(["global", "us", "eu"])).toEqual([
      "iso_27001",
      "soc_2",
      "ccpa",
      "gdpr",
    ])
  })

  it("adds the default marketing website data type and activity to fallback drafts", () => {
    const draft = fallbackDraft({
      name: "Acme",
      website: "https://acme.example",
    })

    expect(draft.websiteService).toMatchObject({
      processesCustomerData: false,
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
          sortOrder: 0,
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
          usesAi: null,
          aiUseCases: "",
          aiCustomerDataUsedForTraining: null,
          aiCustomerDataSentToProviders: null,
          aiHumanReviewOfOutputs: null,
          aiUsersInformedWhenUsed: null,
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
        processesCustomerData: true,
        serviceName: "Acme",
        businessActivityIds: ["activity_primary"],
      }),
      expect.objectContaining({
        processesCustomerData: false,
        serviceName: MARKETING_WEBSITE_SERVICE_NAME,
        businessActivityIds: ["activity_website"],
      }),
    ])
  })

  it("translates grouped lookup references to saved data-type ids by name, not order", () => {
    const draft = fallbackDraft({
      name: "Acme",
      website: "https://acme.example",
    })
    draft.dataTypes = [
      { ...draft.dataTypes[0], id: "lookup-account", name: "Account data" },
      { ...draft.dataTypes[0], id: "lookup-contact", name: "Contact data" },
      draft.dataTypes[1],
    ]
    draft.activities = [
      {
        ...draft.activities[0],
        name: "Account management",
        dataTypeIds: ["lookup-account", "lookup-contact"],
      },
      {
        ...draft.activities[0],
        name: "Support",
        dataTypeIds: ["lookup-contact"],
      },
      draft.activities[1],
    ]
    const savedDataTypes = [
      { ...draft.dataTypes[1], id: "saved-contact" },
      { ...draft.dataTypes[2], id: "saved-website" },
      { ...draft.dataTypes[0], id: "saved-account" },
    ]

    expect(
      onboardingDataProfile(draft).dataTypesStored.every(
        (dataType) => !("id" in dataType)
      )
    ).toBe(true)
    const activities = activitiesWithSavedDataTypes(draft, savedDataTypes)
    expect(activities.map((activity) => activity.dataTypeIds)).toEqual([
      ["saved-account", "saved-contact"],
      ["saved-contact"],
      ["saved-website"],
    ])
    expect(draft.activities[0].dataTypeIds).toEqual([
      "lookup-account",
      "lookup-contact",
    ])
    const finalProfile = toProfileDraft(
      { ...draft, dataTypes: savedDataTypes, activities },
      {
        primaryActivityIds: ["activity-account", "activity-support"],
        websiteActivityIds: ["activity-website"],
      }
    )
    expect(finalProfile.dataHandling.dataTypesStored).toEqual(savedDataTypes)
  })

  it("preserves renamed data-category references and drops deleted categories", () => {
    const draft = fallbackDraft({
      name: "Acme",
      website: "https://acme.example",
    })
    draft.dataTypes[0] = {
      ...draft.dataTypes[0],
      id: "lookup-account",
      name: "  Renamed account data  ",
    }
    draft.activities[0] = {
      ...draft.activities[0],
      dataTypeIds: ["lookup-account", "lookup-deleted", "lookup-account"],
    }
    const savedDataTypes = draft.dataTypes.map((dataType, index) => ({
      ...dataType,
      id: `saved-${index}`,
      name: dataType.name.trim(),
    }))
    expect(
      activitiesWithSavedDataTypes(draft, savedDataTypes)[0].dataTypeIds
    ).toEqual(["saved-0"])
  })

  it("fails before activity creation if a reviewed data type has no saved id", () => {
    const draft = fallbackDraft({
      name: "Acme",
      website: "https://acme.example",
    })
    expect(() => activitiesWithSavedDataTypes(draft, draft.dataTypes)).toThrow(
      "Could not save onboarding data types."
    )
  })
})
