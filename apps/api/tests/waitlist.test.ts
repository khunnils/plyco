import { describe, expect, it } from "vitest"

import { createApp } from "../src/app.js"
import { ApiError } from "../src/infrastructure/errors.js"
import {
  type ServerAnalytics,
  type ServerAnalyticsCaptureInput,
} from "../src/infrastructure/server-analytics.js"
import {
  type WaitlistContactSyncInput,
  type WaitlistContactSyncer,
} from "../src/features/waitlist/contact-sync.js"
import { InMemoryWaitlistRepository } from "../src/features/waitlist/in-memory-repository.js"
import { type WaitlistRepository } from "../src/features/waitlist/repository.js"
import { authConfig, createInMemoryRepositories } from "./helpers.js"

class RecordingWaitlistContactSyncer implements WaitlistContactSyncer {
  readonly inputs: WaitlistContactSyncInput[] = []
  readonly removedEmails: string[] = []

  async sync(input: WaitlistContactSyncInput): Promise<void> {
    this.inputs.push(input)
  }

  async remove(email: string): Promise<void> {
    this.removedEmails.push(email)
  }
}

class RecordingServerAnalytics implements ServerAnalytics {
  readonly inputs: ServerAnalyticsCaptureInput[] = []

  async capture(input: ServerAnalyticsCaptureInput): Promise<void> {
    this.inputs.push(input)
  }
}

async function createWaitlistTestApp(
  waitlistRepository: WaitlistRepository = new InMemoryWaitlistRepository(),
  waitlistContactSyncer: WaitlistContactSyncer = new RecordingWaitlistContactSyncer(),
  serverAnalytics: ServerAnalytics = new RecordingServerAnalytics(),
) {
  return createApp({
    ...createInMemoryRepositories(),
    auth: authConfig,
    providerLookupApiKey: "test-api-key",
    serverAnalytics,
    waitlistContactSyncer,
    waitlistRepository,
  })
}

describe("waitlist API", () => {
  it("accepts and normalizes anonymous submissions", async () => {
    const repository = new InMemoryWaitlistRepository()
    const contactSyncer = new RecordingWaitlistContactSyncer()
    const serverAnalytics = new RecordingServerAnalytics()
    const app = await createWaitlistTestApp(
      repository,
      contactSyncer,
      serverAnalytics,
    )

    const response = await app.inject({
      method: "POST",
      url: "/waitlist",
      payload: {
        email: " Founder@Example.COM ",
        blocker: " Security questionnaire ",
      },
    })

    expect(response.statusCode).toBe(202)
    expect(response.json()).toEqual({ accepted: true })
    expect(repository.entries.get("founder@example.com")).toEqual({
      email: "founder@example.com",
      blocker: "Security questionnaire",
    })
    expect(contactSyncer.inputs).toEqual([
      {
        email: "founder@example.com",
        blocker: "Security questionnaire",
      },
    ])
    expect(serverAnalytics.inputs).toEqual([
      {
        event: "waitlist_signup_completed",
        distinctId: "founder@example.com",
        properties: {
          source: "marketing_waitlist_form",
          has_blocker: true,
        },
      },
    ])

    await app.close()
  })

  it("rejects invalid email addresses", async () => {
    const app = await createWaitlistTestApp()
    const response = await app.inject({
      method: "POST",
      url: "/waitlist",
      payload: { email: "invalid" },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({
      error: { code: "VALIDATION_FAILED" },
    })

    await app.close()
  })

  it("accepts submissions without a blocker", async () => {
    const repository = new InMemoryWaitlistRepository()
    const contactSyncer = new RecordingWaitlistContactSyncer()
    const serverAnalytics = new RecordingServerAnalytics()
    const app = await createWaitlistTestApp(
      repository,
      contactSyncer,
      serverAnalytics,
    )
    const response = await app.inject({
      method: "POST",
      url: "/waitlist",
      payload: { email: "founder@example.com" },
    })

    expect(response.statusCode).toBe(202)
    expect(repository.entries.get("founder@example.com")).toEqual({
      email: "founder@example.com",
      blocker: undefined,
    })
    expect(contactSyncer.inputs).toEqual([
      {
        email: "founder@example.com",
        blocker: undefined,
      },
    ])
    expect(serverAnalytics.inputs).toEqual([
      {
        event: "waitlist_signup_completed",
        distinctId: "founder@example.com",
        properties: {
          source: "marketing_waitlist_form",
          has_blocker: false,
        },
      },
    ])

    await app.close()
  })

  it("keeps repeat submissions idempotent", async () => {
    const repository = new InMemoryWaitlistRepository()
    const app = await createWaitlistTestApp(repository)

    for (const blocker of ["SOC 2", "Vendor review"]) {
      const response = await app.inject({
        method: "POST",
        url: "/waitlist",
        payload: { email: "founder@example.com", blocker },
      })
      expect(response.statusCode).toBe(202)
      expect(response.json()).toEqual({ accepted: true })
    }

    expect(repository.entries.size).toBe(1)
    expect(repository.entries.get("founder@example.com")?.blocker).toBe(
      "Vendor review",
    )

    await app.close()
  })

  it("silently accepts honeypot submissions without persistence", async () => {
    const repository = new InMemoryWaitlistRepository()
    const contactSyncer = new RecordingWaitlistContactSyncer()
    const serverAnalytics = new RecordingServerAnalytics()
    const app = await createWaitlistTestApp(
      repository,
      contactSyncer,
      serverAnalytics,
    )
    const response = await app.inject({
      method: "POST",
      url: "/waitlist",
      payload: {
        email: "bot@example.com",
        website: "https://spam.example",
      },
    })

    expect(response.statusCode).toBe(202)
    expect(response.json()).toEqual({ accepted: true })
    expect(repository.entries.size).toBe(0)
    expect(contactSyncer.inputs).toEqual([])
    expect(serverAnalytics.inputs).toEqual([])

    await app.close()
  })

  it("accepts waitlist submissions when analytics capture fails", async () => {
    const repository = new InMemoryWaitlistRepository()
    const app = await createWaitlistTestApp(
      repository,
      new RecordingWaitlistContactSyncer(),
      {
        async capture() {
          throw new ApiError(
            "SERVER_ANALYTICS_CAPTURE_FAILED",
            "Server analytics event could not be captured.",
            502,
            { status: 503 },
          )
        },
      },
    )

    const response = await app.inject({
      method: "POST",
      url: "/waitlist",
      payload: { email: "founder@example.com" },
    })

    expect(response.statusCode).toBe(202)
    expect(response.json()).toEqual({ accepted: true })
    expect(repository.entries.get("founder@example.com")).toEqual({
      email: "founder@example.com",
      blocker: undefined,
    })

    await app.close()
  })

  it("removes waitlist entries with tool API key authentication", async () => {
    const repository = new InMemoryWaitlistRepository()
    const contactSyncer = new RecordingWaitlistContactSyncer()
    const app = await createWaitlistTestApp(repository, contactSyncer)

    await repository.upsert({
      email: "founder@example.com",
      blocker: "SOC 2",
    })

    const response = await app.inject({
      method: "DELETE",
      url: "/waitlist",
      headers: { authorization: "Bearer test-api-key" },
      payload: { email: " Founder@Example.COM " },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ removed: true })
    expect(repository.entries.has("founder@example.com")).toBe(false)
    expect(contactSyncer.removedEmails).toEqual(["founder@example.com"])

    await app.close()
  })

  it("keeps removal successful when contact sync removal fails", async () => {
    const repository = new InMemoryWaitlistRepository()
    const app = await createWaitlistTestApp(repository, {
      async sync() {},
      async remove() {
        throw new ApiError(
          "WAITLIST_CONTACT_SYNC_FAILED",
          "Waitlist contact could not be synced.",
          502,
          { operation: "remove_contact_from_segment", status: "network_error" },
        )
      },
    })

    await repository.upsert({
      email: "founder@example.com",
      blocker: "SOC 2",
    })

    const response = await app.inject({
      method: "DELETE",
      url: "/waitlist",
      headers: { authorization: "Bearer test-api-key" },
      payload: { email: "founder@example.com" },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ removed: true })
    expect(repository.entries.has("founder@example.com")).toBe(false)

    await app.close()
  })

  it("requires the tool API key for waitlist removal", async () => {
    const repository = new InMemoryWaitlistRepository()
    const contactSyncer = new RecordingWaitlistContactSyncer()
    const app = await createWaitlistTestApp(repository, contactSyncer)

    const response = await app.inject({
      method: "DELETE",
      url: "/waitlist",
      payload: { email: "founder@example.com" },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toMatchObject({
      error: { code: "API_KEY_AUTHENTICATION_REQUIRED" },
    })
    expect(contactSyncer.removedEmails).toEqual([])

    await app.close()
  })

  it("returns the structured server error when persistence fails", async () => {
    const contactSyncer = new RecordingWaitlistContactSyncer()
    const app = await createWaitlistTestApp({
      async upsert() {
        throw new Error("database unavailable")
      },
      async remove() {
        throw new Error("database unavailable")
      },
    }, contactSyncer)
    const response = await app.inject({
      method: "POST",
      url: "/waitlist",
      payload: { email: "founder@example.com" },
    })

    expect(response.statusCode).toBe(500)
    expect(response.json()).toMatchObject({
      error: { code: "INTERNAL_SERVER_ERROR" },
    })
    expect(contactSyncer.inputs).toEqual([])

    await app.close()
  })

  it("returns a structured upstream error when contact sync fails", async () => {
    const repository = new InMemoryWaitlistRepository()
    const app = await createWaitlistTestApp(repository, {
      async sync() {
        throw new ApiError(
          "WAITLIST_CONTACT_SYNC_FAILED",
          "Waitlist contact could not be synced.",
          502,
          { operation: "update_contact", status: 503 },
        )
      },
    })

    const response = await app.inject({
      method: "POST",
      url: "/waitlist",
      payload: { email: "founder@example.com" },
    })

    expect(response.statusCode).toBe(502)
    expect(response.json()).toMatchObject({
      error: {
        code: "WAITLIST_CONTACT_SYNC_FAILED",
        details: { operation: "update_contact", status: 503 },
      },
    })
    expect(repository.entries.get("founder@example.com")).toEqual({
      email: "founder@example.com",
      blocker: undefined,
    })

    await app.close()
  })

  it("rate limits repeated requests from one address", async () => {
    const app = await createWaitlistTestApp()

    for (let index = 0; index < 5; index += 1) {
      const response = await app.inject({
        method: "POST",
        url: "/waitlist",
        payload: { email: `founder${index}@example.com` },
      })
      expect(response.statusCode).toBe(202)
    }

    const response = await app.inject({
      method: "POST",
      url: "/waitlist",
      payload: { email: "limited@example.com" },
    })

    expect(response.statusCode).toBe(429)
    expect(response.json()).toMatchObject({
      error: { code: "RATE_LIMIT_EXCEEDED" },
    })

    await app.close()
  })
})
