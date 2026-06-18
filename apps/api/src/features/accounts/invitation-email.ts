import { ApiError } from "../../infrastructure/errors.js"

export type InvitationEmailInput = {
  organizationName: string
  invitedByName: string
  email: string
  role: string
  joinUrl: string
}

export interface InvitationEmailSender {
  sendInvitation(input: InvitationEmailInput): Promise<void>
}

export class ResendInvitationEmailSender implements InvitationEmailSender {
  constructor(
    private readonly config: {
      apiKey?: string
      from?: string
    },
  ) {}

  async sendInvitation(input: InvitationEmailInput): Promise<void> {
    if (!this.config.apiKey || !this.config.from) {
      throw new ApiError(
        "EMAIL_NOT_CONFIGURED",
        "Invitation email is not configured.",
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
        subject: `${input.invitedByName} invited you to ${input.organizationName} on Plyco`,
        text: [
          `${input.invitedByName} invited you to join ${input.organizationName} as ${roleLabel(input.role)}.`,
          "",
          `Join the workspace: ${input.joinUrl}`,
          "",
          "This invitation expires in 30 days.",
        ].join("\n"),
        html: [
          `<p>${escapeHtml(input.invitedByName)} invited you to join <strong>${escapeHtml(input.organizationName)}</strong> as ${escapeHtml(roleLabel(input.role))}.</p>`,
          `<p><a href="${escapeHtml(input.joinUrl)}">Join the workspace</a></p>`,
          "<p>This invitation expires in 30 days.</p>",
        ].join(""),
      }),
    })

    if (!response.ok) {
      throw new ApiError(
        "EMAIL_SEND_FAILED",
        "Invitation email could not be sent.",
        502,
        { status: response.status },
      )
    }
  }
}

const roleLabel = (role: string) => (role === "owner" ? "an owner" : "a member")

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
