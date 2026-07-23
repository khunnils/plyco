import { z } from "zod";

export const codeIdSchema = z
  .string()
  .trim()
  .min(1)
  .regex(
    /^[a-z0-9]+(?:[_-][a-z0-9]+)*$/,
    "Code IDs must use lowercase letters, numbers, underscores, or hyphens",
  );

/** Derive a code ID from a display name (e.g. "Artificial Intelligence" → "artificial_intelligence"). */
export const codeIdFromName = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

export const countryCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Z]{2}$/, "Country codes must use ISO alpha-2 format");

export const countrySchema = z.object({
  code: countryCodeSchema,
  name: z.string().trim().min(1),
  active: z.boolean(),
});

// Internal nullable helpers shared across schema modules. These are not part
// of the public `@plyco/shared` API surface and are intentionally not
// re-exported from the package barrel.
export const nullableStringSchema = z.string().trim().nullable().default(null);
export const nullableCodeIdSchema = codeIdSchema
  .or(z.literal(""))
  .nullable()
  .default(null);
export const nullableCountryCodeSchema = countryCodeSchema
  .or(z.literal(""))
  .nullable()
  .default(null);
export const nullableBooleanSchema = z.boolean().nullable().default(null);
export const nullableCodeIdArraySchema = z
  .array(codeIdSchema)
  .nullable()
  .default(null);
export const nullableNumberSchema = (schema: z.ZodNumber) =>
  schema.nullable().default(null);

export const reorderEntitiesSchema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1),
});

export type CodeId = z.infer<typeof codeIdSchema>;
export type CountryCode = z.infer<typeof countryCodeSchema>;
export type Country = z.infer<typeof countrySchema>;
export type ReorderEntitiesInput = z.infer<typeof reorderEntitiesSchema>;
