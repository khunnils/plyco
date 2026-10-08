import { useId, useState } from "react"
import { Dialog } from "radix-ui"
import { fieldNoteSchema, type FieldNote } from "@plyco/contracts"
import { Button } from "@/components/ui/button"

export const FieldNotesDialog = ({
  label,
  note,
  onApply,
  onClose,
}: {
  label: string
  note?: FieldNote
  onApply: (note: FieldNote) => void
  onClose: () => void
}) => {
  const [draft, setDraft] = useState(
    note ?? { customerFacing: "", internal: "" }
  )
  const id = useId()
  const apply = () => {
    const parsed = fieldNoteSchema.safeParse(draft)
    if (!parsed.success) return
    onApply(parsed.data)
    onClose()
  }
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-slate-900/40" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 z-[101] grid max-h-[calc(100svh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-5 overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
          onKeyDown={(event) => event.stopPropagation()}
          onEscapeKeyDown={(event) => {
            event.preventDefault()
            onClose()
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <Dialog.Title className="text-lg font-semibold text-slate-950">
            {label} notes
          </Dialog.Title>
          <Dialog.Description className="text-sm text-slate-500">
            Apply notes here, then save the form to keep your changes.
          </Dialog.Description>
          {(["customerFacing", "internal"] as const).map((kind) => (
            <div key={kind} className="grid gap-2">
              <label
                htmlFor={`${id}-${kind}`}
                className="text-sm font-medium text-slate-800"
              >
                {kind === "customerFacing"
                  ? "Customer-facing note"
                  : "Internal note"}
              </label>
              <p
                id={`${id}-${kind}-help`}
                className="text-xs leading-5 text-slate-500"
              >
                {kind === "customerFacing"
                  ? "Included in policies that use this field and support notes."
                  : "For your workspace team. Never included in policies."}
              </p>
              <textarea
                id={`${id}-${kind}`}
                aria-describedby={`${id}-${kind}-help`}
                maxLength={5000}
                className="field-focus min-h-28 rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                value={draft[kind]}
                onChange={(event) =>
                  setDraft({ ...draft, [kind]: event.target.value })
                }
              />
            </div>
          ))}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={apply}>
              Apply
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
