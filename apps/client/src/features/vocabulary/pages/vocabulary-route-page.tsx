import { useVocabulary } from "@/features/vocabulary/hooks/use-vocabulary"
import { VocabularyManager } from "@/features/vocabulary/components/vocabulary-manager"
import { PageHeader } from "@/features/shell/components/page-header"
import {
  SIDEBAR_SECTION,
  sectionPageBreadcrumbs,
} from "@/features/shell/lib/navigation"

export const VocabularyRoutePage = () => {
  const vocabulary = useVocabulary()
  const vocabularyData = vocabulary.data

  return (
    <>
      <PageHeader
        breadcrumbs={sectionPageBreadcrumbs(SIDEBAR_SECTION.settings, [
          { label: "Vocabulary" },
        ])}
        eyebrow={SIDEBAR_SECTION.settings}
        title="Vocabulary"
      />
      <VocabularyManager vocabulary={vocabularyData} />
    </>
  )
}
