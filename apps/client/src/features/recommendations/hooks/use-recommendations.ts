import { useQuery } from "@tanstack/react-query"

import { useSelectedOrganization } from "@/features/organizations/hooks/use-selected-organization"
import { getRecommendations } from "@/lib/api"
import { recommendationsQueryKey } from "@/lib/query-keys"

export const useRecommendations = (enabled = true) => {
  const { selectedOrganizationId } = useSelectedOrganization()
  const organizationId = selectedOrganizationId ?? ""

  return useQuery({
    enabled: enabled && Boolean(selectedOrganizationId),
    queryKey: recommendationsQueryKey(organizationId),
    queryFn: () => getRecommendations(organizationId),
  })
}
