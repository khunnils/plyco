import { Loader2, Save, X } from "lucide-react"
import { type ReactNode } from "react"

import { Button } from "@/components/ui/button"

export const ProfilePanelShell = ({
  children,
  description,
  isEditing,
  isMutationPending,
  readOnlyContent,
  saveLabel = "Save",
  title,
  onCancel,
  onEdit,
  onSave,
}: {
  children: ReactNode
  description?: string
  isEditing: boolean
  isMutationPending: boolean
  readOnlyContent: ReactNode
  saveLabel?: string
  title: string
  onCancel: () => void
  onEdit: () => void
  onSave: () => void
}) => {
  if (isEditing) {
    return (
      <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
        {children}
        <div className="flex justify-end gap-2">
          <Button disabled={isMutationPending} type="button" onClick={onSave}>
            {isMutationPending ? <Loader2 /> : <Save />}
            {saveLabel}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            <X />
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
        <Button
          className="w-fit"
          type="button"
          variant="outline"
          onClick={onEdit}
        >
          Edit
        </Button>
      </div>
      {readOnlyContent}
    </div>
  )
}

export const ProfilePanelDetailGrid = ({
  rows,
}: {
  rows: ReadonlyArray<readonly [string, string | number]>
}) => (
  <dl className="grid gap-3 sm:grid-cols-2">
    {rows.map(([label, value]) => (
      <div
        className="rounded-md border border-slate-200 bg-slate-50 p-3"
        key={label}
      >
        <dt className="text-xs font-medium text-slate-500">{label}</dt>
        <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
      </div>
    ))}
  </dl>
)
