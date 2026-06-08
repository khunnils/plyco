import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { useSelectedOrganization } from "@/features/organizations/hooks/use-selected-organization"
import {
  getOrganizationSecurityProfile,
  saveSecurityProfile,
} from "@/lib/api"
import {
  authStateQueryKey,
  recommendationsQueryKey,
  securityProfileQueryKey,
} from "@/lib/query-keys"
import { type ProfileDraft } from "@/features/company/types/company"

export const useSecurityProfile = (enabled = true) => {
  const { selectedOrganizationId } = useSelectedOrganization()

  return useQuery({
    enabled: enabled && Boolean(selectedOrganizationId),
    queryKey: securityProfileQueryKey(selectedOrganizationId ?? ""),
    queryFn: () =>
      getOrganizationSecurityProfile(selectedOrganizationId ?? ""),
  })
}

export const useSaveSecurityProfile = () => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()

  return useMutation({
    mutationFn: (profile: ProfileDraft) =>
      saveSecurityProfile(selectedOrganizationId ?? "", profile),
    onSuccess: (snapshot) => {
      queryClient.setQueryData(
        securityProfileQueryKey(selectedOrganizationId ?? ""),
        snapshot
      )
      void queryClient.invalidateQueries({
        queryKey: authStateQueryKey,
      })
      void queryClient.invalidateQueries({
        queryKey: recommendationsQueryKey(selectedOrganizationId ?? ""),
      })
      toast.success("Profile saved")
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Could not save profile")
    },
  })
}
