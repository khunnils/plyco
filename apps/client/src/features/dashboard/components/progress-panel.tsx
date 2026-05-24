import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  type ProgressGroup,
  type ProgressItem,
} from "@/features/dashboard/lib/progress"
import { ProgressBar } from "@/features/dashboard/components/progress-bar"
import { ProgressRow } from "@/features/dashboard/components/progress-row"

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
  actionLabel,
  description,
  group,
  href,
  title,
}: {
  actionLabel: string
  description: string
  group: PanelGroup
  href: string
  title: string
}) => (
  <section className="border border-slate-200 bg-white p-5">
    <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <Button asChild className="w-fit" type="button" variant="outline">
        <Link to={href}>{actionLabel}</Link>
      </Button>
    </div>
    <div className="mb-4 grid gap-2">
      <div className="flex items-end justify-between gap-3">
        <p className="text-2xl font-semibold text-slate-950">
          {group.percent}%
        </p>
        <p className="text-sm text-slate-500">
          {group.completedSections}/{group.totalSections} sections
        </p>
      </div>
      <ProgressBar percent={group.percent} />
    </div>
    <div className="grid gap-3">
      {group.sections.map((section) => (
        <ProgressRow key={section.title} section={section} />
      ))}
    </div>
  </section>
)

export const ProgressItemPanel = ({ item }: { item: ProgressItem }) => (
  <article className="border border-slate-200 bg-white p-4">
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold text-slate-950">
          {item.title}
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          {item.completedSections}/{item.totalSections} sections -{" "}
          {item.completedFields}/{item.totalFields} fields
        </p>
      </div>
      {item.href ? (
        <Button
          asChild
          className="w-fit"
          size="sm"
          type="button"
          variant="link"
        >
          <Link to={item.href}>Open</Link>
        </Button>
      ) : null}
    </div>
    <div className="mb-4">
      <ProgressBar percent={item.percent} />
    </div>
    <div className="grid gap-2">
      {item.sections.map((section) => (
        <ProgressRow key={section.title} section={section} />
      ))}
    </div>
  </article>
)

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
