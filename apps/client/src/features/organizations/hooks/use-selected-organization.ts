import { useAuthState } from "@/features/auth/hooks/use-auth"
import { useCurrentOrganizationStore } from "@/features/organizations/stores/current-organization-store"

export const useSelectedOrganization = () => {
  const { data: auth } = useAuthState()
  const organizations = auth?.organizations ?? []
  const storedId = useCurrentOrganizationStore((s) => s.selectedOrganizationId)
  const effectiveId = storedId ?? organizations[0]?.id ?? null
  const selectedOrganization =
    organizations.find((o) => o.id === effectiveId) ?? organizations[0] ?? null

  return {
    organizations,
    selectedOrganization,
    selectedOrganizationId: selectedOrganization?.id ?? null,
  }
}
