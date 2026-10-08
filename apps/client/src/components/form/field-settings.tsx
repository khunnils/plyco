import { Settings } from "lucide-react"
import { useRef, useState } from "react"
import { useFieldNotes } from "./field-notes-context"
import { FieldNotesDialog } from "./field-notes-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export const FieldSettings = ({
  label,
  name,
  onEditOptions,
  onOpen,
}: {
  label: string
  name: string
  onEditOptions?: () => void
  onOpen?: () => void
}) => {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const notes = useFieldNotes()
  const [isOpen, setIsOpen] = useState(false)
  if (!notes && !onEditOptions) return null
  const note = notes?.getNote(name)
  const hasNotes = Boolean(note?.customerFacing || note?.internal)
  const close = () => {
    setIsOpen(false)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }
  const button = (
    <button
      ref={triggerRef}
      aria-label={`${label} settings${hasNotes ? ", has notes" : ""}`}
      title={`${label} settings${hasNotes ? " (has notes)" : ""}`}
      type="button"
      className={cn(
        "rounded-sm p-1 text-slate-400 opacity-0 transition group-hover/code-select:opacity-100 group-hover/field:opacity-100 hover:bg-slate-100 hover:text-slate-700 focus-visible:opacity-100 data-[state=open]:opacity-100 [@media(hover:none)]:opacity-100",
        hasNotes && "text-blue-600 opacity-100"
      )}
      onKeyDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onOpen?.()
        if (!onEditOptions) setIsOpen(true)
        else if (!notes) onEditOptions()
      }}
    >
      <Settings className="size-3.5" />
    </button>
  )
  return (
    <>
      {notes && onEditOptions ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>{button}</DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onKeyDown={(event) => event.stopPropagation()}
          >
            <DropdownMenuItem onSelect={() => setIsOpen(true)}>
              Field notes
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onEditOptions}>
              Edit options
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        button
      )}
      {isOpen && notes ? (
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
