import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { useSelectedOrganization } from "@/features/organizations/hooks/use-selected-organization"
import { getRecommendations, restoreRule, suppressRule } from "@/lib/api"
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

export const useRuleSuppression = () => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()
  const organizationId = selectedOrganizationId ?? ""

  return useMutation({
    mutationFn: ({
      ruleId,
      suppress,
    }: {
      ruleId: string
      suppress: boolean
    }) =>
      suppress
        ? suppressRule(organizationId, ruleId)
        : restoreRule(organizationId, ruleId),
    onSuccess: (_, { suppress }) => {
      void queryClient.invalidateQueries({
        queryKey: recommendationsQueryKey(organizationId),
      })
      toast.success(suppress ? "Rule suppressed" : "Rule restored")
    },
    onError: (error: Error, { suppress }) => {
      toast.error(
        error.message ||
          (suppress ? "Could not suppress rule" : "Could not restore rule")
      )
    },
  })
}
