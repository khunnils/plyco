import { ApiError } from "./errors.js"

export type ServerAnalyticsCaptureInput = {
  event: string
  distinctId: string
  properties?: Record<string, unknown>
}

export interface ServerAnalytics {
  capture(input: ServerAnalyticsCaptureInput): Promise<void>
}

export class NoopServerAnalytics implements ServerAnalytics {
  async capture(): Promise<void> {}
}

export class PostHogServerAnalytics implements ServerAnalytics {
  constructor(
    private readonly config: {
      projectToken: string
      host: string
      fetch?: typeof fetch
    },
  ) {}

  async capture(input: ServerAnalyticsCaptureInput): Promise<void> {
    const fetchFn = this.config.fetch ?? fetch
    const response = await fetchFn(`${postHogHost(this.config.host)}/i/v0/e/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: this.config.projectToken,
        event: input.event,
        distinct_id: input.distinctId,
        properties: input.properties ?? {},
      }),
    })

    if (!response.ok) {
      throw new ApiError(
        "SERVER_ANALYTICS_CAPTURE_FAILED",
        "Server analytics event could not be captured.",
        502,
        { status: response.status },
      )
    }
  }
}

export function createServerAnalytics(config: {
  posthogProjectToken?: string
  posthogHost: string
}) {
  if (!config.posthogProjectToken) {
    return new NoopServerAnalytics()
  }

  return new PostHogServerAnalytics({
    projectToken: config.posthogProjectToken,
    host: config.posthogHost,
  })
}

function postHogHost(host: string) {
  return host.replace(/\/+$/, "")
}
