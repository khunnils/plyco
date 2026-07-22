import { CircleDashed } from "lucide-react"

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CircularProgress } from "@/features/dashboard/components/circular-progress"
import { useHoverPopover } from "@/features/dashboard/hooks/use-hover-popover"
import {
  pendingProgressSections,
  type ProgressSection,
} from "@/features/dashboard/lib/progress"

export const ProgressDetailsPopover = ({
  emptyMessage,
  percent,
  sectionTitle,
  sections,
}: {
  emptyMessage?: string
  percent: number
  sectionTitle: string
  sections: ProgressSection[]
}) => {
  const {
    leavePopover,
    onOpenChange,
    open,
    openPopover,
    scheduleClose,
    triggerRef,
  } = useHoverPopover()
  const pendingSections = pendingProgressSections(sections)

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          aria-label={`${percent}% complete. View pending subsections for ${sectionTitle}`}
          className="flex size-7 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 hover:bg-blue-50 focus-visible:ring-3 focus-visible:ring-blue-100 focus-visible:outline-none"
          ref={triggerRef}
          type="button"
          onBlur={scheduleClose}
          onPointerEnter={openPopover}
          onPointerLeave={leavePopover}
        >
          <CircularProgress percent={percent} size={22} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 gap-3 rounded-md border border-slate-200 bg-white p-4 text-slate-950 shadow-lg ring-0 motion-reduce:animate-none"
        side="bottom"
        sideOffset={8}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onPointerEnter={openPopover}
        onPointerLeave={leavePopover}
      >
        <PopoverHeader>
          <PopoverTitle className="text-sm font-semibold">
            Pending subsections
          </PopoverTitle>
          <PopoverDescription className="text-xs text-slate-600">
            Complete these parts of {sectionTitle}.
          </PopoverDescription>
        </PopoverHeader>
        {pendingSections.length > 0 ? (
          <ul className="grid gap-2">
            {pendingSections.map((section, index) => (
              <li
                className="flex items-start justify-between gap-4 rounded-sm bg-slate-50 px-3 py-2"
                key={`${section.title}-${index}`}
              >
                <span className="flex min-w-0 items-start gap-2 text-sm font-medium text-slate-800">
                  <CircleDashed className="mt-0.5 size-4 shrink-0 text-slate-500" />
                  <span>{section.title}</span>
                </span>
                <span className="shrink-0 text-xs text-slate-500">
                  {section.completedFields} of {section.totalFields} captured
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-sm bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {emptyMessage ?? "Start this section to see its subsections."}
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}
