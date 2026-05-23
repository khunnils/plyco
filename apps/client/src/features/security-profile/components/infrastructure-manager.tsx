import { type Provider, type Vocabulary } from "@plyco/shared"

import { BackupsPanel } from "@/features/security-profile/components/backups-panel"
import { EncryptionPanel } from "@/features/security-profile/components/encryption-panel"
import { IncidentResponsePanel } from "@/features/security-profile/components/incident-response-panel"
import { InfrastructureProvidersPanel } from "@/features/security-profile/components/infrastructure-providers-panel"
import { LoggingMonitoringPanel } from "@/features/security-profile/components/logging-monitoring-panel"
import { VendorRiskPanel } from "@/features/security-profile/components/vendor-risk-panel"
import { VulnerabilityManagementPanel } from "@/features/security-profile/components/vulnerability-management-panel"
import {
  type ProfileDraft,
  type SaveProfile,
} from "@/features/security-profile/types/security-profile"
import { type Option } from "@/features/vocabulary/lib/vocabulary"

export const InfrastructureManager = ({
  isMutationPending,
  profile,
  providers,
  securityCadenceOptions,
  securityCustomerNotificationProcessOptions,
  securityEncryptionAlgorithmOptions,
  securityKeyManagementProviderOptions,
  securityMonitoringOwnerOptions,
  securityNotificationTimelineOptions,
  securityTlsVersionOptions,
  vocabulary,
  onSaveProfile,
}: {
  isMutationPending: boolean
  profile: ProfileDraft
  providers: Provider[]
  securityCadenceOptions: Option[]
  securityCustomerNotificationProcessOptions: Option[]
  securityEncryptionAlgorithmOptions: Option[]
  securityKeyManagementProviderOptions: Option[]
  securityMonitoringOwnerOptions: Option[]
  securityNotificationTimelineOptions: Option[]
  securityTlsVersionOptions: Option[]
  vocabulary: Vocabulary | undefined
  onSaveProfile: SaveProfile
}) => {
  const saveInfrastructure = (
    patch: Partial<ProfileDraft["infrastructure"]>,
    onSuccess?: () => void
  ) => {
    onSaveProfile(
      {
        ...profile,
        infrastructure: {
          ...profile.infrastructure,
          ...patch,
        },
      },
      onSuccess
    )
  }

  return (
    <div className="grid gap-8">
      <InfrastructureProvidersPanel
        catalogProviders={providers}
        infrastructure={profile.infrastructure}
        isMutationPending={isMutationPending}
        onSave={saveInfrastructure}
      />
      <EncryptionPanel
        infrastructure={profile.infrastructure}
        isMutationPending={isMutationPending}
        securityEncryptionAlgorithmOptions={securityEncryptionAlgorithmOptions}
        securityKeyManagementProviderOptions={
          securityKeyManagementProviderOptions
        }
        securityTlsVersionOptions={securityTlsVersionOptions}
        vocabulary={vocabulary}
        onSave={saveInfrastructure}
      />
      <LoggingMonitoringPanel
        infrastructure={profile.infrastructure}
        isMutationPending={isMutationPending}
        securityMonitoringOwnerOptions={securityMonitoringOwnerOptions}
        vocabulary={vocabulary}
        onSave={saveInfrastructure}
      />
      <VulnerabilityManagementPanel
        infrastructure={profile.infrastructure}
        isMutationPending={isMutationPending}
        securityCadenceOptions={securityCadenceOptions}
        vocabulary={vocabulary}
        onSave={saveInfrastructure}
      />
      <IncidentResponsePanel
        infrastructure={profile.infrastructure}
        isMutationPending={isMutationPending}
        securityCustomerNotificationProcessOptions={
          securityCustomerNotificationProcessOptions
        }
        securityNotificationTimelineOptions={
          securityNotificationTimelineOptions
        }
        vocabulary={vocabulary}
        onSave={saveInfrastructure}
      />
      <BackupsPanel
        infrastructure={profile.infrastructure}
        isMutationPending={isMutationPending}
        securityCadenceOptions={securityCadenceOptions}
        vocabulary={vocabulary}
        onSave={saveInfrastructure}
      />
      <VendorRiskPanel
        infrastructure={profile.infrastructure}
        isMutationPending={isMutationPending}
        securityCadenceOptions={securityCadenceOptions}
        vocabulary={vocabulary}
        onSave={saveInfrastructure}
      />
    </div>
  )
}
