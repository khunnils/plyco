import { ApiError } from "../../infrastructure/errors.js"

export type MagicLinkEmailInput = {
  email: string
  loginUrl: string
}

export interface MagicLinkEmailSender {
  sendMagicLink(input: MagicLinkEmailInput): Promise<void>
}

export class ResendMagicLinkEmailSender implements MagicLinkEmailSender {
  constructor(
    private readonly config: {
      apiKey?: string
      from?: string
    },
  ) {}

  async sendMagicLink(input: MagicLinkEmailInput): Promise<void> {
    if (!this.config.apiKey || !this.config.from) {
      throw new ApiError(
        "EMAIL_NOT_CONFIGURED",
        "Magic link email is not configured.",
        500,
        {
          missing: [
            this.config.apiKey ? null : "RESEND_API_KEY",
            this.config.from ? null : "INVITATION_EMAIL_FROM",
          ].filter(Boolean),
        },
      )
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.config.from,
        to: input.email,
        subject: "Sign in to Plyco",
        text: [
          "Use this link to sign in to Plyco:",
          "",
          input.loginUrl,
          "",
          "This link expires in 15 minutes and can only be used once.",
        ].join("\n"),
        html: [
          "<p>Use this link to sign in to Plyco:</p>",
          `<p><a href="${escapeHtml(input.loginUrl)}">Sign in to Plyco</a></p>`,
          "<p>This link expires in 15 minutes and can only be used once.</p>",
        ].join(""),
      }),
    })

    if (!response.ok) {
      throw new ApiError(
        "EMAIL_SEND_FAILED",
        "Magic link email could not be sent.",
        502,
        { status: response.status },
      )
    }
  }
}

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
