import {
  emptyAccessProfile,
  emptyCompanyProfile,
  emptyInfrastructureProfile,
  emptyPrivacyProfile,
  emptySecurityProfile,
  emptyServiceProfile,
  type CompanyProfile,
  type PrivacyProfile,
  type ServiceProfileInput,
  type StoredDataType,
  type BusinessActivityInput,
  type OrganizationLookupResult,
  type OrganizationProviderInput,
} from "@plyco/shared"
import { type ProfileDraft } from "@/features/company/types/company"

export type WizardStep =
  | "lookup-organization"
  | "lookup-privacy"
  | "identity"
  | "markets"
  | "compliance"
  | "providers"
  | "setup-review"

export type WizardDraft = {
  company: CompanyProfile
  primaryService: ServiceProfileInput
  websiteService: ServiceProfileInput
  dataTypes: StoredDataType[]
  activities: BusinessActivityInput[]
  privacy: PrivacyProfile
  privacyPolicyUrl: string | null
  suggestedProviderNames: string[]
  providers: OrganizationProviderInput[]
  warnings: string[]
}

export const stepOrder: WizardStep[] = [
  "identity",
  "markets",
  "compliance",
  "providers",
  "setup-review",
]

export const fallbackIndustryOptions = [
  { value: "artificial_intelligence", label: "Artificial Intelligence" },
  { value: "technology_saas", label: "Technology / SaaS" },
  { value: "healthcare", label: "Healthcare" },
  { value: "financial_services", label: "Financial Services" },
  { value: "edtech", label: "EdTech" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "professional_services", label: "Professional Services" },
]

export const fallbackComplianceGoalOptions = [
  { value: "soc_2", label: "SOC 2" },
  { value: "gdpr", label: "GDPR" },
]

export const onboardingComplianceGoalOptions = (
  options: Array<{ value: string; label: string }>
) => options

export const complianceGoalsForRegions = (
  regions: string[] | null | undefined
) => {
  const selectedRegions = regions ?? []
  const goals = new Set<string>()

  if (
    selectedRegions.some((region) =>
      ["us", "global", "apac", "latam", "mea"].includes(region)
    )
  ) {
    goals.add("soc_2")
  }

  if (
    selectedRegions.some((region) => ["eu", "uk", "global"].includes(region))
  ) {
    goals.add("gdpr")
  }

  return Array.from(goals)
}

export const defaultComplianceGoals = complianceGoalsForRegions([])

export const fallbackRegionOptions = [
  { value: "us", label: "United States" },
  { value: "eu", label: "European Union" },
  { value: "uk", label: "United Kingdom" },
  { value: "apac", label: "Asia Pacific" },
  { value: "latam", label: "Latin America" },
  { value: "mea", label: "Middle East & Africa" },
  { value: "global", label: "Global" },
]

export const MARKETING_WEBSITE_SERVICE_NAME = "Marketing website"
export const WEBSITE_DATA_TYPE_NAME = "Website visitor data"
export const WEBSITE_ACTIVITY_NAME = "Operate marketing website"

export const defaultDataType = (name: string): StoredDataType => ({
  sortOrder: 0,
  name: "Customer account data",
  description: `Basic account and usage data handled by ${name}.`,
  subjectTypes: null,
  collectionMethods: null,
  isSensitive: null,
  isRequired: true,
})

export const defaultWebsiteDataType = (): StoredDataType => ({
  sortOrder: 0,
  name: WEBSITE_DATA_TYPE_NAME,
  description:
    "Basic visitor, analytics, and inquiry data collected through the public website.",
  subjectTypes: null,
  collectionMethods: null,
  isSensitive: false,
  isRequired: true,
})

export const defaultActivity: BusinessActivityInput = {
  name: "Provide the primary service",
  purpose: "Operate the product, support users, and manage customer accounts.",
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
}

export const defaultWebsiteActivity: BusinessActivityInput = {
  name: WEBSITE_ACTIVITY_NAME,
  purpose:
    "Publish public pages, measure website usage, and handle inbound website inquiries.",
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
}

export const defaultWebsiteService = (
  website: string | null
): ServiceProfileInput => ({
  ...emptyServiceProfile,
  serviceName: MARKETING_WEBSITE_SERVICE_NAME,
  serviceDescription: "Public website for marketing and inbound inquiries.",
  serviceUrl: website,
})

export const isWebsiteDataType = (dataType: StoredDataType) =>
  dataType.name === WEBSITE_DATA_TYPE_NAME

export const isWebsiteActivity = (activity: BusinessActivityInput) =>
  activity.name === WEBSITE_ACTIVITY_NAME

const withWebsiteDataType = (dataTypes: StoredDataType[]) =>
  dataTypes.some(isWebsiteDataType)
    ? dataTypes
    : [...dataTypes, defaultWebsiteDataType()]

const withWebsiteActivity = (activities: BusinessActivityInput[]) =>
  activities.some(isWebsiteActivity)
    ? activities
    : [...activities, defaultWebsiteActivity]

export const fallbackDraft = ({
  name,
  website,
  warnings = [],
}: {
  name: string
  website: string
  warnings?: string[]
}): WizardDraft => ({
  company: {
    ...emptyCompanyProfile,
    companyName: name,
    legalEntityName: name,
    website,
    industries: [],
    regions: [],
    complianceGoals: defaultComplianceGoals,
  },
  primaryService: {
    ...emptyServiceProfile,
    serviceName: name,
    serviceDescription: "",
    serviceUrl: website,
  },
  websiteService: defaultWebsiteService(website),
  dataTypes: withWebsiteDataType([defaultDataType(name)]),
  activities: withWebsiteActivity([defaultActivity]),
  privacy: emptyPrivacyProfile,
  privacyPolicyUrl: null,
  suggestedProviderNames: [],
  providers: [],
  warnings,
})

export const draftFromLookup = (
  input: { name: string; website: string },
  result: OrganizationLookupResult
): WizardDraft => ({
  company: {
    ...emptyCompanyProfile,
    ...result.company,
    companyName: result.company.companyName || input.name,
    legalEntityName: result.company.legalEntityName || input.name,
    website: result.company.website || input.website,
    industries: result.company.industries ?? [],
    regions: result.company.regions ?? [],
    complianceGoals:
      result.company.complianceGoals &&
      result.company.complianceGoals.length > 0
        ? result.company.complianceGoals
        : complianceGoalsForRegions(result.company.regions),
  },
  primaryService: {
    ...emptyServiceProfile,
    ...result.primaryService,
    serviceName: result.primaryService.serviceName || input.name,
    serviceUrl: result.primaryService.serviceUrl || input.website,
  },
  websiteService: defaultWebsiteService(input.website),
  dataTypes: withWebsiteDataType(
    result.dataTypes.length > 0
      ? result.dataTypes
      : [defaultDataType(input.name)]
  ),
  activities: withWebsiteActivity(
    result.activities.length > 0 ? result.activities : [defaultActivity]
  ),
  privacy: emptyPrivacyProfile,
  privacyPolicyUrl: result.privacyPolicyUrl,
  suggestedProviderNames: result.suggestedProviders.map(
    (provider) => provider.name
  ),
  providers: [],
  warnings: result.warnings,
})

export const mergeLookupDraft = (
  current: WizardDraft,
  input: { name: string; website: string },
  result: OrganizationLookupResult
): WizardDraft => {
  const lookupDraft = draftFromLookup(input, result)

  return {
    ...lookupDraft,
    company: {
      ...lookupDraft.company,
      regions: current.company.regions,
      complianceGoals: current.company.complianceGoals,
    },
    privacy: current.privacy,
    websiteService: current.websiteService,
    providers: current.providers,
    warnings: [...current.warnings, ...lookupDraft.warnings],
  }
}

export const toProfileDraft = (
  draft: WizardDraft,
  {
    primaryActivityIds,
    websiteActivityIds,
  }: {
    primaryActivityIds: string[]
    websiteActivityIds: string[]
  }
): ProfileDraft => {
  const onboardingProviders = (draft.providers || []).flatMap((provider) =>
    provider.systemTypes.map((systemType) => ({
      providerId: provider.providerId,
      systemType,
      name: provider.name,
    }))
  )

  const infrastructureProviders = onboardingProviders.filter((p) =>
    ["ai", "cloud", "source_control", "auth", "password_manager", "issue_tracking"].includes(p.systemType)
  )

  const privacyProviders = onboardingProviders.filter((p) =>
    ["newsletter"].includes(p.systemType)
  )

  return {
    company: draft.company,
    services: [
      {
        ...draft.primaryService,
        businessActivityIds: primaryActivityIds,
      },
      {
        ...draft.websiteService,
        businessActivityIds: websiteActivityIds,
      },
    ],
    privacy: {
      ...draft.privacy,
      organizationProviders: privacyProviders,
    },
    infrastructure: {
      ...emptyInfrastructureProfile,
      organizationProviders: infrastructureProviders,
    },
    security: emptySecurityProfile,
    dataHandling: {
      dataTypesStored: draft.dataTypes,
    },
    access: emptyAccessProfile,
  }
}

export const normalizeUrl = (value: string) => {
  const trimmed = value.trim()

  if (!trimmed) {
    return trimmed
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export const stepNumber = (step: WizardStep) => {
  const index = stepOrder.indexOf(step)

  return index >= 0 ? index + 1 : 0
}

export const optionLabels = (
  values: string[] | null,
  options: Array<{ value: string; label: string }>,
  fallback = "Not selected"
) =>
  values && values.length > 0
    ? values
        .map(
          (value) =>
            options.find((option) => option.value === value)?.label ?? value
        )
        .join(", ")
    : fallback
