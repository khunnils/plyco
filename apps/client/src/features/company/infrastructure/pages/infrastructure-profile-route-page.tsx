import { usePostHog } from "@posthog/react"

import { POSTHOG_EVENTS } from "@/lib/posthog-events"
import { useProviders } from "@/features/vendors/hooks/use-vendors"
import { useVocabulary } from "@/features/vocabulary/hooks/use-vocabulary"
import {
  useSaveSecurityProfile,
  useSecurityProfile,
} from "@/features/company/hooks/use-company"
import { profileFromOrganization } from "@/features/company/lib/profile"
import { InfrastructureProfilePage } from "./infrastructure-profile-page"
import { PageHeader } from "@/features/shell/components/page-header"
import {
  SIDEBAR_SECTION,
  sectionPageBreadcrumbs,
} from "@/features/shell/lib/navigation"

export const InfrastructureProfileRoutePage = () => {
  const posthog = usePostHog()
  const providers = useProviders()
  const vocabulary = useVocabulary()
  const saveProfile = useSaveSecurityProfile()
  const securityProfile = useSecurityProfile()

  const snapshot = securityProfile.data
  const defaultValues = profileFromOrganization(snapshot?.organization ?? null)
  const providersList = providers.data ?? []
  const vocabularyData = vocabulary.data

  return (
    <>
      <PageHeader
        breadcrumbs={sectionPageBreadcrumbs(SIDEBAR_SECTION.company, [
          { label: "Infrastructure" },
        ])}
        eyebrow={SIDEBAR_SECTION.company}
        title="Infrastructure"
      />
      <InfrastructureProfilePage
        isMutationPending={saveProfile.isPending}
        profile={defaultValues}
        providers={providersList}
        vocabulary={vocabularyData}
        onSaveProfile={(profile, onSuccess) =>
          saveProfile.mutate(profile, {
            onSuccess: (snapshot) => {
              posthog.capture(POSTHOG_EVENTS.INFRASTRUCTURE_PROFILE_SAVED)
              onSuccess?.(snapshot)
            },
          })
        }
      />
    </>
  )
}
