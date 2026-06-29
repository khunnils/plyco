import { Loader2 } from "lucide-react"

export const LoadingState = () => (
  <main className="flex min-h-svh items-center justify-center bg-slate-50 text-slate-600">
    <div className="flex items-center gap-2 text-sm">
      <Loader2 className="size-4 animate-spin" />
    </div>
  </main>
)
