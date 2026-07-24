import { Plus } from "lucide-react"
import { type SystemTemplate } from "@plyco/shared"
import { useState } from "react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getTemplateIcon } from "@/features/documents/lib/template-icons"
import { cn } from "@/lib/utils"

export const TemplateSelector = ({
  systemTemplates,
  addedSystemTemplateSlugs,
  isLoading,
  submitDisabled = false,
  onCancel,
  onChooseTemplates,
}: {
  systemTemplates: SystemTemplate[]
  addedSystemTemplateSlugs: Set<string>
  isLoading: boolean
  submitDisabled?: boolean
  onCancel: () => void
  onChooseTemplates: (templates: SystemTemplate[]) => void
}) => {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([])

  const selectedTemplates = systemTemplates.filter((template) =>
    selectedSlugs.includes(template.slug)
  )

  const toggleTemplate = (slug: string) => {
    setSelectedSlugs((current) =>
      current.includes(slug)
        ? current.filter((currentSlug) => currentSlug !== slug)
        : [...current, slug]
    )
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold text-slate-950">Add template</h3>
          <p className="mt-1 text-sm text-slate-500">
            Choose one or more pre-defined system templates to add.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            disabled={submitDisabled || selectedTemplates.length === 0}
            type="button"
            onClick={() => onChooseTemplates(selectedTemplates)}
          >
            Add selected
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {systemTemplates.map((template) => {
          const alreadyAdded = addedSystemTemplateSlugs.has(template.slug)
          const selected = selectedSlugs.includes(template.slug)
          const TemplateIcon = getTemplateIcon(template.slug)

          return (
            <button
              aria-pressed={alreadyAdded || selected}
              className={cn(
                "border p-4 text-left transition focus-visible:ring-1 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:outline-none",
                alreadyAdded
                  ? "border-slate-200 bg-slate-50 text-slate-400"
                  : "border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50",
                selected && !alreadyAdded && "border-slate-900 bg-slate-50"
              )}
              disabled={alreadyAdded}
              key={template.slug}
              type="button"
              onClick={() => toggleTemplate(template.slug)}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md",
                    alreadyAdded
                      ? "bg-slate-100 text-slate-400"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  <TemplateIcon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={cn(
                        "font-semibold",
                        alreadyAdded ? "text-slate-500" : "text-slate-950"
                      )}
                    >
                      {template.name}
                    </h3>
                    {alreadyAdded ? (
                      <Badge variant="secondary">Added</Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {template.description}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <p className="my-4 text-sm text-slate-500">Loading templates...</p>
      ) : null}

      {!isLoading && systemTemplates.length === 0 ? (
        <p className="my-4 text-sm text-slate-500">
          No system templates available.
        </p>
      ) : null}

      <Link
        to="/documents/create"
        className="mt-4 flex w-full flex-col items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center transition hover:border-slate-300 hover:bg-slate-100/70 focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
      >
        <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          <Plus className="size-5" />
        </div>
        <h4 className="text-sm font-semibold text-slate-950">
          Need something else?
        </h4>
        <p className="mt-1 max-w-sm text-xs text-slate-500">
          Describe what you need and create a tailored starting point.
        </p>
      </Link>
    </div>
  )
}
