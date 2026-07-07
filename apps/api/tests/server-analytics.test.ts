import { describe, expect, it, vi } from "vitest"

import {
  createServerAnalytics,
  NoopServerAnalytics,
  PostHogServerAnalytics,
} from "../src/infrastructure/server-analytics.js"

describe("server analytics", () => {
  it("captures PostHog events through the capture API", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ success: true })))
    const analytics = new PostHogServerAnalytics({
      projectToken: "ph_project_token",
      host: "https://us.i.posthog.com/",
      fetch: fetchMock,
    })

    await analytics.capture({
      event: "waitlist_signup_completed",
      distinctId: "founder@example.com",
      properties: {
        source: "marketing_waitlist_form",
        has_blocker: true,
      },
    })

    expect(fetchMock).toHaveBeenCalledWith(
      "https://us.i.posthog.com/i/v0/e/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: "ph_project_token",
          event: "waitlist_signup_completed",
          distinct_id: "founder@example.com",
          properties: {
            source: "marketing_waitlist_form",
            has_blocker: true,
          },
        }),
      },
    )
  })

  it("reports sanitized failures for non-OK PostHog responses", async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ detail: "secret" }), { status: 503 }),
    )
    const analytics = new PostHogServerAnalytics({
      projectToken: "ph_project_token",
      host: "https://us.i.posthog.com",
      fetch: fetchMock,
    })

    await expect(
      analytics.capture({
        event: "waitlist_signup_completed",
        distinctId: "founder@example.com",
      }),
    ).rejects.toMatchObject({
      code: "SERVER_ANALYTICS_CAPTURE_FAILED",
      statusCode: 502,
      details: { status: 503 },
    })
  })

  it("uses a no-op analytics client when PostHog is not configured", async () => {
    const analytics = createServerAnalytics({
      posthogProjectToken: undefined,
      posthogHost: "https://us.i.posthog.com",
    })

    expect(analytics).toBeInstanceOf(NoopServerAnalytics)
    await expect(
      analytics.capture({
        event: "waitlist_signup_completed",
        distinctId: "founder@example.com",
      }),
    ).resolves.toBeUndefined()
  })
})
