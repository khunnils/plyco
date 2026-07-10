import { z } from "zod";

export const waitlistInputSchema = z.object({
  email: z
    .string()
    .trim()
    .max(320)
    .email()
    .transform((email) => email.toLowerCase()),
  blocker: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((value) => value || undefined),
  website: z.string().trim().max(500).optional().default(""),
});

export const waitlistResponseSchema = z.object({
  accepted: z.literal(true),
});

export const waitlistRemoveInputSchema = z.object({
  email: z
    .string()
    .trim()
    .max(320)
    .email()
    .transform((email) => email.toLowerCase()),
});

export const waitlistRemoveResponseSchema = z.object({
  removed: z.literal(true),
});

export type WaitlistInput = z.infer<typeof waitlistInputSchema>;
export type WaitlistResponse = z.infer<typeof waitlistResponseSchema>;
export type WaitlistRemoveInput = z.infer<typeof waitlistRemoveInputSchema>;
export type WaitlistRemoveResponse = z.infer<typeof waitlistRemoveResponseSchema>;
