import {
  useCountries,
  useVocabulary,
} from "@/features/vocabulary/hooks/use-vocabulary"
import {
  useSaveSecurityProfile,
  useSecurityProfile,
} from "@/features/company/hooks/use-company"
import { profileFromOrganization } from "@/features/company/lib/profile"
import { CompanyProfilePage } from "./company-profile-page"
import { PageHeader } from "@/features/shell/components/page-header"

export const CompanyProfileRoutePage = () => {
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
      <PageHeader eyebrow="Company" title="Profile" />
      <CompanyProfilePage
        countries={countriesList}
        isMutationPending={saveProfile.isPending}
        profile={defaultValues}
        vocabulary={vocabularyData}
        onSaveProfile={(profile, onSuccess) =>
          saveProfile.mutate(profile, { onSuccess })
        }
      />
    </>
  )
}
