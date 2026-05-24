import {
  type ServiceProviderUsage,
  type ServiceProviderUsageInput,
  type OrganizationProvider,
  type Vocabulary,
} from "@plyco/shared"

import { ServiceManager } from "@/features/company/services/components/service-manager"
import { type ProfileDraft } from "@/features/company/types/company"
import { codeOptions, type Option } from "@/features/vocabulary/lib/vocabulary"

export const ServiceProfilePage = ({
  businessActivityOptions,
  dataTypeOptions,
  isCreatingService,
  isProfileMutationPending,
  isVendorMutationPending,
  profile,
  selectedServiceId,
  serviceProviderUsage,
  organizationProviders,
  vocabulary,
  onCancelCreateService,
  onCreateProviderUsage,
  onDeleteProviderUsage,
  onSaveProfile,
  onSelectService,
  onUpdateProviderUsage,
}: {
  businessActivityOptions: Option[]
  dataTypeOptions: Array<{ value: string; label: string }>
  isCreatingService: boolean
  isProfileMutationPending: boolean
  isVendorMutationPending: boolean
  profile: ProfileDraft
  selectedServiceId: string | null
  serviceProviderUsage: ServiceProviderUsage[]
  organizationProviders: OrganizationProvider[]
  vocabulary: Vocabulary | undefined
  onCancelCreateService: () => void
  onCreateProviderUsage: (
    providerUsage: ServiceProviderUsageInput,
    onSuccess?: () => void
  ) => void
  onDeleteProviderUsage: (providerUsage: ServiceProviderUsage) => void
  onSaveProfile: Parameters<typeof ServiceManager>[0]["onSaveProfile"]
  onSelectService: (id: string | null) => void
  onUpdateProviderUsage: (
    input: {
      id: string
      providerUsage: ServiceProviderUsageInput
    },
    onSuccess?: () => void
  ) => void
}) => (
  <ServiceManager
    businessActivityOptions={businessActivityOptions}
    cookieTypeOptions={codeOptions(vocabulary, "privacy_cookie_types")}
    customerTypeOptions={codeOptions(vocabulary, "service_customer_types")}
    dataProcessingLevelOptions={codeOptions(
      vocabulary,
      "data_processing_level"
    )}
    dataRegionOptions={codeOptions(vocabulary, "regions")}
    dataTypeOptions={dataTypeOptions}
    dpaStatusOptions={codeOptions(vocabulary, "dpa_status")}
    isCreatingService={isCreatingService}
    isProfileMutationPending={isProfileMutationPending}
    isVendorMutationPending={isVendorMutationPending}
    profile={profile}
    regionOptions={codeOptions(vocabulary, "regions")}
    selectedServiceId={selectedServiceId}
    serviceProviderUsage={serviceProviderUsage}
    userTypeOptions={codeOptions(vocabulary, "service_user_types")}
    organizationProviders={organizationProviders}
    vocabulary={vocabulary}
    onCancelCreateService={onCancelCreateService}
    onCreateProviderUsage={onCreateProviderUsage}
    onDeleteProviderUsage={onDeleteProviderUsage}
    onSaveProfile={onSaveProfile}
    onSelectService={onSelectService}
    onUpdateProviderUsage={onUpdateProviderUsage}
  />
)
