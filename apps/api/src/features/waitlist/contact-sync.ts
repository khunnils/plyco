import { ApiError } from "../../infrastructure/errors.js"

export type WaitlistContactSyncInput = {
  email: string
  blocker?: string
}

export interface WaitlistContactSyncer {
  sync(input: WaitlistContactSyncInput): Promise<void>
  remove(email: string): Promise<void>
}

export class ResendWaitlistContactSyncer implements WaitlistContactSyncer {
  constructor(
    private readonly config: {
      apiKey?: string
      segmentId?: string
      fetch?: typeof fetch
    },
  ) {}

  async sync(input: WaitlistContactSyncInput): Promise<void> {
    this.requireConfig()

    const properties = {
      source: "waitlist",
      notes: input.blocker ?? "",
    }
    const segmentId = this.config.segmentId
    const contactPath = encodeURIComponent(input.email)
    const fetchFn = this.config.fetch ?? fetch

    const updateResponse = await this.fetchResponse(
      fetchFn,
      "update_contact",
      `https://api.resend.com/contacts/${contactPath}`,
      {
        method: "PATCH",
        headers: this.headers(),
        body: JSON.stringify({ properties }),
      },
    )

    if (updateResponse.status === 404) {
      await this.request(
        fetchFn,
        "create_contact",
        "https://api.resend.com/contacts",
        {
          method: "POST",
          headers: this.headers(),
          body: JSON.stringify({
            email: input.email,
            properties,
            segments: [{ id: segmentId }],
          }),
        },
      )
      return
    }

    if (!updateResponse.ok) {
      throw resendSyncError("update_contact", updateResponse.status)
    }

    await this.request(
      fetchFn,
      "add_contact_to_segment",
      `https://api.resend.com/contacts/${contactPath}/segments/${segmentId}`,
      {
        method: "POST",
        headers: this.headers(),
      },
    )
  }

  async remove(email: string): Promise<void> {
    this.requireConfig()

    const segmentId = this.config.segmentId
    const contactPath = encodeURIComponent(email)
    const fetchFn = this.config.fetch ?? fetch

    await this.request(
      fetchFn,
      "remove_contact_from_segment",
      `https://api.resend.com/contacts/${contactPath}/segments/${segmentId}`,
      {
        method: "DELETE",
        headers: this.headers(),
      },
    )
  }

  private requireConfig() {
    if (!this.config.apiKey || !this.config.segmentId) {
      throw new ApiError(
        "WAITLIST_CONTACT_SYNC_NOT_CONFIGURED",
        "Waitlist contact sync is not configured.",
        502,
        {
          missing: [
            this.config.apiKey ? null : "RESEND_API_KEY",
            this.config.segmentId ? null : "WAITLIST_RESEND_SEGMENT_ID",
          ].filter(Boolean),
        },
      )
    }
  }

  private headers() {
    return {
      Authorization: `Bearer ${this.config.apiKey}`,
      "Content-Type": "application/json",
    }
  }

  private async request(
    fetchFn: typeof fetch,
    operation: string,
    url: string,
    init: RequestInit,
  ) {
    const response = await this.fetchResponse(fetchFn, operation, url, init)

    if (!response.ok) {
      throw resendSyncError(operation, response.status)
    }
  }

  private async fetchResponse(
    fetchFn: typeof fetch,
    operation: string,
    url: string,
    init: RequestInit,
  ) {
    try {
      return await fetchFn(url, init)
    } catch {
      throw resendSyncError(operation, "network_error")
    }
  }
}

function resendSyncError(operation: string, status: number | "network_error") {
  return new ApiError(
    "WAITLIST_CONTACT_SYNC_FAILED",
    "Waitlist contact could not be synced.",
    502,
    { operation, status },
  )
}
