import { type Provider, type Vocabulary } from "@plyco/shared"

import { BackupsPanel } from "@/features/company/infrastructure/components/panels/backups-panel"
import { EncryptionPanel } from "@/features/company/infrastructure/components/panels/encryption-panel"
import { InfrastructureProvidersPanel } from "@/features/company/infrastructure/components/panels/infrastructure-providers-panel"
import { LoggingMonitoringPanel } from "@/features/company/infrastructure/components/panels/logging-monitoring-panel"
import { VendorRiskPanel } from "@/features/company/infrastructure/components/panels/vendor-risk-panel"
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
  securityEncryptionAlgorithmOptions,
  securityKeyManagementProviderOptions,
  securityMonitoringOptions,
  securityTlsVersionOptions,
  vocabulary,
  onSaveProfile,
}: {
  isMutationPending: boolean
  profile: ProfileDraft
  providers: Provider[]
  securityCadenceOptions: Option[]
  securityEncryptionAlgorithmOptions: Option[]
  securityKeyManagementProviderOptions: Option[]
  securityMonitoringOptions: Option[]
  securityTlsVersionOptions: Option[]
  vocabulary: Vocabulary | undefined
  onSaveProfile: SaveProfile
}) => {
  const progress = infrastructureProgress(profile)

  const getNeedsAttention = (sectionTitle: string) => {
    const section = progress.sections.find((s) => s.title === sectionTitle)
    if (!section) return false
    return (
      section.totalFields > 0 && section.completedFields < section.totalFields
    )
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
        needsAttention={getNeedsAttention("Monitoring & Detection")}
        securityMonitoringOptions={securityMonitoringOptions}
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
        complianceGoals={profile.company.complianceGoals}
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
