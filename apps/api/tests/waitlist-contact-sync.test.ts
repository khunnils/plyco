import { describe, expect, it, vi } from "vitest"

import { ResendWaitlistContactSyncer } from "../src/features/waitlist/contact-sync.js"

const waitlistSegmentId = "f60805b5-c9e7-43a9-b207-5105d522b026"

describe("ResendWaitlistContactSyncer", () => {
  it("creates missing contacts with waitlist properties and segment", async () => {
    const fetchMock = vi
      .fn(async () => new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "contact-id" })))
    const syncer = new ResendWaitlistContactSyncer({
      apiKey: "re_test",
      segmentId: waitlistSegmentId,
      fetch: fetchMock,
    })

    await syncer.sync({
      email: "founder@example.com",
      blocker: "Security questionnaire",
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.resend.com/contacts/founder%40example.com",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          properties: {
            source: "waitlist",
            notes: "Security questionnaire",
          },
        }),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.resend.com/contacts",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "founder@example.com",
          properties: {
            source: "waitlist",
            notes: "Security questionnaire",
          },
          segments: [{ id: waitlistSegmentId }],
        }),
      }),
    )
  })

  it("updates existing contacts and adds them to the waitlist segment", async () => {
    const fetchMock = vi
      .fn(async () => new Response(JSON.stringify({ id: "ok" })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "contact-id" })))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: waitlistSegmentId })),
      )
    const syncer = new ResendWaitlistContactSyncer({
      apiKey: "re_test",
      segmentId: waitlistSegmentId,
      fetch: fetchMock,
    })

    await syncer.sync({ email: "founder+tag@example.com" })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.resend.com/contacts/founder%2Btag%40example.com",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          properties: {
            source: "waitlist",
            notes: "",
          },
        }),
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `https://api.resend.com/contacts/founder%2Btag%40example.com/segments/${waitlistSegmentId}`,
      expect.objectContaining({
        method: "POST",
      }),
    )
  })

  it("fails when RESEND_API_KEY is missing", async () => {
    const syncer = new ResendWaitlistContactSyncer({
      segmentId: waitlistSegmentId,
    })

    await expect(
      syncer.sync({ email: "founder@example.com" }),
    ).rejects.toMatchObject({
      code: "WAITLIST_CONTACT_SYNC_NOT_CONFIGURED",
      statusCode: 502,
      details: { missing: ["RESEND_API_KEY"] },
    })
  })

  it("fails when WAITLIST_RESEND_SEGMENT_ID is missing", async () => {
    const syncer = new ResendWaitlistContactSyncer({ apiKey: "re_test" })

    await expect(
      syncer.sync({ email: "founder@example.com" }),
    ).rejects.toMatchObject({
      code: "WAITLIST_CONTACT_SYNC_NOT_CONFIGURED",
      statusCode: 502,
      details: { missing: ["WAITLIST_RESEND_SEGMENT_ID"] },
    })
  })

  it("converts Resend failures to sanitized ApiError details", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ message: "secret" }), { status: 503 }),
    )
    const syncer = new ResendWaitlistContactSyncer({
      apiKey: "re_test",
      segmentId: waitlistSegmentId,
      fetch: fetchMock,
    })

    await expect(
      syncer.sync({ email: "founder@example.com" }),
    ).rejects.toMatchObject({
      code: "WAITLIST_CONTACT_SYNC_FAILED",
      statusCode: 502,
      details: { operation: "update_contact", status: 503 },
    })
  })

  it("converts create failures to sanitized ApiError details", async () => {
    const fetchMock = vi
      .fn(async () => new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "secret" }), { status: 400 }),
      )
    const syncer = new ResendWaitlistContactSyncer({
      apiKey: "re_test",
      segmentId: waitlistSegmentId,
      fetch: fetchMock,
    })

    await expect(
      syncer.sync({ email: "founder@example.com" }),
    ).rejects.toMatchObject({
      code: "WAITLIST_CONTACT_SYNC_FAILED",
      details: { operation: "create_contact", status: 400 },
    })
  })
})
