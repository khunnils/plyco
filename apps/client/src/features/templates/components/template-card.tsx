import { type ReactNode } from "react"

export const TemplateCard = ({
  template,
  children,
}: {
  template: {
    slug: string
    name: string
    description?: string
    sourceSystemTemplateSlug?: string | null
  }
  children: ReactNode
}) => (
  <div className="grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_auto] md:items-start">
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold text-slate-950">{template.name}</h3>
      </div>
      {template.description ? (
        <p className="mt-2 text-sm text-slate-600">{template.description}</p>
      ) : null}
      {template.sourceSystemTemplateSlug ? (
        <p className="mt-2 text-xs text-slate-500">
          Copied from {template.sourceSystemTemplateSlug}
        </p>
      ) : null}
    </div>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
)
