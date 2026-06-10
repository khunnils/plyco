import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  type BusinessActivityInput,
  type SecurityProgramSnapshot,
} from "@plyco/shared"
import { toast } from "sonner"

import { useSelectedOrganization } from "@/features/organizations/hooks/use-selected-organization"
import {
  createBusinessActivity,
  deleteBusinessActivity,
  reorderBusinessActivities,
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

export const useReorderBusinessActivities = () => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()
  const organizationId = selectedOrganizationId ?? ""
  const queryKey = securityProfileQueryKey(organizationId)

  return useMutation({
    mutationFn: (ids: string[]) =>
      reorderBusinessActivities(organizationId, ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey })
      const previous =
        queryClient.getQueryData<SecurityProgramSnapshot>(queryKey)
      queryClient.setQueryData<SecurityProgramSnapshot>(queryKey, (current) => {
        if (!current) return current
        const order = new Map(ids.map((id, index) => [id, index]))
        return {
          ...current,
          businessActivities: [...current.businessActivities]
            .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
            .map((activity, sortOrder) => ({ ...activity, sortOrder })),
        }
      })
      return { previous }
    },
    onError: (error: Error, _ids, context) => {
      if (context?.previous)
        queryClient.setQueryData(queryKey, context.previous)
      toast.error(error.message ?? "Could not save activity order")
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
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
