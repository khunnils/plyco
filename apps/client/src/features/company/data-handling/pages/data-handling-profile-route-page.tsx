import { usePostHog } from "@posthog/react"

import { useVocabulary } from "@/features/vocabulary/hooks/use-vocabulary"
import { POSTHOG_EVENTS } from "@/lib/posthog-events"
import {
  useSaveDataProfile,
  useOrganizationSnapshot,
  useReorderDataTypes,
} from "@/features/company/hooks/use-company"
import { profileFromOrganization } from "@/features/company/lib/profile"
import { DataHandlingProfilePage } from "./data-handling-profile-page"
import { PageHeader } from "@/features/shell/components/page-header"
import {
  SIDEBAR_SECTION,
  sectionPageBreadcrumbs,
} from "@/features/shell/lib/navigation"

export const DataHandlingProfileRoutePage = () => {
  const posthog = usePostHog()
  const vocabulary = useVocabulary()
  const saveProfile = useSaveDataProfile()
  const organizationSnapshot = useOrganizationSnapshot()
  const reorderDataTypes = useReorderDataTypes()

  const snapshot = organizationSnapshot.data
  const defaultValues = profileFromOrganization(snapshot?.organization ?? null)
  const vocabularyData = vocabulary.data

  return (
    <>
      <PageHeader
        breadcrumbs={sectionPageBreadcrumbs(SIDEBAR_SECTION.productAndData, [
          { label: "Data Types" },
        ])}
        eyebrow={SIDEBAR_SECTION.productAndData}
        title="Data Types"
      />
      <DataHandlingProfilePage
        isMutationPending={saveProfile.isPending}
        profile={defaultValues}
        vocabulary={vocabularyData}
        onCreateDataType={(dataType) =>
          posthog.capture(POSTHOG_EVENTS.DATA_TYPE_CREATED, {
            data_type_id: dataType.id,
            is_sensitive: dataType.isSensitive,
            is_required: dataType.isRequired,
          })
        }
        onDeleteDataType={(dataType) =>
          posthog.capture(POSTHOG_EVENTS.DATA_TYPE_DELETED, {
            data_type_id: dataType.id,
          })
        }
        onSaveProfile={(profile, onSuccess) =>
          saveProfile.mutate(profile, { onSuccess })
        }
        onUpdateDataType={(dataType) =>
          posthog.capture(POSTHOG_EVENTS.DATA_TYPE_UPDATED, {
            data_type_id: dataType.id,
            is_sensitive: dataType.isSensitive,
            is_required: dataType.isRequired,
          })
        }
        onReorder={(ids) =>
          reorderDataTypes.mutate(ids, {
            onSuccess: () =>
              posthog.capture(POSTHOG_EVENTS.DATA_TYPE_REORDERED, {
                count: ids.length,
              }),
          })
        }
        reorderDisabled={reorderDataTypes.isPending}
      />
    </>
  )
}
