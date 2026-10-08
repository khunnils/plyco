import { z } from "zod";

export const fieldNoteSchema = z
  .object({
    customerFacing: z.string().trim().max(5000).default(""),
    internal: z.string().trim().max(5000).default(""),
  })
  .strict();

export type FieldNote = z.infer<typeof fieldNoteSchema>;
export type FieldNotes = Record<string, FieldNote>;

export const createFieldNotesSchema = (keys: string[]) =>
  z
    .record(z.string(), fieldNoteSchema)
    .superRefine((notes, context) => {
      for (const key of Object.keys(notes)) {
        if (!keys.includes(key))
          context.addIssue({
            code: "custom",
            path: [key],
            message: "Unknown field for notes",
          });
      }
    })
    .transform((notes) =>
      Object.fromEntries(
        Object.entries(notes).filter(
          ([, note]) => note.customerFacing || note.internal,
        ),
      ),
    );

export const profileWithFieldNotes = <T extends z.ZodRawShape>(
  shape: T,
  extraKeys: string[] = [],
) =>
  z.object({
    ...shape,
    fieldNotes: createFieldNotesSchema([
      ...Object.keys(shape).filter(
        (key) => !["id", "sortOrder", "providerId"].includes(key),
      ),
      ...extraKeys,
    ]).optional(),
  });

export const preserveFieldNotes = <T extends { fieldNotes?: FieldNotes }>(
  next: T,
  previous?: { fieldNotes?: FieldNotes },
): T => ({
  ...next,
  fieldNotes: next.fieldNotes ?? previous?.fieldNotes ?? {},
});
