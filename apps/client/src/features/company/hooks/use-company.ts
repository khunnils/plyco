import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { useSelectedOrganization } from "@/features/organizations/hooks/use-selected-organization"
import {
  getOrganizationSecurityProfile,
  reorderDataTypes,
  reorderServices,
  saveSecurityProfile,
} from "@/lib/api"
import {
  authStateQueryKey,
  recommendationsQueryKey,
  securityProfileQueryKey,
} from "@/lib/query-keys"
import { type ProfileDraft } from "@/features/company/types/company"
import { type SecurityProgramSnapshot } from "@plyco/shared"

const useReorderProfileEntities = (entity: "dataTypes" | "services") => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()
  const organizationId = selectedOrganizationId ?? ""
  const queryKey = securityProfileQueryKey(organizationId)

  return useMutation({
    mutationFn: (ids: string[]) =>
      entity === "services"
        ? reorderServices(organizationId, ids)
        : reorderDataTypes(organizationId, ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey })
      const previous =
        queryClient.getQueryData<SecurityProgramSnapshot>(queryKey)
      queryClient.setQueryData<SecurityProgramSnapshot>(queryKey, (current) => {
        if (!current?.organization) return current
        const order = new Map(ids.map((id, index) => [id, index]))
        const organization = current.organization
        return {
          ...current,
          organization:
            entity === "services"
              ? {
                  ...organization,
                  services: [...organization.services]
                    .sort(
                      (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
                    )
                    .map((item, sortOrder) => ({ ...item, sortOrder })),
                }
              : {
                  ...organization,
                  dataHandling: {
                    ...organization.dataHandling,
                    dataTypesStored: [
                      ...organization.dataHandling.dataTypesStored,
                    ]
                      .sort(
                        (a, b) =>
                          (order.get(a.id ?? "") ?? 0) -
                          (order.get(b.id ?? "") ?? 0)
                      )
                      .map((item, sortOrder) => ({ ...item, sortOrder })),
                  },
                },
        }
      })
      return { previous }
    },
    onError: (error: Error, _ids, context) => {
      if (context?.previous)
        queryClient.setQueryData(queryKey, context.previous)
      toast.error(error.message ?? "Could not save order")
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })
}

export const useReorderServices = () => useReorderProfileEntities("services")
export const useReorderDataTypes = () => useReorderProfileEntities("dataTypes")

export const useSecurityProfile = (enabled = true) => {
  const { selectedOrganizationId } = useSelectedOrganization()

  return useQuery({
    enabled: enabled && Boolean(selectedOrganizationId),
    queryKey: securityProfileQueryKey(selectedOrganizationId ?? ""),
    queryFn: () => getOrganizationSecurityProfile(selectedOrganizationId ?? ""),
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
