import { useProviders } from "@/features/vendors/hooks/use-vendors"
import { useVocabulary } from "@/features/vocabulary/hooks/use-vocabulary"
import {
  useSaveSecurityProfile,
  useSecurityProfile,
} from "@/features/company/hooks/use-company"
import { profileFromOrganization } from "@/features/company/lib/profile"
import { PrivacyProfilePage } from "./privacy-profile-page"
import { PageHeader } from "@/features/shell/components/page-header"

export const PrivacyProfileRoutePage = () => {
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
      <PageHeader eyebrow="Company" title="Privacy" />
      <PrivacyProfilePage
        isMutationPending={saveProfile.isPending}
        profile={defaultValues}
        providers={providersList}
        vocabulary={vocabularyData}
        onSaveProfile={(profile, onSuccess) =>
          saveProfile.mutate(profile, { onSuccess })
        }
      />
    </>
  )
}
