import { withFieldNote } from "./field-notes-draft"
import { type ReactNode } from "react"
import { type FieldNotes } from "@plyco/contracts"
import { FieldNotesContext } from "./field-notes-context"

export const FieldNotesValueProvider = ({
  notes,
  onChange,
  children,
}: {
  notes: FieldNotes
  onChange: (notes: FieldNotes) => void
  children: ReactNode
}) => (
  <FieldNotesContext.Provider
    value={{
      getNote: (name) => notes[name],
      applyNote: (name, note) => onChange(withFieldNote(notes, name, note)),
    }}
  >
    {children}
  </FieldNotesContext.Provider>
)
