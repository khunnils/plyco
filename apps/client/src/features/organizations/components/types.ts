import {
  emptyAccessProfile,
  emptyCompanyProfile,
  emptyInfrastructureProfile,
  emptyPrivacyProfile,
  emptyServiceProfile,
  type CompanyProfile,
  type ServiceProfileInput,
  type StoredDataType,
  type BusinessActivityInput,
  type OrganizationLookupResult,
} from "@plyco/shared"
import { type ProfileDraft } from "@/features/company/types/company"

export type WizardStep =
  | "lookup"
  | "identity"
  | "markets"
  | "compliance"
  | "review"

export type WizardDraft = {
  company: CompanyProfile
  primaryService: ServiceProfileInput
  primaryDataType: StoredDataType
  primaryActivity: BusinessActivityInput
  suggestedProviderNames: string[]
  warnings: string[]
}

export const stepOrder: WizardStep[] = ["identity", "markets", "compliance", "review"]

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

export const fallbackRegionOptions = [
  { value: "us", label: "United States" },
  { value: "eu", label: "European Union" },
  { value: "uk", label: "United Kingdom" },
  { value: "apac", label: "Asia Pacific" },
  { value: "latam", label: "Latin America" },
  { value: "mea", label: "Middle East & Africa" },
  { value: "global", label: "Global" },
]

export const defaultDataType = (name: string): StoredDataType => ({
  name: "Customer account data",
  description: `Basic account and usage data handled by ${name}.`,
  subjectTypes: null,
  collectionMethods: null,
  isSensitive: null,
  isRequired: true,
})

export const defaultActivity: BusinessActivityInput = {
  name: "Provide the primary service",
  purpose: "Operate the product, support users, and manage customer accounts.",
  role: "",
  legalBasis: [],
  retentionPolicy: null,
  retentionDays: 0,
}

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
    complianceGoals: [],
  },
  primaryService: {
    ...emptyServiceProfile,
    serviceName: name,
    serviceDescription: "",
    serviceUrl: website,
  },
  primaryDataType: defaultDataType(name),
  primaryActivity: defaultActivity,
  suggestedProviderNames: [],
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
    complianceGoals: result.company.complianceGoals ?? [],
  },
  primaryService: {
    ...emptyServiceProfile,
    ...result.primaryService,
    serviceName: result.primaryService.serviceName || input.name,
    serviceUrl: result.primaryService.serviceUrl || input.website,
  },
  primaryDataType: result.primaryDataType.name
    ? result.primaryDataType
    : defaultDataType(input.name),
  primaryActivity: result.primaryActivity.name
    ? result.primaryActivity
    : defaultActivity,
  suggestedProviderNames: result.suggestedProviders.map(
    (provider) => provider.name
  ),
  warnings: result.warnings,
})

export const toProfileDraft = (
  draft: WizardDraft,
  businessActivityId: string
): ProfileDraft => ({
  company: draft.company,
  services: [
    {
      ...draft.primaryService,
      businessActivityIds: [businessActivityId],
    },
  ],
  privacy: emptyPrivacyProfile,
  infrastructure: emptyInfrastructureProfile,
  dataHandling: {
    dataTypesStored: [draft.primaryDataType],
  },
  access: emptyAccessProfile,
})

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
