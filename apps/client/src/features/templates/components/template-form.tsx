import { type Template, type TemplateInput } from "@complyflow/shared"
import { Loader2, Save } from "lucide-react"
import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"

export const TemplateForm = ({
  defaultValues,
  isSaving,
  onCancel,
  onSubmit,
}: {
  defaultValues: Template
  isSaving: boolean
  onCancel: () => void
  onSubmit: (template: TemplateInput) => void
}) => {
  const [draft, setDraft] = useState<TemplateInput>({
    name: defaultValues.name,
    slug: defaultValues.slug,
    content: defaultValues.content,
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(draft)
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-sm font-medium text-slate-700">Name</span>
          <input
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
            value={draft.name}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-medium text-slate-700">Slug</span>
          <input
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            required
            value={draft.slug}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                slug: event.target.value,
              }))
            }
          />
        </label>
      </div>
      <label className="grid gap-1">
        <span className="text-sm font-medium text-slate-700">Content</span>
        <textarea
          className="min-h-80 rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          value={draft.content}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              content: event.target.value,
            }))
          }
        />
      </label>
      <div className="flex gap-2">
        <Button disabled={isSaving} type="submit">
          {isSaving ? <Loader2 /> : <Save />}
          Save template
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
