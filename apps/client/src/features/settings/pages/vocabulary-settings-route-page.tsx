import { useVocabulary } from "@/features/vocabulary/hooks/use-vocabulary"
import { VocabularyManager } from "@/features/vocabulary/components/vocabulary-manager"

export const VocabularySettingsRoutePage = () => {
  const vocabulary = useVocabulary()

  return <VocabularyManager vocabulary={vocabulary.data} />
}
