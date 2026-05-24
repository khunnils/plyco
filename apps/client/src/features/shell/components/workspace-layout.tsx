import { Outlet } from "react-router-dom"
import { type AuthUser } from "@plyco/shared"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/features/shell/components/app-sidebar"
import { useLogout } from "@/features/auth/hooks/use-auth"
import { useSecurityProfile } from "@/features/company/hooks/use-company"
import { profileFromOrganization } from "@/features/company/lib/profile"

export const WorkspaceLayout = ({ user }: { user: AuthUser }) => {
  const logout = useLogout()
  const securityProfile = useSecurityProfile()

  const snapshot = securityProfile.data
  const defaultValues = profileFromOrganization(snapshot?.organization ?? null)

  return (
    <SidebarProvider>
      <AppSidebar
        services={defaultValues.services}
        user={user}
        onLogout={() => logout.mutate()}
      />
      <SidebarInset>
        <main className="grid gap-6 px-4 py-6 md:px-12">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
