import { Building2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export const NoOrganizationPage = ({
  isLoggingOut = false,
  onCreate,
  onLogout,
}: {
  isLoggingOut?: boolean
  onCreate: () => void
  onLogout: () => void
}) => (
  <main className="relative min-h-svh overflow-hidden bg-[#f7f8fa] text-slate-900">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_-10%,rgba(59,130,246,0.08),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,#334155_1px,transparent_1px)] bg-size-[26px_26px] opacity-[0.05] mask-[radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />
    </div>
    <section className="relative flex min-h-svh flex-col">
      <header className="flex items-center gap-4 border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur sm:px-8">
        <img
          src="/logo.png"
          alt="Plyco"
          className="h-8 w-auto rounded-md object-contain"
        />
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <Empty className="w-full max-w-md border-slate-200 bg-white">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2 />
            </EmptyMedia>
            <EmptyTitle>Activate organizations</EmptyTitle>
            <EmptyDescription>
              You need an active organization to use the workspace. Create one
              to continue, or log out.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button type="button" onClick={onCreate}>
              Create organization
            </Button>
            <Button
              disabled={isLoggingOut}
              type="button"
              variant="outline"
              onClick={onLogout}
            >
              Logout
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    </section>
  </main>
)
