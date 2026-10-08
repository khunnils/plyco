import { createContext, useContext } from "react"
import { type FieldNote } from "@plyco/contracts"

type NotesContext = {
  getNote: (name: string) => FieldNote | undefined
  applyNote: (name: string, note: FieldNote) => void
}
export const FieldNotesContext = createContext<NotesContext | null>(null)
export const useFieldNotes = () => useContext(FieldNotesContext)
