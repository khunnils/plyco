import { type FieldNote, type FieldNotes } from "@plyco/contracts"
import {
  type FieldPath,
  type FieldPathValue,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form"

export type NoteBinding = { path: string; key: string }

export const noteBindingFor = (
  name: string,
  bindings: Record<string, NoteBinding> = {}
): NoteBinding =>
  bindings[name] ??
  (name.startsWith("privacy.")
    ? { path: "privacy.fieldNotes", key: name.slice("privacy.".length) }
    : { path: "fieldNotes", key: name })

export const withFieldNote = (
  notes: FieldNotes,
  key: string,
  note: FieldNote
): FieldNotes => {
  const next = { ...notes }
  if (note.customerFacing || note.internal) next[key] = note
  else delete next[key]
  return next
}

export const applyNoteToForm = <T extends FieldValues>(
  form: Pick<UseFormReturn<T>, "getValues" | "setValue">,
  { path, key }: NoteBinding,
  note: FieldNote
) => {
  const formPath = path as FieldPath<T>
  const current = (form.getValues(formPath) as FieldNotes | undefined) ?? {}
  // Map keys are stable field identifiers, which may contain dots rather than form paths.
  form.setValue(
    formPath,
    withFieldNote(current, key, note) as FieldPathValue<T, FieldPath<T>>,
    { shouldDirty: true }
  )
}
