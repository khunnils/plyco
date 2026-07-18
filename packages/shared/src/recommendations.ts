import { z } from "zod";

import { codeIdSchema } from "./common.js";

export const recommendationSeveritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);

export const recommendationAreas = [
  "security",
  "privacy",
  "access",
  "infrastructure",
  "activities",
  "data",
  "services",
  "vendors",
] as const;

export const recommendationAreaSchema = z.enum(recommendationAreas);

export const readinessScoreAreas = [
  "security",
  "privacy",
  "access",
  "infrastructure",
  "productAndData",
] as const;

export const readinessScoreAreaSchema = z.enum(readinessScoreAreas);

export const recommendationSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  category: recommendationAreaSchema,
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

export const readinessScoreSchema = z
  .object({
    value: z.number().int().min(0).max(100).nullable(),
    assessedRuleCount: z.number().int().min(0),
    applicableRuleCount: z.number().int().min(0),
  })
  .superRefine((score, context) => {
    if (score.assessedRuleCount > score.applicableRuleCount) {
      context.addIssue({
        code: "custom",
        message: "Assessed rule count cannot exceed applicable rule count",
        path: ["assessedRuleCount"],
      });
    }

    if ((score.assessedRuleCount === 0) !== (score.value === null)) {
      context.addIssue({
        code: "custom",
        message: "Score value must be null exactly when no rules are assessed",
        path: ["value"],
      });
    }
  });

export const readinessScoresSchema = z.object({
  overall: readinessScoreSchema,
  byArea: z.object({
    security: readinessScoreSchema,
    privacy: readinessScoreSchema,
    access: readinessScoreSchema,
    infrastructure: readinessScoreSchema,
    productAndData: readinessScoreSchema,
  }),
});

export const recommendationsResponseSchema = z.object({
  recommendations: z.array(recommendationSchema),
  countsBySeverity: recommendationCountsBySeveritySchema,
  scores: readinessScoresSchema,
});

export type RecommendationSeverity = z.infer<
  typeof recommendationSeveritySchema
>;
export type RecommendationArea = z.infer<typeof recommendationAreaSchema>;
export type ReadinessScoreArea = z.infer<typeof readinessScoreAreaSchema>;
export type Recommendation = z.infer<typeof recommendationSchema>;
export type RecommendationCountsBySeverity = z.infer<
  typeof recommendationCountsBySeveritySchema
>;
export type ReadinessScore = z.infer<typeof readinessScoreSchema>;
export type ReadinessScores = z.infer<typeof readinessScoresSchema>;
export type RecommendationsResponse = z.infer<
  typeof recommendationsResponseSchema
>;
