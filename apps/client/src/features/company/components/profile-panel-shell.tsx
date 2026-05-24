import { AlertCircle, Loader2 } from "lucide-react"
import { type ReactNode } from "react"

import { Button } from "@/components/ui/button"

import { cn } from "@/lib/utils"

export const ProfilePanelShell = ({
  children,
  description,
  isEditing,
  isMutationPending,
  needsAttention,
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
  needsAttention?: boolean
  readOnlyContent: ReactNode
  saveLabel?: string
  title: string
  onCancel: () => void
  onEdit: () => void
  onSave: () => void
}) => {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4 pb-2 border-b">
        <div className="">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-950">{title}</h3>
            {needsAttention && (
              <span title="Needs attention">
                <AlertCircle
                  className="h-4 w-4 text-amber-500 shrink-0"
                />
              </span>
            )}
          </div>
          {description ? (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button
              disabled={isMutationPending}
              type="button"
              onClick={onSave}
            >
              {isMutationPending && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
              {saveLabel}
            </Button>
            <Button
              disabled={isMutationPending}
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            className="align-self-end"
            type="button"
            variant="link"
            onClick={onEdit}
          >
            Edit
          </Button>
        )}
      </div>
      {isEditing ? (
        <div className="border border-slate-200 bg-slate-50 p-5 shadow-sm">
          {children}
        </div>
      ) : (
        readOnlyContent
      )}
    </div>
  )
}

export const ProfilePanelDetailGrid = ({
  rows,
  itemBgClassName = "bg-slate-50",
}: {
  rows: ReadonlyArray<readonly [string, string | number | null]>
  itemBgClassName?: string
}) => (
  <dl className="grid gap-3 sm:grid-cols-2">
    {rows.map(([label, value]) => (
      <div
        className={cn("border border-slate-200 p-3", itemBgClassName)}
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
