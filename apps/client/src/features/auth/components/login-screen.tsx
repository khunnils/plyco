import { LogIn, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"

export const LoginScreen = ({
  error,
  onLogin,
}: {
  error: string | null
  onLogin: () => void
}) => (
  <main className="flex min-h-svh items-center justify-center bg-slate-50 px-4 py-8 text-slate-900">
    <section className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-md bg-slate-950 text-white">
          <ShieldCheck className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-700">ComplyFlow</p>
          <h1 className="text-xl font-semibold text-slate-950">Sign in</h1>
        </div>
      </div>

      {error ? (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <Button className="w-full" type="button" onClick={onLogin}>
        <LogIn />
        Continue with Google
      </Button>
    </section>
  </main>
)
