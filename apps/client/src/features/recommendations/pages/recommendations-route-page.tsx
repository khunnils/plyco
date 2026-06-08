import { RecommendationsList } from "@/features/recommendations/components/recommendations-list"
import { useRecommendations } from "@/features/recommendations/hooks/use-recommendations"
import { PageHeader } from "@/features/shell/components/page-header"

export const RecommendationsRoutePage = () => {
  const recommendations = useRecommendations()

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Recommendations" }]}
        eyebrow="Recommendations"
        title="Recommendations"
      />
      <RecommendationsList
        isLoading={recommendations.isLoading}
        recommendations={recommendations.data?.recommendations ?? []}
      />
    </>
  )
}
