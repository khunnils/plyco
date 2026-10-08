import { type ReactNode, useId } from "react"
import { createPortal } from "react-dom"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"

export const DeleteConfirmDialog = ({
  confirmLabel,
  description,
  isOpen,
  isPending,
  title,
  onClose,
  onConfirm,
}: {
  confirmLabel: string
  description: ReactNode
  isOpen: boolean
  isPending: boolean
  title: string
  onClose: () => void
  onConfirm: () => void
}) => {
  const titleId = useId()
  const descriptionId = useId()

  if (!isOpen) {
    return null
  }

  return createPortal(
    <div
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4"
      role="dialog"
    >
      <div className="w-full max-w-md border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-red-50 text-red-700">
            <Trash2 className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-950" id={titleId}>
              {title}
            </h2>
            <p
              className="mt-2 text-sm leading-6 text-slate-600"
              id={descriptionId}
            >
              {description}
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            disabled={isPending}
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            disabled={isPending}
            type="button"
            variant="destructive"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
