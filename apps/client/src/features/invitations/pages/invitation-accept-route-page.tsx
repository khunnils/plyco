import { useEffect, useRef } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { type AuthUser } from "@plyco/shared"

import { Button } from "@/components/ui/button"
import { startGoogleLogin } from "@/lib/api"
import { useAcceptOrganizationInvitation } from "@/features/settings/hooks/use-team"

export const pendingInvitationStorageKey = "plyco.pendingInvitationToken"

export const InvitationAcceptRoutePage = ({
  user,
}: {
  user: AuthUser | null
}) => {
  const { token } = useParams()
  const navigate = useNavigate()
  const acceptInvitation = useAcceptOrganizationInvitation()
  const attemptedToken = useRef<string | null>(null)

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
      onSuccess: () => {
        window.localStorage.removeItem(pendingInvitationStorageKey)
      },
    })
  }, [acceptInvitation, navigate, token, user])

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
    return (
      <main className="grid min-h-svh place-items-center bg-slate-50 px-4">
        <section className="grid max-w-md gap-4 border border-slate-200 bg-white p-6 text-center">
          <div>
            <h1 className="text-xl font-semibold text-slate-950">
              Join workspace
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Sign in with the Google account this invitation was sent to.
            </p>
          </div>
          <Button type="button" onClick={startGoogleLogin}>
            Continue with Google
          </Button>
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
