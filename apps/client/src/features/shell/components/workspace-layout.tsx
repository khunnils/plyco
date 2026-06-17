import { Outlet } from "react-router-dom"
import { LogOut } from "lucide-react"
import { type AuthUser } from "@plyco/shared"

import { Button } from "@/components/ui/button"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/features/shell/components/app-sidebar"
import { useLogout } from "@/features/auth/hooks/use-auth"

export const WorkspaceLayout = ({ user }: { user: AuthUser }) => {
  const logout = useLogout()

  return (
    <SidebarProvider>
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center border-b border-slate-200 bg-slate-50 px-4 text-primary">
        <div className="flex w-24 shrink-0 items-center md:w-64">
          <img
            alt="Plyco"
            className="size-8 shrink-0 rounded-md"
            src="/logo.png"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          {user.picture ? (
            <img
              alt=""
              className="size-9 shrink-0 rounded-full"
              src={user.picture}
              title={user.name}
            />
          ) : (
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white"
              title={user.name}
            >
              {user.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <Button
            aria-label="Logout"
            size="icon-sm"
            type="button"
            variant="ghost"
            onClick={() => logout.mutate()}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>
      <AppSidebar />
      <SidebarInset>
        <main className="grid gap-6 px-4 pt-24 pb-6 md:px-12">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
