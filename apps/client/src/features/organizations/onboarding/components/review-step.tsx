import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { usePostHog } from "@posthog/react"
import {
  type AuthState,
  type OrganizationProviderInput,
} from "@plyco/shared"

import { POSTHOG_EVENTS } from "@/lib/posthog-events"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useOnboardingStore } from "../stores/onboarding-store"
import { CreateShell } from "../../components/create-shell"
import { ReviewCompanyTab } from "./review-company-tab"
import { ReviewServiceTab } from "./review-service-tab"
import { ReviewDataTypesTab } from "./review-data-types-tab"
import { ReviewActivitiesTab } from "./review-activities-tab"
import { useVocabulary } from "@/features/vocabulary/hooks/use-vocabulary"
import { codeOptions } from "@/features/vocabulary/lib/vocabulary"
import { useCurrentOrganizationStore } from "@/features/organizations/stores/current-organization-store"
import {
  createBusinessActivity,
  createOrganization,
  createOrganizationProvider,
  saveAccessProfile,
  saveCompanyProfile,
  saveDataProfile,
  saveInfrastructureProfile,
  savePrivacyProfile,
  saveSecurityProfileSection,
  saveServicesProfile,
} from "@/lib/api"
import { authStateQueryKey, organizationSnapshotQueryKey } from "@/lib/query-keys"
import {
  MARKETING_WEBSITE_SERVICE_NAME,
  WEBSITE_DATA_TYPE_NAME,
  fallbackComplianceGoalOptions,
  fallbackRegionOptions,
  isWebsiteActivity,
  onboardingComplianceGoalOptions,
  toProfileDraft,
} from "../../components/types"

const ENRICHED_REGIONS: Record<string, { description: string; icon: string }> =
  {
    global: {
      description: "US-based or broadly global operations.",
      icon: "globe",
    },
    us: {
      description: "North American domestic market and regulatory compliance.",
      icon: "us",
    },
    eu: {
      description: "EMEA focus with GDPR and regional policy adherence.",
      icon: "eu",
    },
    uk: {
      description: "UK market presence and UK GDPR alignment.",
      icon: "uk",
    },
    apac: {
      description: "APAC fast-growing markets and local compliance needs.",
      icon: "apac",
    },
    latam: {
      description: "LATAM presence and emerging data protection frameworks.",
      icon: "latam",
    },
    mea: {
      description: "MEA operations and localized compliance standards.",
      icon: "mea",
    },
  }

const ENRICHED_COMPLIANCE: Record<
  string,
  { description: string; icon: string }
> = {
  soc_2: {
    description: "Security, availability, and confidentiality trust standard.",
    icon: "shield",
  },
  gdpr: {
    description: "European standard for data protection and privacy rights.",
    icon: "gdpr",
  },
  ccpa: {
    description: "California privacy rights and disclosure expectations.",
    icon: "shield",
  },
  iso_27001: {
    description: "Information security management system standard.",
    icon: "shield-check",
  },
}

type SetupTab = "company" | "service" | "data-types" | "activities"

const setupTabs: Array<{ value: SetupTab; label: string }> = [
  { value: "company", label: "Company" },
  { value: "service", label: "Primary Service" },
  { value: "data-types", label: "Data Types" },
  { value: "activities", label: "Activities" },
]

const providerKey = (provider: OrganizationProviderInput) =>
  provider.name.trim().toLowerCase()

const mergeOrganizationProviders = (providers: OrganizationProviderInput[]) => {
  const merged = new Map<string, OrganizationProviderInput>()

  for (const provider of providers) {
    const key = providerKey(provider)
    const current = merged.get(key)

    if (!current) {
      merged.set(key, provider)
      continue
    }

    merged.set(key, {
      ...current,
      providerId: current.providerId || provider.providerId,
      systemTypes: Array.from(
        new Set([...current.systemTypes, ...provider.systemTypes])
      ),
      legalName: current.legalName || provider.legalName,
      category: current.category || provider.category,
      countryOfRegistration:
        current.countryOfRegistration || provider.countryOfRegistration,
      notes: current.notes || provider.notes,
      purpose: current.purpose || provider.purpose,
    })
  }

  return Array.from(merged.values())
}

export const ReviewStep = () => {
  const navigate = useNavigate()
  const posthog = usePostHog()
  const {
    draft,
    submitError,
    setSubmitError,
    isSubmitting,
    setIsSubmitting,
  } = useOnboardingStore()

  const [setupTab, setSetupTab] = useState<SetupTab>("company")
  const queryClient = useQueryClient()

  const vocabulary = useVocabulary(Boolean(draft))
  const complianceGoalOptions = codeOptions(vocabulary.data, "compliance_goals")
  const goalOptions = onboardingComplianceGoalOptions(
    complianceGoalOptions.length > 0
      ? complianceGoalOptions
      : fallbackComplianceGoalOptions
  ).map((option) => {
    const enriched = ENRICHED_COMPLIANCE[option.value] || {
      description: "Compliance and security reporting framework standard.",
      icon: "shield",
    }
    return {
      ...option,
      ...enriched,
    }
  })

  const allowedRegionValues = ["global", "eu"]
  const vocabularyRegionOptions = codeOptions(vocabulary.data, "regions")
  const regionOptions = (
    vocabularyRegionOptions.length > 0
      ? vocabularyRegionOptions
      : fallbackRegionOptions
  )
    .filter((option) => allowedRegionValues.includes(option.value))
    .map((option) => ({
      ...option,
      label: option.value === "global" ? "US / Global" : option.label,
      ...ENRICHED_REGIONS[option.value],
    }))

  useEffect(() => {
    if (!draft) {
      navigate("../identity", { replace: true })
    }
  }, [draft, navigate])

  if (!draft) {
    return null
  }

  const finishSetup = async () => {
    if (!draft.primaryService.serviceName?.trim()) {
      setSubmitError("Service name is required.")
      return
    }

    if (
      draft.dataTypes.length === 0 ||
      draft.dataTypes.some((dataType) => !dataType.name.trim())
    ) {
      setSubmitError("Add at least one data type with a name.")
      return
    }

    if (
      draft.activities.length === 0 ||
      draft.activities.some((activity) => !activity.name.trim())
    ) {
      setSubmitError("Add at least one activity with a name.")
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const organization = await createOrganization({
        name: draft.company.companyName,
        website: draft.company.website || undefined,
      })
      const store = useCurrentOrganizationStore.getState()
      store.selectOrganization(organization.id)

      const initialProfile = toProfileDraft(draft, {
        primaryActivityIds: [],
        websiteActivityIds: [],
      })
      await saveCompanyProfile(organization.id, initialProfile.company)
      await saveServicesProfile(organization.id, initialProfile.services)
      const initialSnapshot = await saveDataProfile(
        organization.id,
        initialProfile.dataHandling
      )
      await savePrivacyProfile(organization.id, initialProfile.privacy)
      await saveInfrastructureProfile(
        organization.id,
        initialProfile.infrastructure
      )
      await saveSecurityProfileSection(organization.id, initialProfile.security)
      await saveAccessProfile(organization.id, initialProfile.access)
      const websiteDataTypeId =
        initialSnapshot.organization?.dataHandling.dataTypesStored.find(
          (dataType) => dataType.name === WEBSITE_DATA_TYPE_NAME
        )?.id
      const websiteService = initialSnapshot.organization?.services.find(
        (service) => service.serviceName === MARKETING_WEBSITE_SERVICE_NAME
      )
      const primaryService = initialSnapshot.organization?.services.find(
        (service) => service.id !== websiteService?.id
      )

      if (!websiteDataTypeId || !websiteService || !primaryService) {
        throw new Error("Could not create the default website service.")
      }

      const activities = await Promise.all(
        draft.activities.map(async (activity) => ({
          input: activity,
          activity: await createBusinessActivity(
            organization.id,
            isWebsiteActivity(activity)
              ? { ...activity, dataTypeIds: [websiteDataTypeId] }
              : activity
          ),
        }))
      )
      const primaryActivityIds = activities
        .filter(({ input }) => !isWebsiteActivity(input))
        .map(({ activity }) => activity.id)
      const websiteActivityIds = activities
        .filter(({ input }) => isWebsiteActivity(input))
        .map(({ activity }) => activity.id)

      const organizationProviders = mergeOrganizationProviders(
        draft.providers || []
      )

      if (organizationProviders.length > 0) {
        await Promise.all(
          organizationProviders.map((provider) =>
            createOrganizationProvider(organization.id, provider)
          )
        )
      }

      const profile = toProfileDraft(
        {
          ...draft,
          primaryService: {
            ...draft.primaryService,
            id: primaryService.id,
          },
          websiteService: {
            ...draft.websiteService,
            id: websiteService.id,
          },
        },
        {
          primaryActivityIds,
          websiteActivityIds,
        }
      )
      await saveCompanyProfile(organization.id, profile.company)
      await saveServicesProfile(organization.id, profile.services)
      await saveDataProfile(organization.id, profile.dataHandling)
      await savePrivacyProfile(organization.id, profile.privacy)
      await saveInfrastructureProfile(organization.id, profile.infrastructure)
      await saveSecurityProfileSection(organization.id, profile.security)
      const snapshot = await saveAccessProfile(organization.id, profile.access)

      queryClient.setQueryData(
        organizationSnapshotQueryKey(organization.id),
        snapshot
      )
      // Auth must include the new org before leaving onboarding, otherwise App
      // stays on the no-organization tree and shows the activate placeholder.
      queryClient.setQueryData<AuthState>(authStateQueryKey, (current) => {
        if (!current?.user) {
          return current
        }

        if (
          current.organizations.some(
            (existing) => existing.id === organization.id
          )
        ) {
          return current
        }

        return {
          ...current,
          organizations: [...current.organizations, organization],
        }
      })
      posthog.capture(POSTHOG_EVENTS.ORGANIZATION_CREATED, {
        organization_id: organization.id,
        organization_name: draft.company.companyName,
        compliance_goals: draft.company.complianceGoals,
        regions: draft.company.regions,
      })
      toast.success("Organization created")
      // Read from the store at completion time — a render-time onComplete can
      // stay undefined for first-time onboarding even after auth refreshes.
      useOnboardingStore.getState().onComplete?.()
      navigate("/", { replace: true })
      void queryClient.invalidateQueries({ queryKey: authStateQueryKey })
      void queryClient.invalidateQueries({
        queryKey: organizationSnapshotQueryKey(organization.id),
      })
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Could not create organization"
      )
      toast.error("Could not create organization")
      setIsSubmitting(false)
    }
  }

  const handleBack = () => {
    navigate("../providers")
  }

  const footer = (
    <div className="flex items-center justify-between border-t border-slate-200 pt-5">
      <Button
        disabled={isSubmitting}
        type="button"
        variant="outline"
        onClick={handleBack}
      >
        <ArrowLeft />
        Back
      </Button>
      <Button
        className="bg-slate-900 text-white hover:bg-slate-800 focus-visible:border-slate-950 focus-visible:ring-slate-100"
        disabled={isSubmitting}
        type="button"
        onClick={finishSetup}
      >
        {isSubmitting && <Loader2 className="animate-spin" />}
        Create workspace
      </Button>
    </div>
  )

  return (
    <CreateShell
      onBack={handleBack}
      step="setup-review"
      titleAbove
      description="We've taken a first stab at defining a starting service with an initial set of datatypes and activities. You can add additional services later."
      title="Review workspace setup"
    >
      <section className="grid gap-6">
        <Tabs
          className="h-120 min-h-0 gap-6"
          value={setupTab}
          onValueChange={(value) => setSetupTab(value as SetupTab)}
        >
          <TabsList variant="line">
            {setupTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent
            className="mt-0 min-h-0 overflow-hidden border-0 p-0 shadow-none"
            value="company"
          >
            <ReviewCompanyTab
              regionOptions={regionOptions}
              goalOptions={goalOptions}
            />
          </TabsContent>

          <TabsContent
            className="mt-0 min-h-0 overflow-hidden border-0 p-0 shadow-none"
            value="service"
          >
            <ReviewServiceTab regionOptions={regionOptions} />
          </TabsContent>

          <TabsContent
            className="mt-0 min-h-0 overflow-hidden border-0 p-0 shadow-none"
            value="data-types"
          >
            <ReviewDataTypesTab />
          </TabsContent>

          <TabsContent
            className="mt-0 min-h-0 overflow-hidden border-0 p-0 shadow-none"
            value="activities"
          >
            <ReviewActivitiesTab />
          </TabsContent>
        </Tabs>

        {submitError ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {submitError}
          </p>
        ) : null}
        {footer}
      </section>
    </CreateShell>
  )
}
