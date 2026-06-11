import { type Vocabulary } from "@plyco/shared"

import { type ProfileDraft, type SaveProfile } from "@/features/company/types/company"
import { securityProgress } from "@/features/dashboard/lib/progress"
import { type Option } from "@/features/vocabulary/lib/vocabulary"
import { DevelopmentSecurityPanel } from "./panels/development-security-panel"
import { IncidentResponsePanel } from "./panels/incident-response-panel"
import { VulnerabilityDetectionPanel } from "./panels/vulnerability-detection-panel"
import { VulnerabilityRemediationPanel } from "./panels/vulnerability-remediation-panel"

export const SecurityManager = ({
  isMutationPending, profile, securityCadenceOptions,
  securityCustomerNotificationProcessOptions, securityNotificationTimelineOptions,
  penetrationTestingStrategyOptions, vocabulary, onSaveProfile,
}: {
  isMutationPending: boolean
  profile: ProfileDraft
  securityCadenceOptions: Option[]
  securityCustomerNotificationProcessOptions: Option[]
  securityNotificationTimelineOptions: Option[]
  penetrationTestingStrategyOptions: Option[]
  vocabulary: Vocabulary | undefined
  onSaveProfile: SaveProfile
}) => {
  const progress = securityProgress(profile)
  const needsAttention = (title: string) => {
    const section = progress.sections.find((item) => item.title === title)
    return Boolean(section && section.totalFields > section.completedFields)
  }
  const saveSecurity = (patch: Partial<ProfileDraft["security"]>, onSuccess?: () => void) =>
    onSaveProfile({ ...profile, security: { ...profile.security, ...patch } }, onSuccess)

  return <div className="grid gap-8">
    <DevelopmentSecurityPanel security={profile.security} isMutationPending={isMutationPending} needsAttention={needsAttention("Development Security")} onSave={saveSecurity} />
    <VulnerabilityDetectionPanel security={profile.security} isMutationPending={isMutationPending} needsAttention={needsAttention("Vulnerability Detection")} securityCadenceOptions={securityCadenceOptions} penetrationTestingStrategyOptions={penetrationTestingStrategyOptions} vocabulary={vocabulary} onSave={saveSecurity} />
    <VulnerabilityRemediationPanel security={profile.security} isMutationPending={isMutationPending} needsAttention={needsAttention("Vulnerability Remediation")} vocabulary={vocabulary} onSave={saveSecurity} />
    <IncidentResponsePanel security={profile.security} isMutationPending={isMutationPending} needsAttention={needsAttention("Incident Response")} securityCustomerNotificationProcessOptions={securityCustomerNotificationProcessOptions} securityNotificationTimelineOptions={securityNotificationTimelineOptions} vocabulary={vocabulary} onSave={saveSecurity} />
  </div>
}
