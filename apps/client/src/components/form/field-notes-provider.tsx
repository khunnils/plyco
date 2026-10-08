import { type ReactNode } from "react"
import { useWatch, type FieldValues, type UseFormReturn } from "react-hook-form"
import { type FieldNotes } from "@plyco/contracts"

import {
  applyNoteToForm,
  noteBindingFor,
  type NoteBinding,
} from "./field-notes-draft"
import { FieldNotesContext } from "./field-notes-context"

export const FieldNotesProvider = <T extends FieldValues>({
  form,
  children,
  bindings = {},
}: {
  form: UseFormReturn<T>
  children: ReactNode
  bindings?: Record<string, NoteBinding>
}) => {
  const values = useWatch({ control: form.control })
  const bindingFor = (name: string) => noteBindingFor(name, bindings)
  const notesAt = (path: string): FieldNotes => {
    const value = path
      .split(".")
      .reduce<unknown>(
        (current, key) =>
          current && typeof current === "object"
            ? (current as Record<string, unknown>)[key]
            : undefined,
        values
      )
    return (value as FieldNotes | undefined) ?? {}
  }
  return (
    <FieldNotesContext.Provider
      value={{
        getNote: (name) => {
          const { path, key } = bindingFor(name)
          return notesAt(path)[key]
        },
        applyNote: (name, note) =>
          applyNoteToForm(form, bindingFor(name), note),
      }}
    >
      {children}
    </FieldNotesContext.Provider>
  )
}
