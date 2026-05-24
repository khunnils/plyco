import { type Provider, type Vocabulary } from "@plyco/shared"

import { InfrastructureManager } from "@/features/company/infrastructure/components/infrastructure-manager"
import {
  type ProfileDraft,
  type SaveProfile,
} from "@/features/company/types/company"
import { codeOptions } from "@/features/vocabulary/lib/vocabulary"

export const InfrastructureProfilePage = ({
  isMutationPending,
  profile,
  providers,
  vocabulary,
  onSaveProfile,
}: {
  isMutationPending: boolean
  profile: ProfileDraft
  providers: Provider[]
  vocabulary: Vocabulary | undefined
  onSaveProfile: SaveProfile
}) => (
  <InfrastructureManager
    isMutationPending={isMutationPending}
    profile={profile}
    providers={providers}
    securityCadenceOptions={codeOptions(vocabulary, "security_cadences")}
    securityCustomerNotificationProcessOptions={codeOptions(
      vocabulary,
      "security_customer_notification_processes"
    )}
    securityEncryptionAlgorithmOptions={codeOptions(
      vocabulary,
      "security_encryption_algorithms"
    )}
    securityKeyManagementProviderOptions={codeOptions(
      vocabulary,
      "security_key_management_providers"
    )}
    securityMonitoringOwnerOptions={codeOptions(
      vocabulary,
      "security_monitoring_owners"
    )}
    securityNotificationTimelineOptions={codeOptions(
      vocabulary,
      "security_notification_timelines"
    )}
    securityTlsVersionOptions={codeOptions(vocabulary, "security_tls_versions")}
    vocabulary={vocabulary}
    onSaveProfile={onSaveProfile}
  />
)
