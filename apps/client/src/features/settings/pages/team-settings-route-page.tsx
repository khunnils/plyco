import { Navigate } from "react-router-dom"

import { useAuthState } from "@/features/auth/hooks/use-auth"
import { useSelectedOrganization } from "@/features/organizations/hooks/use-selected-organization"
import { TeamSettings } from "@/features/settings/components/team-settings"

export const TeamSettingsRoutePage = () => {
  const { data: auth } = useAuthState()
  const { selectedOrganization } = useSelectedOrganization()
  const user = auth?.user ?? null

  if (!user || !selectedOrganization) {
    return <Navigate replace to="/" />
  }

  return <TeamSettings organization={selectedOrganization} user={user} />
}
