import { Navigate } from "react-router-dom"

import { useAuthState } from "@/features/auth/hooks/use-auth"
import { useSelectedOrganization } from "@/features/organizations/hooks/use-selected-organization"
import { ApiKeySettings } from "@/features/settings/components/api-key-settings"

export const ApiKeysSettingsRoutePage = () => {
  const { data: auth } = useAuthState()
  const { selectedOrganization } = useSelectedOrganization()
  const user = auth?.user ?? null

  if (!user || !selectedOrganization) {
    return <Navigate replace to="/" />
  }

  return <ApiKeySettings organization={selectedOrganization} />
}
