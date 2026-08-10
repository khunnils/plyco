import { z } from "zod";

import { organizationSummarySchema } from "./organizations.js";

export const authUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().trim().min(1),
  picture: z.string().url().optional(),
});

export const authStateSchema = z.object({
  user: authUserSchema.nullable(),
  organizations: z.array(organizationSummarySchema).default([]),
});

export const magicLinkRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Email must be valid")
    .transform((email) => email.toLowerCase()),
  returnTo: z.string().trim().min(1).optional(),
});

export const magicLinkResponseSchema = z.object({
  sent: z.literal(true),
});

export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthState = z.infer<typeof authStateSchema>;
export type MagicLinkRequest = z.infer<typeof magicLinkRequestSchema>;
export type MagicLinkResponse = z.infer<typeof magicLinkResponseSchema>;
