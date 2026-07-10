import { z } from "zod";

import { codeIdSchema } from "./common.js";

export const recommendationSeveritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);

export const recommendationSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  category: z.string().trim().min(1),
  severity: recommendationSeveritySchema,
  frameworks: z.array(codeIdSchema).default([]),
  message: z.string().trim().min(1),
  recommendation: z.string().trim().min(1),
  relatedFields: z.array(z.string().trim().min(1)).default([]),
});

export const recommendationCountsBySeveritySchema = z.object({
  low: z.number().int().min(0).default(0),
  medium: z.number().int().min(0).default(0),
  high: z.number().int().min(0).default(0),
  critical: z.number().int().min(0).default(0),
});

export const recommendationsResponseSchema = z.object({
  recommendations: z.array(recommendationSchema),
  countsBySeverity: recommendationCountsBySeveritySchema,
});

export type RecommendationSeverity = z.infer<
  typeof recommendationSeveritySchema
>;
export type Recommendation = z.infer<typeof recommendationSchema>;
export type RecommendationCountsBySeverity = z.infer<
  typeof recommendationCountsBySeveritySchema
>;
export type RecommendationsResponse = z.infer<
  typeof recommendationsResponseSchema
>;
