import { z } from "zod";

import {
  businessActivityInputSchema,
  companyProfileSchema,
  serviceProfileInputSchema,
  storedDataTypeSchema,
} from "./profiles.js";

export const organizationMembershipRoleSchema = z.enum(["owner", "member"]);

export const organizationMemberSchema = z.object({
  userId: z.string().min(1),
  name: z.string().trim().min(1),
  email: z.string().email(),
  role: organizationMembershipRoleSchema,
  createdAt: z.string().datetime().optional(),
});

export const organizationSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  role: organizationMembershipRoleSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required"),
  website: z.string().trim().url().optional(),
});

export const organizationInvitationInputSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invite email must be valid")
    .transform((email) => email.toLowerCase()),
  role: organizationMembershipRoleSchema,
});

export const organizationInvitationSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  email: z.string().email(),
  role: organizationMembershipRoleSchema,
  invitedByUserId: z.string().min(1),
  invitedByName: z.string().trim().min(1),
  expiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export const organizationMemberRoleUpdateSchema = z.object({
  role: organizationMembershipRoleSchema,
});

export const acceptOrganizationInvitationSchema = z.object({
  organization: organizationSummarySchema,
});

export const deleteOrganizationResponseSchema = z.object({
  deleted: z.literal(true),
});

export const createOrganizationApiKeySchema = z.object({
  name: z.string().trim().min(1, "API key name is required").max(100),
});

export const organizationApiKeySchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  keyPrefix: z.string().min(1),
  createdByUserId: z.string().min(1),
  createdByName: z.string().trim().min(1),
  createdAt: z.string().datetime(),
});

// The raw `key` is returned only once, at creation time; it is never persisted
// in plaintext and cannot be retrieved again.
export const createdOrganizationApiKeySchema = organizationApiKeySchema.extend({
  key: z.string().min(1),
});

export const organizationLookupInputSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required"),
  website: z.string().trim().url("Website must be a valid URL"),
});

export const organizationWebsiteLookupInputSchema = z.object({
  website: z.string().trim().url("Website must be a valid URL"),
});

export const organizationWebsiteReachabilitySchema = z.object({
  reachable: z.literal(true),
});

export const organizationPrivacyPolicyLookupInputSchema = z.object({
  privacyPolicyUrl: z
    .string()
    .trim()
    .url("Privacy policy URL must be a valid URL"),
});

export const organizationLookupPolicyLinkSchema = z.object({
  type: z
    .enum([
      "privacy_policy",
      "data_security",
      "subprocessors",
      "terms",
      "other",
    ])
    .default("other"),
  title: z.string().trim().min(1),
  url: z.string().trim().url(),
});

export const organizationLookupSuggestedProviderSchema = z.object({
  name: z.string().trim().min(1),
  url: z.string().trim().url().optional(),
  purpose: z.string().trim().optional(),
});

export const organizationLookupResultSchema = z.object({
  company: companyProfileSchema,
  primaryService: serviceProfileInputSchema,
  dataTypes: z.array(storedDataTypeSchema).default([]),
  activities: z.array(businessActivityInputSchema).default([]),
  suggestedProviders: z
    .array(organizationLookupSuggestedProviderSchema)
    .max(12)
    .default([]),
  policyLinks: z.array(organizationLookupPolicyLinkSchema).max(12).default([]),
  privacyPolicyUrl: z.string().trim().url().nullable().default(null),
  warnings: z.array(z.string().trim().min(1)).max(8).default([]),
});

export type OrganizationMembershipRole = z.infer<
  typeof organizationMembershipRoleSchema
>;
export type OrganizationMember = z.infer<typeof organizationMemberSchema>;
export type OrganizationSummary = z.infer<typeof organizationSummarySchema>;
export type CreateOrganization = z.infer<typeof createOrganizationSchema>;
export type OrganizationInvitationInput = z.infer<
  typeof organizationInvitationInputSchema
>;
export type OrganizationInvitation = z.infer<
  typeof organizationInvitationSchema
>;
export type OrganizationMemberRoleUpdate = z.infer<
  typeof organizationMemberRoleUpdateSchema
>;
export type AcceptOrganizationInvitation = z.infer<
  typeof acceptOrganizationInvitationSchema
>;
export type DeleteOrganizationResponse = z.infer<
  typeof deleteOrganizationResponseSchema
>;
export type CreateOrganizationApiKey = z.infer<
  typeof createOrganizationApiKeySchema
>;
export type OrganizationApiKey = z.infer<typeof organizationApiKeySchema>;
export type CreatedOrganizationApiKey = z.infer<
  typeof createdOrganizationApiKeySchema
>;
export type OrganizationLookupInput = z.infer<
  typeof organizationLookupInputSchema
>;
export type OrganizationWebsiteLookupInput = z.infer<
  typeof organizationWebsiteLookupInputSchema
>;
export type OrganizationWebsiteReachability = z.infer<
  typeof organizationWebsiteReachabilitySchema
>;
export type OrganizationPrivacyPolicyLookupInput = z.infer<
  typeof organizationPrivacyPolicyLookupInputSchema
>;
export type OrganizationLookupPolicyLink = z.infer<
  typeof organizationLookupPolicyLinkSchema
>;
export type OrganizationLookupSuggestedProvider = z.infer<
  typeof organizationLookupSuggestedProviderSchema
>;
export type OrganizationLookupResult = z.infer<
  typeof organizationLookupResultSchema
>;
