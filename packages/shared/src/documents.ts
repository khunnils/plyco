import { z } from "zod";

import { templateSchema } from "./templates.js";

export const documentSourceFingerprintSchema = z.object({
  version: z.literal(1),
  contentHash: z.string().min(1),
  entries: z.array(
    z.object({
      path: z.string().min(1),
      label: z.string().min(1),
      valueHash: z.string().min(1),
      summary: z.object({
        display: z.string(),
        names: z.array(z.string()).default([]),
      }),
    }),
  ),
});

export const documentSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  templateId: z.string().min(1),
  title: z.string().trim().min(1),
  renderedContent: z.string(),
  hasPdf: z.boolean(),
  sourceHash: z.string().min(1),
  sourceFingerprint: documentSourceFingerprintSchema,
  templateVersionMajor: z.number().int().default(1),
  templateVersionMinor: z.number().int().default(0),
  generatedAt: z.string().datetime(),
});

export const documentStatusSchema = z.enum([
  "not_generated",
  "current",
  "stale",
]);

export const documentSummarySchema = z.object({
  template: templateSchema,
  document: documentSchema.nullable(),
  status: documentStatusSchema,
  staleReasons: z.array(z.string().min(1)).default([]),
  documents: z.array(documentSchema).default([]),
});

export const createDocumentSchema = z.object({
  templateId: z.string().min(1),
});

export type DocumentSourceFingerprint = z.infer<
  typeof documentSourceFingerprintSchema
>;
export type Document = z.infer<typeof documentSchema>;
export type DocumentStatus = z.infer<typeof documentStatusSchema>;
export type DocumentSummary = z.infer<typeof documentSummarySchema>;
export type CreateDocument = z.infer<typeof createDocumentSchema>;
