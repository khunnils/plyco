import {
  emptyServiceProfile,
  type BusinessActivity,
  type OrganizationProvider,
  type ServiceProfileInput,
  type ServiceProviderUsage,
  type ServiceProviderUsageInput,
  type Vocabulary,
} from "@plyco/shared"
import { useEffect, useState } from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { hasCookieCategoriesRequiringConsent } from "@/features/company/services/lib/cookie-requirements"
import {
  type ProfileDraft,
  type SaveProfile,
} from "@/features/company/types/company"
import {
  isAnswered,
  serviceProgress,
} from "@/features/dashboard/lib/progress"
import { type Option } from "@/features/vocabulary/lib/vocabulary"
import { AddServiceForm } from "./add-service-form"
import { ServiceActivitiesPanel } from "./panels/service-activities-panel"
import { ServiceAudiencePanel } from "./panels/service-audience-panel"
import { ServiceBasicsPanel } from "./panels/service-basics-panel"
import { ServiceCookieCategoriesPanel } from "./panels/service-cookie-categories-panel"
import { ServiceCookieConsentPanel } from "./panels/service-cookie-consent-panel"
import { ServiceHostingPanel } from "./panels/service-hosting-panel"
import { ServiceProviderUsagePanel } from "./panels/service-provider-usage-panel"

export const ServiceManager = ({
  businessActivities,
  businessActivityOptions,
  cookieConsentMechanismOptions,
  cookieConsentWithdrawalMethodOptions,
  customerTypeOptions,
  dataProcessingLevelOptions,
  dataRegionOptions,
  dataTypeOptions,
  dpaStatusOptions,
  isCreatingService,
  isProfileMutationPending,
  isVendorMutationPending,
  profile,
  regionOptions,
  selectedServiceId,
  serviceProviderUsage,
  userTypeOptions,
  organizationProviders,
  vocabulary,
  onCancelCreateService,
  onCreateProviderUsage,
  onDeleteProviderUsage,
  onServiceCreated,
  onServiceUpdated,
  onSaveProfile,
  onSelectService,
  onUpdateProviderUsage,
}: {
  businessActivities: BusinessActivity[]
  businessActivityOptions: Option[]
  cookieConsentMechanismOptions: Option[]
  cookieConsentWithdrawalMethodOptions: Option[]
  customerTypeOptions: Option[]
  dataProcessingLevelOptions: Option[]
  dataRegionOptions: Option[]
  dataTypeOptions: Array<{ value: string; label: string }>
  dpaStatusOptions: Option[]
  isCreatingService: boolean
  isProfileMutationPending: boolean
  isVendorMutationPending: boolean
  profile: ProfileDraft
  regionOptions: Option[]
  selectedServiceId: string | null
  serviceProviderUsage: ServiceProviderUsage[]
  userTypeOptions: Option[]
  organizationProviders: OrganizationProvider[]
  vocabulary: Vocabulary | undefined
  onCancelCreateService: () => void
  onCreateProviderUsage: (
    providerUsage: ServiceProviderUsageInput,
    onSuccess?: () => void
  ) => void
  onDeleteProviderUsage: (providerUsage: ServiceProviderUsage) => void
  onServiceCreated?: (service: ServiceProfileInput) => void
  onServiceUpdated?: (
    service: ServiceProfileInput,
    changedFields: string[]
  ) => void
  onSaveProfile: SaveProfile
  onSelectService: (id: string | null) => void
  onUpdateProviderUsage: (
    input: {
      id: string
      providerUsage: ServiceProviderUsageInput
    },
    onSuccess?: () => void
  ) => void
}) => {
  const selectedIndex = Math.max(
    profile.services.findIndex((service) => service.id === selectedServiceId),
    0
  )
  const selectedService = profile.services[selectedIndex] ?? emptyServiceProfile

  const activitiesCount = selectedService.businessActivityIds?.length ?? 0
  const selectedServiceUses = selectedService.id
    ? serviceProviderUsage.filter(
        (providerUsage) => providerUsage.serviceId === selectedService.id
      )
    : []
  const providersCount = selectedServiceUses.length
  const cookiesEnabled =
    selectedService.privacy.usesCookiesOrTrackingTechnologies === true
  const cookieCategories = selectedService.privacy.cookieCategories ?? []
  const progress = serviceProgress(selectedService, serviceProviderUsage)

  const getNeedsAttention = (sectionTitle: string) => {
    const section = progress.sections.find((s) => s.title === sectionTitle)
    if (!section) return false
    return (
      section.totalFields > 0 && section.completedFields < section.totalFields
    )
  }

  // General progress omits the cookies toggle, which lives on the Basics panel.
  const basicsNeedsAttention =
    getNeedsAttention("General") ||
    !isAnswered(selectedService.privacy.usesCookiesOrTrackingTechnologies)

  // Audience progress includes business activities (Activities tab); exclude them here.
  const audienceNeedsAttention =
    !isAnswered(selectedService.userTypes) ||
    !isAnswered(selectedService.customerTypes) ||
    !isAnswered(selectedService.availabilityRegions) ||
    !isAnswered(selectedService.childrenDirected) ||
    (selectedService.childrenDirected === true &&
      !isAnswered(selectedService.minimumUserAge, { zeroMeansUnset: true }))

  const cookieCategoriesNeedsAttention =
    cookieCategories.length === 0 ||
    cookieCategories.some((category) => !isAnswered(category.requiresConsent))

  const cookieConsentNeedsAttention =
    !isAnswered(selectedService.privacy.cookieConsentMechanism) ||
    !isAnswered(
      selectedService.privacy.nonEssentialCookiesBlockedUntilConsent
    ) ||
    !isAnswered(selectedService.privacy.cookieConsentWithdrawalMethod) ||
    !isAnswered(selectedService.privacy.globalPrivacyControlSupported)

  const [activeTab, setActiveTab] = useState<
    "details" | "activities" | "providers"
  >("details")
  const [prevSelectedServiceId, setPrevSelectedServiceId] =
    useState(selectedServiceId)

  if (selectedServiceId !== prevSelectedServiceId) {
    setPrevSelectedServiceId(selectedServiceId)
    setActiveTab("details")
  }

  useEffect(() => {
    if (
      !isCreatingService &&
      profile.services.length > 0 &&
      !profile.services.some((service) => service.id === selectedServiceId)
    ) {
      const nextServiceId = profile.services[0]?.id ?? null

      if (selectedServiceId !== nextServiceId) {
        onSelectService(nextServiceId)
      }
    }
  }, [isCreatingService, onSelectService, profile.services, selectedServiceId])

  const saveServicePatch = (
    patch: Partial<ServiceProfileInput>,
    onSuccess?: () => void
  ) => {
    const nextService = {
      ...selectedService,
      ...patch,
    }
    onSaveProfile(
      {
        ...profile,
        services: profile.services.map((currentService, index) =>
          index === selectedIndex ? nextService : currentService
        ),
      },
      () => {
        onServiceUpdated?.(nextService, Object.keys(patch))
        onSuccess?.()
      }
    )
  }

  const createService = (service: ServiceProfileInput) => {
    onSaveProfile(
      {
        ...profile,
        services: [...profile.services, service],
      },
      (snapshot) => {
        const createdService = snapshot.organization?.services.at(-1)

        onServiceCreated?.(createdService ?? service)
        onSelectService(createdService?.id ?? null)
        onCancelCreateService()
      }
    )
  }

  if (isCreatingService) {
    return (
      <AddServiceForm
        isMutationPending={isProfileMutationPending}
        onCancel={onCancelCreateService}
        onSubmit={createService}
      />
    )
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(val) =>
        setActiveTab(val as "details" | "activities" | "providers")
      }
      className="grid gap-6"
    >
      <TabsList
        variant="line"
        className="h-auto w-full justify-start gap-6 overflow-visible rounded-none border-b border-slate-200 p-0"
      >
        <TabsTrigger
          value="details"
          className="h-auto rounded-none px-0 pt-0 pb-3 font-medium text-slate-500 group-data-horizontal/tabs:after:bottom-0 data-active:font-semibold data-active:text-slate-900"
        >
          Service details
        </TabsTrigger>
        <TabsTrigger
          value="activities"
          className="h-auto rounded-none px-0 pt-0 pb-3 font-medium text-slate-500 group-data-horizontal/tabs:after:bottom-0 data-active:font-semibold data-active:text-slate-900"
        >
          Service Activities ({activitiesCount})
        </TabsTrigger>
        <TabsTrigger
          value="providers"
          className="h-auto rounded-none px-0 pt-0 pb-3 font-medium text-slate-500 group-data-horizontal/tabs:after:bottom-0 data-active:font-semibold data-active:text-slate-900"
        >
          Service Providers ({providersCount})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="mt-0">
        <div className="grid gap-10">
          <ServiceBasicsPanel
            isMutationPending={isProfileMutationPending}
            needsAttention={basicsNeedsAttention}
            service={selectedService}
            onSave={saveServicePatch}
          />
          <ServiceAudiencePanel
            customerTypeOptions={customerTypeOptions}
            isMutationPending={isProfileMutationPending}
            needsAttention={audienceNeedsAttention}
            regionOptions={regionOptions}
            service={selectedService}
            userTypeOptions={userTypeOptions}
            vocabulary={vocabulary}
            onSave={saveServicePatch}
          />
          <ServiceHostingPanel
            isMutationPending={isProfileMutationPending}
            needsAttention={getNeedsAttention("Service Hosting")}
            regionOptions={regionOptions}
            service={selectedService}
            vocabulary={vocabulary}
            onSave={saveServicePatch}
          />
          {cookiesEnabled ? (
            <>
              <ServiceCookieCategoriesPanel
                isMutationPending={isProfileMutationPending}
                needsAttention={cookieCategoriesNeedsAttention}
                service={selectedService}
                onSave={saveServicePatch}
              />
              {hasCookieCategoriesRequiringConsent(
                selectedService.privacy.cookieCategories
              ) ? (
                <ServiceCookieConsentPanel
                  cookieConsentMechanismOptions={cookieConsentMechanismOptions}
                  cookieConsentWithdrawalMethodOptions={
                    cookieConsentWithdrawalMethodOptions
                  }
                  isMutationPending={isProfileMutationPending}
                  needsAttention={cookieConsentNeedsAttention}
                  service={selectedService}
                  vocabulary={vocabulary}
                  onSave={saveServicePatch}
                />
              ) : null}
            </>
          ) : null}
        </div>
      </TabsContent>

      <TabsContent value="activities" className="mt-0">
        <ServiceActivitiesPanel
          businessActivities={businessActivities}
          businessActivityOptions={businessActivityOptions}
          isMutationPending={isProfileMutationPending}
          service={selectedService}
          vocabulary={vocabulary}
          onSave={saveServicePatch}
        />
      </TabsContent>

      <TabsContent value="providers" className="mt-0">
        <ServiceProviderUsagePanel
          dataProcessingLevelOptions={dataProcessingLevelOptions}
          dataRegionOptions={dataRegionOptions}
          dataTypeOptions={dataTypeOptions}
          dpaStatusOptions={dpaStatusOptions}
          isMutationPending={isVendorMutationPending}
          service={selectedService}
          serviceProviderUsage={serviceProviderUsage}
          organizationProviders={organizationProviders}
          vocabulary={vocabulary}
          onCreate={onCreateProviderUsage}
          onDelete={onDeleteProviderUsage}
          onUpdate={onUpdateProviderUsage}
        />
      </TabsContent>
    </Tabs>
  )
}
