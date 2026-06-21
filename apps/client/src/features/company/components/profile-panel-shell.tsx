import { AlertCircle, Loader2 } from "lucide-react"
import { type ReactNode, useEffect, useId, useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"
import { InfoTooltip } from "@/components/ui/info-tooltip"

import { cn } from "@/lib/utils"

export type ProfilePanelDetailRow = readonly [
  label: string,
  value: string | number | null,
  helperText?: string,
]

let activeProfilePanelId: string | null = null
const profilePanelEditListeners = new Set<() => void>()

const setActiveProfilePanelId = (panelId: string | null) => {
  if (activeProfilePanelId === panelId) {
    return
  }

  activeProfilePanelId = panelId
  profilePanelEditListeners.forEach((listener) => listener())
}

const subscribeToActiveProfilePanel = (listener: () => void) => {
  profilePanelEditListeners.add(listener)
  return () => profilePanelEditListeners.delete(listener)
}

const getActiveProfilePanelSnapshot = () => activeProfilePanelId

const useActiveProfilePanelId = () =>
  useSyncExternalStore(
    subscribeToActiveProfilePanel,
    getActiveProfilePanelSnapshot,
    getActiveProfilePanelSnapshot
  )

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
  const panelId = useId()
  const activePanelId = useActiveProfilePanelId()
  const isPanelLocked = activePanelId !== null && activePanelId !== panelId

  useEffect(() => {
    if (isEditing) {
      setActiveProfilePanelId(panelId)

      return () => {
        if (activeProfilePanelId === panelId) {
          setActiveProfilePanelId(null)
        }
      }
    }

    if (activeProfilePanelId === panelId) {
      setActiveProfilePanelId(null)
    }

    return undefined
  }, [isEditing, panelId])

  const handleCancel = () => {
    onCancel()

    if (activeProfilePanelId === panelId) {
      setActiveProfilePanelId(null)
    }
  }

  const handleEdit = () => {
    if (isPanelLocked) {
      return
    }

    setActiveProfilePanelId(panelId)
    onEdit()
  }

  return (
    <div className={cn("transition-opacity", isPanelLocked && "opacity-45")}>
      <div className="mb-4 flex flex-col gap-3 border-b pb-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-950">{title}</h3>
            {needsAttention && (
              <span title="Needs attention">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
              </span>
            )}
          </div>
          {description ? (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button disabled={isMutationPending} type="button" onClick={onSave}>
              {isMutationPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {saveLabel}
            </Button>
            <Button
              disabled={isMutationPending}
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            className="align-self-end"
            disabled={isPanelLocked}
            type="button"
            variant="link"
            onClick={handleEdit}
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
  rows: ReadonlyArray<ProfilePanelDetailRow>
  itemBgClassName?: string
}) => (
  <dl className="grid gap-3 sm:grid-cols-2">
    {rows.map(([label, value, helperText]) => (
      <div
        className={cn("relative border border-slate-200 p-3", itemBgClassName)}
        key={label}
      >
        <dt className="pr-7 text-xs font-medium text-slate-500">{label}</dt>
        {helperText ? (
          <div className="absolute top-2 right-2">
            <InfoTooltip text={helperText} />
          </div>
        ) : null}
        <dd className="mt-1 text-sm font-medium text-slate-900">
          {value ?? "Not answered"}
        </dd>
      </div>
    ))}
  </dl>
)
