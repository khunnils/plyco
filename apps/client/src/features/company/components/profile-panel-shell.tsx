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
      <div className="grid gap-4 border border-slate-200 bg-slate-50 p-5 shadow-sm">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
        {children}
        <div className="flex justify-end gap-2">
          <Button disabled={isMutationPending} type="button" onClick={onSave}>
            {isMutationPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Save />
            )}
            {saveLabel}
          </Button>
          <Button
            disabled={isMutationPending}
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            <X />
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4 pb-2 border-b">
        <div className="">
          <h3 className="text-base font-semibold text-slate-950">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
        <Button
          className="align-self-end"
          type="button"
          variant="link"
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
  rows: ReadonlyArray<readonly [string, string | number | null]>
}) => (
  <dl className="grid gap-3 sm:grid-cols-2">
    {rows.map(([label, value]) => (
      <div
        className="border border-slate-200 bg-slate-50 p-3"
        key={label}
      >
        <dt className="text-xs font-medium text-slate-500">{label}</dt>
        <dd className="mt-1 text-sm font-medium text-slate-900">
          {value ?? "Not answered"}
        </dd>
      </div>
    ))}
  </dl>
)
