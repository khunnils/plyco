import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { useCurrentOrganizationStore } from "@/features/organizations/stores/current-organization-store"
import { getAuthState, logout } from "@/lib/api"
import {
  authStateQueryKey,
  providersQueryKey,
} from "@/lib/query-keys"

export const useAuthState = () =>
  useQuery({
    queryKey: authStateQueryKey,
    queryFn: getAuthState,
  })

export const useLogout = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      useCurrentOrganizationStore.getState().reset()
      queryClient.setQueryData(authStateQueryKey, {
        user: null,
        organizations: [],
      })
      queryClient.removeQueries({ queryKey: ["security-profile"] })
      queryClient.removeQueries({ queryKey: providersQueryKey })
      queryClient.removeQueries({ queryKey: ["templates"] })
      queryClient.removeQueries({ queryKey: ["documents"] })
      queryClient.removeQueries({ queryKey: ["document"] })
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Logout failed")
    },
  })
}
