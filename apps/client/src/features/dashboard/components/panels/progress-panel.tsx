import { useState } from "react"
import { Link } from "react-router-dom"
import { ChevronDown, ChevronUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ProgressBar } from "@/features/dashboard/components/progress-bar"
import { ProgressStatusBadge } from "@/features/dashboard/components/progress-status-badge"
import {
  isProgressComplete,
  type ProgressGroup,
  type ProgressItem,
} from "@/features/dashboard/lib/progress"

type PanelGroup = Pick<
  ProgressGroup,
  | "completedFields"
  | "totalFields"
  | "percent"
  | "completedSections"
  | "totalSections"
  | "sections"
>

export const ProgressPanel = ({
  description,
  group,
  href,
  title,
}: {
  description: string
  group: PanelGroup
  href: string
  title: string
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <section className="flex flex-col justify-between border border-slate-200 bg-white p-5">
      <div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-wrap items-baseline gap-2">
            <h2 className="text-base font-semibold text-slate-950 transition-colors hover:text-slate-700 hover:underline">
              <Link to={href}>{title}</Link>
            </h2>
            <span className="text-sm text-slate-500">
              {group.completedSections}/{group.totalSections} sections
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <ProgressStatusBadge metric={group} />
            {!isProgressComplete(group) ? (
              <div className="w-24 sm:w-32">
                <ProgressBar percent={group.percent} />
              </div>
            ) : null}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-slate-400 transition-colors duration-150 hover:text-slate-600 focus:outline-none"
              type="button"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <p className="mt-2 text-sm text-slate-500">{description}</p>

        {isExpanded && (
          <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4">
            {group.sections.map((section) => {
              const isComplete =
                section.totalFields > 0 &&
                section.completedFields === section.totalFields
              return (
                <div
                  key={section.title}
                  className="flex items-center justify-between border-b border-slate-50 py-1 text-sm last:border-0"
                >
                  <span className="font-medium text-slate-700">
                    {section.title}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      isComplete
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {isComplete ? "Yes" : "No"}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export const ProgressItemPanel = ({ item }: { item: ProgressItem }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <article className="border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-baseline gap-2">
          <h3 className="truncate text-sm font-semibold text-slate-950 transition-colors hover:text-slate-700 hover:underline">
            {item.href ? <Link to={item.href}>{item.title}</Link> : item.title}
          </h3>
          <span className="text-xs text-slate-500">
            {item.completedSections}/{item.totalSections} sections
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <ProgressStatusBadge metric={item} />
          {!isProgressComplete(item) ? (
            <div className="w-24 sm:w-32">
              <ProgressBar percent={item.percent} />
            </div>
          ) : null}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 transition-colors duration-150 hover:text-slate-600 focus:outline-none"
            type="button"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <p className="mt-1.5 text-xs text-slate-500">
        {item.completedFields}/{item.totalFields} fields complete
      </p>

      {isExpanded && (
        <div className="mt-3 grid gap-1.5 border-t border-slate-100 pt-3">
          {item.sections.map((section) => {
            const isComplete =
              section.totalFields > 0 &&
              section.completedFields === section.totalFields
            return (
              <div
                key={section.title}
                className="flex items-center justify-between border-b border-slate-50 py-0.5 text-xs last:border-0"
              >
                <span className="font-medium text-slate-600">
                  {section.title}
                </span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    isComplete
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isComplete ? "Yes" : "No"}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </article>
  )
}

export const PlaceholderPanel = ({
  actionLabel,
  description,
  href,
  title,
}: {
  actionLabel: string
  description: string
  href: string
  title: string
}) => (
  <div className="border border-dashed border-slate-300 bg-slate-50 p-5">
    <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
    <p className="mt-1 text-sm text-slate-500">{description}</p>
    <Button asChild className="mt-4 w-fit" type="button" variant="outline">
      <Link to={href}>{actionLabel}</Link>
    </Button>
  </div>
)
