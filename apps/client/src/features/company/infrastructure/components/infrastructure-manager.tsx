import { type Provider, type Vocabulary } from "@plyco/shared"

import { BackupsPanel } from "@/features/company/infrastructure/components/panels/backups-panel"
import { EncryptionPanel } from "@/features/company/infrastructure/components/panels/encryption-panel"
import { IncidentResponsePanel } from "@/features/company/infrastructure/components/panels/incident-response-panel"
import { InfrastructureProvidersPanel } from "@/features/company/infrastructure/components/panels/infrastructure-providers-panel"
import { LoggingMonitoringPanel } from "@/features/company/infrastructure/components/panels/logging-monitoring-panel"
import { VendorRiskPanel } from "@/features/company/infrastructure/components/panels/vendor-risk-panel"
import { VulnerabilityManagementPanel } from "@/features/company/infrastructure/components/panels/vulnerability-management-panel"
import {
  type ProfileDraft,
  type SaveProfile,
} from "@/features/company/types/company"
import { infrastructureProgress } from "@/features/dashboard/lib/progress"
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
  const progress = infrastructureProgress(profile)

  const getNeedsAttention = (sectionTitle: string) => {
    const section = progress.sections.find((s) => s.title === sectionTitle)
    if (!section) return false
    return section.totalFields > 0 && section.completedFields < section.totalFields
  }

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
        needsAttention={getNeedsAttention("Infrastructure Providers")}
        onSave={saveInfrastructure}
      />
      <EncryptionPanel
        infrastructure={profile.infrastructure}
        isMutationPending={isMutationPending}
        needsAttention={getNeedsAttention("Encryption")}
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
        needsAttention={getNeedsAttention("Logging & Monitoring")}
        securityMonitoringOwnerOptions={securityMonitoringOwnerOptions}
        vocabulary={vocabulary}
        onSave={saveInfrastructure}
      />
      <VulnerabilityManagementPanel
        infrastructure={profile.infrastructure}
        isMutationPending={isMutationPending}
        needsAttention={getNeedsAttention("Vulnerability Management")}
        securityCadenceOptions={securityCadenceOptions}
        vocabulary={vocabulary}
        onSave={saveInfrastructure}
      />
      <IncidentResponsePanel
        infrastructure={profile.infrastructure}
        isMutationPending={isMutationPending}
        needsAttention={getNeedsAttention("Incident Response")}
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
        needsAttention={getNeedsAttention("Backups")}
        securityCadenceOptions={securityCadenceOptions}
        vocabulary={vocabulary}
        onSave={saveInfrastructure}
      />
      <VendorRiskPanel
        infrastructure={profile.infrastructure}
        isMutationPending={isMutationPending}
        needsAttention={getNeedsAttention("Vendor Risk")}
        securityCadenceOptions={securityCadenceOptions}
        vocabulary={vocabulary}
        onSave={saveInfrastructure}
      />
    </div>
  )
}
