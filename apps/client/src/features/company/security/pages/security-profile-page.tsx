import { type Vocabulary } from "@plyco/shared"
import { SecurityManager } from "../components/security-manager"
import { type ProfileDraft, type SaveProfile } from "@/features/company/types/company"
import { codeOptions } from "@/features/vocabulary/lib/vocabulary"

export const SecurityProfilePage = ({ isMutationPending, profile, vocabulary, onSaveProfile }: {
  isMutationPending: boolean; profile: ProfileDraft; vocabulary: Vocabulary | undefined; onSaveProfile: SaveProfile
}) => <SecurityManager
  isMutationPending={isMutationPending}
  profile={profile}
  securityCadenceOptions={codeOptions(vocabulary, "security_cadences")}
  securityCustomerNotificationProcessOptions={codeOptions(vocabulary, "security_customer_notification_processes")}
  securityNotificationTimelineOptions={codeOptions(vocabulary, "security_notification_timelines")}
  penetrationTestingStrategyOptions={codeOptions(vocabulary, "security_penetration_testing_strategies")}
  vocabulary={vocabulary}
  onSaveProfile={onSaveProfile}
/>
