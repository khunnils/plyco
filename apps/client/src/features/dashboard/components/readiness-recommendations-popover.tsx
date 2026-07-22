import { useEffect, useRef, useState } from "react"

import {
  type Recommendation,
  type RecommendationSeverity,
} from "@plyco/shared"

import {
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from "@/components/ui/popover"
import { ReadinessRecommendationCounts } from "@/features/dashboard/components/readiness-recommendation-counts"
import { ReadinessRecommendationDetails } from "@/features/dashboard/components/readiness-recommendation-details"

export const ReadinessRecommendationsPopover = ({
  onPointerEnter,
  onPointerLeave,
  open,
  recommendations,
  sectionTitle,
}: {
  onPointerEnter: () => void
  onPointerLeave: () => void
  open: boolean
  recommendations: Recommendation[]
  sectionTitle: string
}) => {
  const contentRef = useRef<HTMLDivElement>(null)
  const [selectedSeverity, setSelectedSeverity] =
    useState<RecommendationSeverity | null>(null)
  const [minHeight, setMinHeight] = useState<number>()

  // Keep the previous view's height when switching so the popover doesn't
  // shrink under the cursor and fire an accidental pointerleave close.
  const switchView = (severity: RecommendationSeverity | null) => {
    setMinHeight(contentRef.current?.offsetHeight)
    setSelectedSeverity(severity)
  }

  useEffect(() => {
    if (!open) {
      setSelectedSeverity(null)
      setMinHeight(undefined)
    }
  }, [open])

  return (
    <PopoverContent
      ref={contentRef}
      align="end"
      className="w-72 gap-3 rounded-md border border-slate-200 bg-white p-4 text-slate-950 shadow-lg ring-0 motion-reduce:animate-none"
      side="bottom"
      sideOffset={8}
      style={minHeight ? { minHeight } : undefined}
      onOpenAutoFocus={(event) => event.preventDefault()}
      onCloseAutoFocus={(event) => event.preventDefault()}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {selectedSeverity ? (
        <ReadinessRecommendationDetails
          recommendations={recommendations}
          severity={selectedSeverity}
          onBack={() => switchView(null)}
        />
      ) : (
        <>
          <PopoverHeader>
            <PopoverTitle className="text-sm font-semibold">
              Recommendations
            </PopoverTitle>
            <PopoverDescription className="text-xs text-slate-600">
              Severity mix for {sectionTitle}.
            </PopoverDescription>
          </PopoverHeader>
          <ReadinessRecommendationCounts
            recommendations={recommendations}
            onSelectSeverity={(severity) => switchView(severity)}
          />
        </>
      )}
    </PopoverContent>
  )
}
