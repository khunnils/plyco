import { Outlet } from "react-router-dom"
import { type AuthUser } from "@plyco/shared"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/features/shell/components/app-sidebar"
import { useLogout } from "@/features/auth/hooks/use-auth"

export const WorkspaceLayout = ({ user }: { user: AuthUser }) => {
  const logout = useLogout()

  return (
    <SidebarProvider>
      <AppSidebar user={user} onLogout={() => logout.mutate()} />
      <SidebarInset>
        <main className="grid gap-6 px-4 pt-24 pb-6 md:px-12">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
