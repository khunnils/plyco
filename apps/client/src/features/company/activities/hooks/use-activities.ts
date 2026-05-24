import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type BusinessActivityInput } from "@plyco/shared"
import { toast } from "sonner"

import { useSelectedOrganization } from "@/features/organizations/hooks/use-selected-organization"
import {
  createBusinessActivity,
  deleteBusinessActivity,
  updateBusinessActivity,
} from "@/lib/api"
import { securityProfileQueryKey } from "@/lib/query-keys"

export const useCreateBusinessActivity = () => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()

  return useMutation({
    mutationFn: (activity: BusinessActivityInput) =>
      createBusinessActivity(selectedOrganizationId ?? "", activity),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: securityProfileQueryKey(selectedOrganizationId ?? ""),
      })
      toast.success("Activity added")
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Could not add activity")
    },
  })
}

export const useUpdateBusinessActivity = () => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()
  const organizationId = selectedOrganizationId ?? ""

  return useMutation({
    mutationFn: (input: { id: string; activity: BusinessActivityInput }) =>
      updateBusinessActivity({ organizationId, ...input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: securityProfileQueryKey(organizationId),
      })
      toast.success("Activity updated")
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Could not update activity")
    },
  })
}

export const useDeleteBusinessActivity = () => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()
  const organizationId = selectedOrganizationId ?? ""

  return useMutation({
    mutationFn: (id: string) => deleteBusinessActivity(organizationId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: securityProfileQueryKey(organizationId),
      })
      toast.success("Activity removed")
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Could not remove activity")
    },
  })
}
