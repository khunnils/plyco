import {
  useCreateVocabularyCode,
  useDeleteVocabularyCode,
  useUpdateVocabularyCode,
  useVocabulary,
} from "@/features/vocabulary/hooks/use-vocabulary"
import { VocabularyManager } from "@/features/vocabulary/components/vocabulary-manager"
import { PageHeader } from "@/features/shell/components/page-header"
import {
  SIDEBAR_SECTION,
  sectionPageBreadcrumbs,
} from "@/features/shell/lib/navigation"

export const VocabularyRoutePage = () => {
  const vocabulary = useVocabulary()
  const createVocabularyCode = useCreateVocabularyCode()
  const updateVocabularyCode = useUpdateVocabularyCode()
  const deleteVocabularyCode = useDeleteVocabularyCode()

  const vocabularyData = vocabulary.data

  const isSaving =
    createVocabularyCode.isPending ||
    updateVocabularyCode.isPending ||
    deleteVocabularyCode.isPending

  return (
    <>
      <PageHeader
        breadcrumbs={sectionPageBreadcrumbs(SIDEBAR_SECTION.settings, [
          { label: "Vocabulary" },
        ])}
        eyebrow={SIDEBAR_SECTION.settings}
        title="Vocabulary"
      />
      <VocabularyManager
        vocabulary={vocabularyData}
        isSaving={isSaving}
        onCreateCode={(codeSetId, code) =>
          createVocabularyCode.mutate({ codeSetId, code })
        }
        onDeleteCode={(codeSetId, codeId) =>
          deleteVocabularyCode.mutate({ codeSetId, codeId })
        }
        onUpdateCode={(codeSetId, codeId, code) =>
          updateVocabularyCode.mutate({ codeSetId, codeId, code })
        }
      />
    </>
  )
}
