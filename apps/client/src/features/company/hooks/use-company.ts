import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { useSelectedOrganization } from "@/features/organizations/hooks/use-selected-organization"
import {
  getOrganizationSnapshot,
  reorderDataTypes,
  reorderServices,
  saveAccessProfile,
  saveCompanyProfile,
  saveDataProfile,
  saveInfrastructureProfile,
  savePrivacyProfile,
  saveSecurityProfileSection,
  saveServicesProfile,
} from "@/lib/api"
import {
  authStateQueryKey,
  organizationSnapshotQueryKey,
  recommendationsQueryKey,
} from "@/lib/query-keys"
import { type ProfileDraft } from "@/features/company/types/company"
import { type SecurityProgramSnapshot } from "@plyco/shared"

const useReorderProfileEntities = (entity: "dataTypes" | "services") => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()
  const organizationId = selectedOrganizationId ?? ""
  const queryKey = organizationSnapshotQueryKey(organizationId)

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

export const useOrganizationSnapshot = (enabled = true) => {
  const { selectedOrganizationId } = useSelectedOrganization()

  return useQuery({
    enabled: enabled && Boolean(selectedOrganizationId),
    queryKey: organizationSnapshotQueryKey(selectedOrganizationId ?? ""),
    queryFn: () => getOrganizationSnapshot(selectedOrganizationId ?? ""),
  })
}

const useSaveOrganizationProfileSection = (
  save: (
    organizationId: string,
    profile: ProfileDraft,
  ) => Promise<SecurityProgramSnapshot>,
) => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()

  return useMutation({
    mutationFn: (profile: ProfileDraft) =>
      save(selectedOrganizationId ?? "", profile),
    onSuccess: (snapshot) => {
      queryClient.setQueryData(
        organizationSnapshotQueryKey(selectedOrganizationId ?? ""),
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

export const useSaveCompanyProfile = () =>
  useSaveOrganizationProfileSection((organizationId, profile) =>
    saveCompanyProfile(organizationId, profile.company)
  )

export const useSaveServicesProfile = () =>
  useSaveOrganizationProfileSection((organizationId, profile) =>
    saveServicesProfile(organizationId, profile.services)
  )

export const useSaveDataProfile = () =>
  useSaveOrganizationProfileSection((organizationId, profile) =>
    saveDataProfile(organizationId, profile.dataHandling)
  )

export const useSavePrivacyProfile = () =>
  useSaveOrganizationProfileSection((organizationId, profile) =>
    savePrivacyProfile(organizationId, profile.privacy)
  )

export const useSaveInfrastructureProfile = () =>
  useSaveOrganizationProfileSection((organizationId, profile) =>
    saveInfrastructureProfile(organizationId, profile.infrastructure)
  )

export const useSaveSecurityProfileSection = () =>
  useSaveOrganizationProfileSection((organizationId, profile) =>
    saveSecurityProfileSection(organizationId, profile.security)
  )

export const useSaveAccessProfile = () =>
  useSaveOrganizationProfileSection((organizationId, profile) =>
    saveAccessProfile(organizationId, profile.access)
  )
