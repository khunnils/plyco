import { useEffect, useRef, useState, type FormEvent } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { type AuthUser } from "@plyco/shared"
import { usePostHog } from "@posthog/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { POSTHOG_EVENTS } from "@/lib/posthog-events"
import { startGoogleLogin } from "@/lib/api"
import { useSendMagicLink } from "@/features/auth/hooks/use-auth"
import { useAcceptOrganizationInvitation } from "@/features/settings/hooks/use-team"

export const pendingInvitationStorageKey = "plyco.pendingInvitationToken"

export const InvitationAcceptRoutePage = ({
  user,
}: {
  user: AuthUser | null
}) => {
  const posthog = usePostHog()
  const { token } = useParams()
  const navigate = useNavigate()
  const acceptInvitation = useAcceptOrganizationInvitation()
  const attemptedToken = useRef<string | null>(null)
  const [email, setEmail] = useState("")
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const sendMagicLink = useSendMagicLink()

  useEffect(() => {
    if (!token) {
      return
    }

    window.localStorage.setItem(pendingInvitationStorageKey, token)
  }, [token])

  useEffect(() => {
    if (!user || !token || attemptedToken.current === token) {
      return
    }

    attemptedToken.current = token
    acceptInvitation.mutate(token, {
      onSuccess: (result) => {
        posthog.capture(POSTHOG_EVENTS.INVITATION_ACCEPTED, {
          organization_id: result.organization.id,
          role: result.organization.role,
        })
        window.localStorage.removeItem(pendingInvitationStorageKey)
      },
    })
  }, [acceptInvitation, navigate, posthog, token, user])

  useEffect(() => {
    if (!acceptInvitation.data) {
      return
    }

    window.localStorage.removeItem(pendingInvitationStorageKey)
    navigate("/settings/team", { replace: true })
  }, [acceptInvitation.data, navigate])

  if (!token) {
    return <Navigate replace to="/" />
  }

  if (!user) {
    const sendInviteMagicLink = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      sendMagicLink.mutate(
        { email, returnTo: `/invites/${token}` },
        {
          onSuccess: () => {
            setMagicLinkSent(true)
          },
        }
      )
    }

    return (
      <main className="grid min-h-svh place-items-center bg-slate-50 px-4">
        <section className="grid w-full max-w-md gap-4 border border-slate-200 bg-white p-6 text-center">
          <div>
            <h1 className="text-xl font-semibold text-slate-950">
              Join workspace
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Sign in with the email address this invitation was sent to.
            </p>
          </div>
          <Button type="button" onClick={startGoogleLogin}>
            Continue with Google
          </Button>
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <form className="grid gap-3 text-left" onSubmit={sendInviteMagicLink}>
            <label className="grid gap-2 text-sm font-medium text-slate-800">
              Email
              <Input
                autoComplete="email"
                className="field-focus-visible h-11 rounded-sm border-slate-300 bg-white px-4 text-sm"
                placeholder="you@company.com"
                required
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setMagicLinkSent(false)
                }}
              />
            </label>
            <Button disabled={sendMagicLink.isPending} type="submit">
              {sendMagicLink.isPending ? "Sending..." : "Send magic link"}
            </Button>
          </form>
          {magicLinkSent ? (
            <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
              Check your inbox for a sign-in link.
            </p>
          ) : null}
        </section>
      </main>
    )
  }

  if (acceptInvitation.isError) {
    return (
      <main className="grid min-h-svh place-items-center bg-slate-50 px-4">
        <section className="grid max-w-md gap-4 border border-slate-200 bg-white p-6 text-center">
          <div>
            <h1 className="text-xl font-semibold text-slate-950">
              Invitation could not be accepted
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {acceptInvitation.error?.message ??
                "The invitation could not be accepted."}
            </p>
          </div>
          <Button
            type="button"
            onClick={() => {
              attemptedToken.current = null
              acceptInvitation.reset()
            }}
          >
            Try again
          </Button>
        </section>
      </main>
    )
  }

  return (
    <main className="grid min-h-svh place-items-center bg-slate-50 px-4">
      <section className="grid max-w-md gap-3 border border-slate-200 bg-white p-6 text-center">
        <h1 className="text-xl font-semibold text-slate-950">
          Accepting invitation
        </h1>
        <p className="text-sm text-slate-500">
          We are adding you to the workspace.
        </p>
      </section>
    </main>
  )
}
