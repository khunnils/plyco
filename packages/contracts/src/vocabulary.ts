import { z } from "zod";

import { codeIdSchema } from "./common.js";

export const vocabularyCodeSchema = z.object({
  id: z.string().min(1),
  codeId: codeIdSchema,
  name: z.string().trim().min(1),
  description: z.string().default(""),
  sortOrder: z.number().int().min(0),
  active: z.boolean(),
  isSystem: z.boolean(),
});

export const vocabularyCodeSetSchema = z.object({
  id: z.string().min(1),
  codeSetId: codeIdSchema,
  name: z.string().trim().min(1),
  description: z.string(),
  usesHints: z.boolean().default(false),
  isSystem: z.boolean(),
  codes: z.array(vocabularyCodeSchema),
});

export const vocabularySchema = z.object({
  codeSets: z.array(vocabularyCodeSetSchema),
});

export const vocabularyCodeInputSchema = z.object({
  codeId: codeIdSchema,
  name: z.string().trim().min(1, "Code name is required"),
  description: z.string().default(""),
  active: z.boolean().default(true),
});

export type VocabularyCode = z.infer<typeof vocabularyCodeSchema>;
export type VocabularyCodeSet = z.infer<typeof vocabularyCodeSetSchema>;
export type Vocabulary = z.infer<typeof vocabularySchema>;
export type VocabularyCodeInput = z.infer<typeof vocabularyCodeInputSchema>;
