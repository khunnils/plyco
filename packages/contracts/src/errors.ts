import { z } from "zod";

export const structuredErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export type StructuredError = z.infer<typeof structuredErrorSchema>;
