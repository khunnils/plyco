import { StickyNote } from "lucide-react"
import { useRef, useState } from "react"
import { useFieldNotes } from "./field-notes-context"
import { FieldNotesDialog } from "./field-notes-dialog"
import { cn } from "@/lib/utils"

export const FieldSettings = ({
  label,
  name,
  onOpen,
}: {
  label: string
  name: string
  onOpen?: () => void
}) => {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const notes = useFieldNotes()
  const [isOpen, setIsOpen] = useState(false)
  if (!notes) return null
  const note = notes.getNote(name)
  const hasNotes = Boolean(note?.customerFacing || note?.internal)
  const close = () => {
    setIsOpen(false)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }
  return (
    <>
      <button
        ref={triggerRef}
        aria-label={`${label} notes${hasNotes ? ", has notes" : ""}`}
        title={`${label} notes${hasNotes ? " (has notes)" : ""}`}
        type="button"
        className={cn(
          "rounded-sm p-1 text-slate-400 opacity-0 transition group-hover/field:opacity-100 hover:bg-slate-100 hover:text-slate-700 focus-visible:opacity-100 [@media(hover:none)]:opacity-100",
          (hasNotes || isOpen) && "opacity-100",
          hasNotes && "text-blue-600"
        )}
        onKeyDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.preventDefault()}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onOpen?.()
          setIsOpen(true)
        }}
      >
        <StickyNote className="size-3.5" />
      </button>
      {isOpen ? (
        <FieldNotesDialog
          label={label}
          note={note}
          onApply={(next) => notes.applyNote(name, next)}
          onClose={close}
        />
      ) : null}
    </>
  )
}
