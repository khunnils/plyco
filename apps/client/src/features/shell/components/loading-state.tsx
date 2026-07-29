import { Loader } from "lucide-react"

export const LoadingState = () => (
  <main className="flex min-h-svh items-center justify-center bg-slate-50 text-slate-600">
    <Loader className="size-8 animate-spin motion-reduce:animate-none" />
  </main>
)
