import { RecommendationsList } from "@/features/recommendations/components/recommendations-list"
import { SuppressedRecommendationsPopover } from "@/features/recommendations/components/suppressed-recommendations-popover"
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
      <section className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-2">
          <h1 className="text-2xl font-semibold text-slate-950">
            What to focus on
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            Prioritized actions from the organization&apos;s active compliance
            gaps. Passing checks and checks awaiting more data are not shown.
          </p>
        </div>
        <SuppressedRecommendationsPopover
          rules={recommendations.data?.rules ?? []}
        />
      </section>
      <RecommendationsList
        error={recommendations.error}
        isLoading={recommendations.isLoading}
        recommendations={recommendations.data?.recommendations ?? []}
      />
    </>
  )
}
