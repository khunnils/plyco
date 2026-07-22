import { Navigate } from "react-router-dom"

import { useAuthState } from "@/features/auth/hooks/use-auth"
import { useSelectedOrganization } from "@/features/organizations/hooks/use-selected-organization"
import { McpServerSettings } from "@/features/settings/components/mcp-server-settings"

export const McpServerSettingsRoutePage = () => {
  const { data: auth } = useAuthState()
  const { selectedOrganization } = useSelectedOrganization()
  const user = auth?.user ?? null

  if (!user || !selectedOrganization) {
    return <Navigate replace to="/" />
  }

  return <McpServerSettings organization={selectedOrganization} />
}
