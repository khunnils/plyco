import { usePostHog } from "@posthog/react"

import {
  useCountries,
  useVocabulary,
} from "@/features/vocabulary/hooks/use-vocabulary"
import { POSTHOG_EVENTS } from "@/lib/posthog-events"
import {
  useSaveSecurityProfile,
  useSecurityProfile,
} from "@/features/company/hooks/use-company"
import { profileFromOrganization } from "@/features/company/lib/profile"
import { CompanyProfilePage } from "./company-profile-page"
import { PageHeader } from "@/features/shell/components/page-header"
import {
  SIDEBAR_SECTION,
  sectionPageBreadcrumbs,
} from "@/features/shell/lib/navigation"

export const CompanyProfileRoutePage = () => {
  const posthog = usePostHog()
  const countries = useCountries()
  const vocabulary = useVocabulary()
  const saveProfile = useSaveSecurityProfile()
  const securityProfile = useSecurityProfile()

  const snapshot = securityProfile.data
  const defaultValues = profileFromOrganization(snapshot?.organization ?? null)

  const countriesList = countries.data ?? []
  const vocabularyData = vocabulary.data

  return (
    <>
      <PageHeader
        breadcrumbs={sectionPageBreadcrumbs(SIDEBAR_SECTION.company, [
          { label: "Profile" },
        ])}
        eyebrow={SIDEBAR_SECTION.company}
        title="Profile"
      />
      <CompanyProfilePage
        countries={countriesList}
        isMutationPending={saveProfile.isPending}
        profile={defaultValues}
        vocabulary={vocabularyData}
        onSaveProfile={(profile, onSuccess) =>
          saveProfile.mutate(profile, {
            onSuccess: (snapshot) => {
              posthog.capture(POSTHOG_EVENTS.COMPANY_PROFILE_SAVED)
              onSuccess?.(snapshot)
            },
          })
        }
      />
    </>
  )
}
