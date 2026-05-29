import { useVocabulary } from "@/features/vocabulary/hooks/use-vocabulary"
import {
  useSaveSecurityProfile,
  useSecurityProfile,
} from "@/features/company/hooks/use-company"
import { profileFromOrganization } from "@/features/company/lib/profile"
import { DataHandlingProfilePage } from "./data-handling-profile-page"
import { PageHeader } from "@/features/shell/components/page-header"

export const DataHandlingProfileRoutePage = () => {
  const vocabulary = useVocabulary()
  const saveProfile = useSaveSecurityProfile()
  const securityProfile = useSecurityProfile()

  const snapshot = securityProfile.data
  const defaultValues = profileFromOrganization(snapshot?.organization ?? null)
  const vocabularyData = vocabulary.data

  return (
    <>
      <PageHeader eyebrow="Product & Data" title="Data Types" />
      <DataHandlingProfilePage
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
