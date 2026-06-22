import { usePostHog } from "@posthog/react"

import {
  useSaveSecurityProfile,
  useSecurityProfile,
} from "@/features/company/hooks/use-company"
import { profileFromOrganization } from "@/features/company/lib/profile"
import { POSTHOG_EVENTS } from "@/lib/posthog-events"
import { PageHeader } from "@/features/shell/components/page-header"
import {
  SIDEBAR_SECTION,
  sectionPageBreadcrumbs,
} from "@/features/shell/lib/navigation"
import { useVocabulary } from "@/features/vocabulary/hooks/use-vocabulary"
import { SecurityProfilePage } from "./security-profile-page"

export const SecurityProfileRoutePage = () => {
  const posthog = usePostHog()
  const vocabulary = useVocabulary()
  const saveProfile = useSaveSecurityProfile()
  const securityProfile = useSecurityProfile()
  const profile = profileFromOrganization(
    securityProfile.data?.organization ?? null
  )

  return (
    <>
      <PageHeader
        breadcrumbs={sectionPageBreadcrumbs(SIDEBAR_SECTION.company, [
          { label: "Security" },
        ])}
        eyebrow={SIDEBAR_SECTION.company}
        title="Security"
      />
      <SecurityProfilePage
        isMutationPending={saveProfile.isPending}
        profile={profile}
        vocabulary={vocabulary.data}
        onSaveProfile={(next, onSuccess) =>
          saveProfile.mutate(next, {
            onSuccess: (snapshot) => {
              posthog.capture(POSTHOG_EVENTS.SECURITY_PROFILE_SAVED)
              onSuccess?.(snapshot)
            },
          })
        }
      />
    </>
  )
}
