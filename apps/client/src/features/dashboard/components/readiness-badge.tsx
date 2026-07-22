import { type Recommendation } from "@plyco/shared"

import { Badge } from "@/components/ui/badge"
import { Popover, PopoverTrigger } from "@/components/ui/popover"
import { ReadinessRecommendationsPopover } from "@/features/dashboard/components/readiness-recommendations-popover"
import { type ReadinessStatus } from "@/features/dashboard/components/readiness-scores"
import { useHoverPopover } from "@/features/dashboard/hooks/use-hover-popover"

export const ReadinessBadge = ({
  failingRecommendations = [],
  sectionTitle,
  status,
}: {
  failingRecommendations?: Recommendation[]
  sectionTitle: string
  status: ReadinessStatus
}) => {
  const {
    leavePopover,
    onOpenChange,
    open,
    openPopover,
    scheduleClose,
    triggerRef,
  } = useHoverPopover()

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          aria-label={`${status.label} readiness for ${sectionTitle}. View recommendation summary.`}
          className="cursor-pointer rounded-3xl focus-visible:ring-3 focus-visible:ring-slate-200 focus-visible:outline-none"
          ref={triggerRef}
          type="button"
          onBlur={scheduleClose}
          onPointerEnter={openPopover}
          onPointerLeave={leavePopover}
        >
          <Badge variant={status.badgeVariant}>{status.label}</Badge>
        </button>
      </PopoverTrigger>
      <ReadinessRecommendationsPopover
        open={open}
        recommendations={failingRecommendations}
        sectionTitle={sectionTitle}
        onPointerEnter={openPopover}
        onPointerLeave={leavePopover}
      />
    </Popover>
  )
}
