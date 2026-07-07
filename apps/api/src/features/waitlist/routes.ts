import {
  waitlistInputSchema,
  waitlistRemoveInputSchema,
  waitlistRemoveResponseSchema,
  waitlistResponseSchema,
} from "@plyco/shared"
import { type FastifyInstance, type FastifyRequest } from "fastify"

import { requireApiKey } from "../../infrastructure/api-key-auth.js"
import { ApiError } from "../../infrastructure/errors.js"
import { type ServerAnalytics } from "../../infrastructure/server-analytics.js"
import { type WaitlistContactSyncer } from "./contact-sync.js"
import { type WaitlistRepository } from "./repository.js"

type RateLimitEntry = {
  count: number
  resetAt: number
}

const WINDOW_MS = 60_000
const MAX_REQUESTS_PER_WINDOW = 5

function clientAddress(request: FastifyRequest) {
  const forwardedFor = request.headers["x-forwarded-for"]
  const firstForwardedAddress = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(",")[0]

  return firstForwardedAddress?.trim() || request.ip
}

export async function registerWaitlistRoutes(
  app: FastifyInstance,
  {
    serverAnalytics,
    waitlistContactSyncer,
    waitlistRepository,
    toolApiKey,
  }: {
    serverAnalytics: ServerAnalytics
    toolApiKey?: string
    waitlistContactSyncer: WaitlistContactSyncer
    waitlistRepository: WaitlistRepository
  },
) {
  const rateLimits = new Map<string, RateLimitEntry>()

  app.post("/waitlist", async (request, reply) => {
    const now = Date.now()
    const address = clientAddress(request)
    const current = rateLimits.get(address)
    const rateLimit =
      !current || current.resetAt <= now
        ? { count: 1, resetAt: now + WINDOW_MS }
        : { count: current.count + 1, resetAt: current.resetAt }

    rateLimits.set(address, rateLimit)

    if (rateLimit.count > MAX_REQUESTS_PER_WINDOW) {
      throw new ApiError(
        "RATE_LIMIT_EXCEEDED",
        "Too many waitlist requests. Please try again shortly.",
        429,
      )
    }

    const input = waitlistInputSchema.parse(request.body)

    // Silently accept honeypot submissions without persisting them.
    if (!input.website) {
      await waitlistRepository.upsert({
        email: input.email,
        blocker: input.blocker,
      })
      await waitlistContactSyncer.sync({
        email: input.email,
        blocker: input.blocker,
      })
      try {
        await serverAnalytics.capture({
          event: "waitlist_signup_completed",
          distinctId: input.email,
          properties: {
            source: "marketing_waitlist_form",
            has_blocker: Boolean(input.blocker),
          },
        })
      } catch (error) {
        request.log.warn(
          {
            err: error,
            event: "waitlist_signup_completed",
          },
          "server analytics capture failed",
        )
      }
    }

    return reply.status(202).send(waitlistResponseSchema.parse({ accepted: true }))
  })

  app.delete("/waitlist", async (request, reply) => {
    requireApiKey(request, toolApiKey)
    const input = waitlistRemoveInputSchema.parse(request.body)

    await waitlistRepository.remove(input.email)
    try {
      await waitlistContactSyncer.remove(input.email)
    } catch (error) {
      request.log.warn(
        {
          err: error,
          email: input.email,
        },
        "waitlist contact removal sync failed",
      )
    }

    return reply
      .status(200)
      .send(waitlistRemoveResponseSchema.parse({ removed: true }))
  })
}
