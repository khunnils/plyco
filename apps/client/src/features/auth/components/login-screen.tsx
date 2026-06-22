import { ArrowRight } from "lucide-react"
import { useState, type FormEvent } from "react"
import { usePostHog } from "@posthog/react"

import { POSTHOG_EVENTS } from "@/lib/posthog-events"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSendMagicLink } from "@/features/auth/hooks/use-auth"

const GoogleLogo = () => (
  <svg aria-hidden="true" className="size-5" viewBox="0 0 18 18">
    <path
      fill="#4285F4"
      d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
    />
    <path
      fill="#34A853"
      d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.33-1.58-5.04-3.71H.94v2.33A9 9 0 0 0 9 18Z"
    />
    <path
      fill="#FBBC05"
      d="M3.96 10.71A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.96H.94A9 9 0 0 0 0 9c0 1.45.35 2.82.94 4.04l3.02-2.33Z"
    />
    <path
      fill="#EA4335"
      d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.59-2.59C13.46.9 11.43 0 9 0A9 9 0 0 0 .94 4.96l3.02 2.33C4.67 5.16 6.66 3.58 9 3.58Z"
    />
  </svg>
)

export const LoginScreen = ({
  error,
  onLogin,
}: {
  error: string | null
  onLogin: () => void
}) => {
  const [email, setEmail] = useState("")
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const sendMagicLinkMutation = useSendMagicLink()
  const posthog = usePostHog()

  const sendMagicLinkForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    sendMagicLinkMutation.mutate(
      { email },
      {
        onSuccess: () => {
          
          setMagicLinkSent(true)
          posthog.capture(POSTHOG_EVENTS.MAGIC_LINK_SENT, { email })
        },
      }
    )
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
      <section className="w-full max-w-md rounded-sm border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <div className="mb-8 text-center">
          <img
            alt="Plyco"
            className="mx-auto h-11 w-auto rounded-sm"
            src="/logo.png"
          />
          <h1 className="mt-8 text-2xl font-semibold text-slate-950">
            Sign in to Plyco
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Continue to your compliance readiness workspace.
          </p>
        </div>

        {error ? (
          <p className="mb-5 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <Button
          className="h-11 w-full gap-3 border-slate-300 bg-white text-sm font-medium text-slate-700 shadow-xs hover:border-slate-400 hover:bg-white hover:text-slate-900"
          type="button"
          variant="outline"
          onClick={onLogin}
        >
          <GoogleLogo />
          Continue with Google
        </Button>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-medium text-slate-400">or</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <form className="grid gap-3" onSubmit={sendMagicLinkForm}>
          <label className="grid gap-2 text-sm font-medium text-slate-800">
            Email
            <Input
              className="h-11 rounded-md border-slate-200 bg-white px-3 text-sm focus-visible:border-blue-600 focus-visible:ring-blue-100"
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
          <Button
            className="h-11 w-full"
            disabled={sendMagicLinkMutation.isPending}
            type="submit"
          >
            {sendMagicLinkMutation.isPending ? "Sending..." : "Send magic link"}
            <ArrowRight />
          </Button>
        </form>

        {magicLinkSent ? (
          <p className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
            Check your inbox for a sign-in link.
          </p>
        ) : null}
      </section>
    </main>
  )
}
