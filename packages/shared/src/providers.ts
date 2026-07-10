import { z } from "zod";

import { codeIdSchema, countryCodeSchema } from "./common.js";

export const dpaStatusSchema = z.enum([
  "not_started",
  "requested",
  "under_review",
  "signed",
  "not_required",
  "unavailable",
  "unknown",
]);

export const providerCriticalitySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);

export const providerDataProcessingLevelSchema = z.enum([
  "none",
  "limited",
  "subprocessor",
  "not_set",
]);

export const providerSystemTypeSchema = z.enum([
  "ai",
  "auth",
  "source_control",
  "cloud",
  "password_manager",
  "analytics",
  "advertising",
  "issue_tracking",
  "newsletter",
]);

export const providerSelectionSchema = z.object({
  systemType: providerSystemTypeSchema,
  providerId: z.string().trim().min(1),
  name: z.string().trim().optional(),
});

export const organizationProviderInputSchema = z.object({
  providerId: z.string().trim().optional().or(z.literal("")),
  systemTypes: z.array(providerSystemTypeSchema).default([]),
  name: z.string().trim().min(1, "Provider name is required"),
  legalName: z.string().trim().default(""),
  category: codeIdSchema.or(z.literal("")).default(""),
  countryOfRegistration: countryCodeSchema.or(z.literal("")).default(""),
  criticality: providerCriticalitySchema,
  notes: z.string().trim().optional().or(z.literal("")),
  purpose: z.string().trim().optional().or(z.literal("")),
});

export const organizationProviderInventorySchema =
  organizationProviderInputSchema.extend({
    id: z.string().min(1),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  });

const serviceProviderUsageInputBaseSchema = z.object({
  serviceId: z.string().trim().min(1, "Service is required"),
  organizationProviderId: z.string().trim().min(1, "Provider is required"),
  systemType: providerSystemTypeSchema.nullable().default(null),
  purpose: z.string().trim().min(1, "Purpose is required"),
  dataProcessingLevel: providerDataProcessingLevelSchema.default("limited"),
  dataProcessed: z.array(z.string().trim().min(1)).default([]),
  dpaStatus: dpaStatusSchema.nullable().default(null),
  dataRegions: z.array(codeIdSchema).default([]),
  notes: z.string().trim().optional().or(z.literal("")),
});

const normalizeProviderDataProcessingNone = <
  T extends z.infer<typeof serviceProviderUsageInputBaseSchema>,
>(
  value: T,
): T =>
  value.dataProcessingLevel === "none"
    ? ({
        ...value,
        dataProcessed: [],
        dataRegions: [],
        dpaStatus: null,
      } as T)
    : value;

export const serviceProviderUsageInputSchema =
  serviceProviderUsageInputBaseSchema.transform(
    normalizeProviderDataProcessingNone,
  );

const serviceProviderUsageStoredBaseSchema =
  serviceProviderUsageInputBaseSchema.extend({
    id: z.string().min(1),
    serviceName: z.string().trim().default(""),
    providerName: z.string().trim().default(""),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  });

export const serviceProviderUsageSchema =
  serviceProviderUsageStoredBaseSchema.transform(
    normalizeProviderDataProcessingNone,
  );

export const providerSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  logoUrl: z.string().url().optional(),
  url: z.string().url().optional(),
  category: z.string().trim().min(1).optional(),
  categoryCode: z.string().trim().optional(),
  legalName: z.string().trim().optional(),
  countryOfRegistration: z.string().trim().optional(),
  systemTypes: z.array(providerSystemTypeSchema).default([]),
  securityCriticality: z.string().trim().min(1).optional(),
  handlesCustomerData: z.boolean(),
  purpose: z.string().trim().optional(),
});

export const providerLookupInputSchema = z.object({
  inputUrl: z.string().trim().url(),
});

export const providerLookupResultSchema = z
  .object({
    organization: z
      .object({
        id: z.string().trim(),
        name: z.string().trim(),
        legalName: z.string().trim(),
        countryOfRegistration: z.string().trim(),
        website: z.string().trim(),
      })
      .strict(),
    provider: z
      .object({
        id: z.string().trim(),
        name: z.string().trim(),
        organization: z.string().trim(),
        category: z.string().trim(),
        purpose: z.string().trim(),
        url: z.string().trim(),
        systemType: z.string().trim().nullable(),
        securityCriticality: z.string().trim(),
        handlesCustomerData: z.boolean(),
      })
      .strict(),
  })
  .strict();

export const providerImportResultSchema = z
  .object({
    organizationRecordId: z.string().min(1),
    providerRecordId: z.string().min(1),
    organizationAction: z.enum(["created", "updated"]),
    providerAction: z.enum(["created", "updated"]),
    lookup: providerLookupResultSchema,
  })
  .strict();

export type DpaStatus = z.infer<typeof dpaStatusSchema>;
export type ProviderCriticality = z.infer<typeof providerCriticalitySchema>;
export type ProviderDataProcessingLevel = z.infer<
  typeof providerDataProcessingLevelSchema
>;
export type ProviderSystemType = z.infer<typeof providerSystemTypeSchema>;
export type ProviderSelection = z.infer<typeof providerSelectionSchema>;
export type OrganizationProviderInput = z.infer<
  typeof organizationProviderInputSchema
>;
export type OrganizationProvider = z.infer<
  typeof organizationProviderInventorySchema
>;
export type ServiceProviderUsageInput = z.infer<
  typeof serviceProviderUsageInputSchema
>;
export type ServiceProviderUsage = z.infer<typeof serviceProviderUsageSchema>;
export type Provider = z.infer<typeof providerSchema>;
export type ProviderLookupInput = z.infer<typeof providerLookupInputSchema>;
export type ProviderLookupResult = z.infer<typeof providerLookupResultSchema>;
export type ProviderImportResult = z.infer<typeof providerImportResultSchema>;
