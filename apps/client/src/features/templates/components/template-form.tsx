import {
  type OrganizationMember,
  type Template,
  type TemplateInput,
} from "@plyco/shared"
import { Loader2, Save } from "lucide-react"
import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"

export const TemplateForm = ({
  defaultValues,
  isSaving,
  members,
  onCancel,
  onSubmit,
}: {
  defaultValues: Template | TemplateInput
  isSaving: boolean
  members: OrganizationMember[]
  onCancel: () => void
  onSubmit: (template: TemplateInput) => void
}) => {
  const [draft, setDraft] = useState<TemplateInput>({
    name: defaultValues.name,
    slug: defaultValues.slug,
    content: defaultValues.content,
    policyEffectiveDate: defaultValues.policyEffectiveDate,
    policyLastReviewedDate: defaultValues.policyLastReviewedDate,
    policyVersion: defaultValues.policyVersion,
    policyOwnerUserId: defaultValues.policyOwnerUserId,
    policyApproverUserId: defaultValues.policyApproverUserId,
    policyReviewCadence: defaultValues.policyReviewCadence,
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
      <section className="grid gap-3">
        <h3 className="text-sm font-semibold text-slate-950">
          Policy metadata
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-700">
              Effective date
            </span>
            <input
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              type="date"
              value={draft.policyEffectiveDate}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  policyEffectiveDate: event.target.value,
                }))
              }
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-700">
              Last reviewed date
            </span>
            <input
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              type="date"
              value={draft.policyLastReviewedDate}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  policyLastReviewedDate: event.target.value,
                }))
              }
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-700">Version</span>
            <input
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={draft.policyVersion}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  policyVersion: event.target.value,
                }))
              }
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-700">Owner</span>
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={draft.policyOwnerUserId}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  policyOwnerUserId: event.target.value,
                }))
              }
            >
              <option value="">Not set</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.name} ({member.email})
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-700">Approver</span>
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={draft.policyApproverUserId}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  policyApproverUserId: event.target.value,
                }))
              }
            >
              <option value="">Not set</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.name} ({member.email})
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-700">
              Review cadence
            </span>
            <input
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={draft.policyReviewCadence}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  policyReviewCadence: event.target.value,
                }))
              }
            />
          </label>
        </div>
      </section>
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
          {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
          Save template
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
