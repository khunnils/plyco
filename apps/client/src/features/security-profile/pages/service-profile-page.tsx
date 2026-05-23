import {
  type Provider,
  type ServiceVendorUse,
  type ServiceVendorUseInput,
  type Vendor,
  type Vocabulary,
} from "@plyco/shared"

import { ServiceManager } from "@/features/security-profile/components/service-manager"
import { type ProfileDraft } from "@/features/security-profile/types/security-profile"
import { codeOptions, type Option } from "@/features/vocabulary/lib/vocabulary"

export const ServiceProfilePage = ({
  businessActivityOptions,
  dataTypeOptions,
  isCreatingService,
  isProfileMutationPending,
  isVendorMutationPending,
  profile,
  providers,
  selectedServiceId,
  serviceVendorUses,
  vendors,
  vocabulary,
  onCancelCreateService,
  onCreateVendorUse,
  onDeleteVendorUse,
  onSaveProfile,
  onSelectService,
  onUpdateVendorUse,
}: {
  businessActivityOptions: Option[]
  dataTypeOptions: Array<{ value: string; label: string }>
  isCreatingService: boolean
  isProfileMutationPending: boolean
  isVendorMutationPending: boolean
  profile: ProfileDraft
  providers: Provider[]
  selectedServiceId: string | null
  serviceVendorUses: ServiceVendorUse[]
  vendors: Vendor[]
  vocabulary: Vocabulary | undefined
  onCancelCreateService: () => void
  onCreateVendorUse: (
    vendorUse: ServiceVendorUseInput,
    onSuccess?: () => void
  ) => void
  onDeleteVendorUse: (vendorUse: ServiceVendorUse) => void
  onSaveProfile: Parameters<typeof ServiceManager>[0]["onSaveProfile"]
  onSelectService: (id: string | null) => void
  onUpdateVendorUse: (
    input: {
      id: string
      vendorUse: ServiceVendorUseInput
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
    providers={providers}
    regionOptions={codeOptions(vocabulary, "regions")}
    selectedServiceId={selectedServiceId}
    serviceVendorUses={serviceVendorUses}
    userTypeOptions={codeOptions(vocabulary, "service_user_types")}
    vendors={vendors}
    vocabulary={vocabulary}
    onCancelCreateService={onCancelCreateService}
    onCreateVendorUse={onCreateVendorUse}
    onDeleteVendorUse={onDeleteVendorUse}
    onSaveProfile={onSaveProfile}
    onSelectService={onSelectService}
    onUpdateVendorUse={onUpdateVendorUse}
  />
)
