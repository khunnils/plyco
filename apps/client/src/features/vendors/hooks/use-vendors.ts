import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  type BusinessActivityInput,
  type ServiceVendorUse,
  type ServiceVendorUseInput,
  type Vendor,
  type VendorInput,
} from "@plyco/shared"
import { toast } from "sonner"

import { useSelectedOrganization } from "@/features/organizations/hooks/use-selected-organization"
import { useAuthState } from "@/features/auth/hooks/use-auth"
import {
  createVendor,
  createBusinessActivity,
  createServiceVendorUse,
  deleteBusinessActivity,
  deleteServiceVendorUse,
  deleteVendor,
  getProviders,
  updateBusinessActivity,
  updateServiceVendorUse,
  updateVendor,
} from "@/lib/api"
import { providersQueryKey, securityProfileQueryKey } from "@/lib/query-keys"

export const useProviders = (enabled = true) => {
  const { data: auth } = useAuthState()
  const user = auth?.user ?? null

  return useQuery({
    enabled: enabled && Boolean(user),
    queryKey: providersQueryKey,
    queryFn: getProviders,
  })
}

export const useCreateVendor = () => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()

  return useMutation({
    mutationFn: (vendor: VendorInput) =>
      createVendor(selectedOrganizationId ?? "", vendor),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: securityProfileQueryKey(selectedOrganizationId ?? ""),
      })
      toast.success("Vendor added")
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Could not add vendor")
    },
  })
}

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

export const useCreateVendors = () => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()

  return useMutation({
    mutationFn: (vendors: VendorInput[]) =>
      Promise.all(
        vendors.map((vendor) =>
          createVendor(selectedOrganizationId ?? "", vendor)
        )
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: securityProfileQueryKey(selectedOrganizationId ?? ""),
      })
      toast.success("Vendors added")
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Could not add vendors")
    },
  })
}

export const useUpdateVendor = () => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()
  const organizationId = selectedOrganizationId ?? ""

  return useMutation({
    mutationFn: (input: { id: string; vendor: VendorInput }) =>
      updateVendor({ organizationId, ...input }),
    onMutate: async ({ id, vendor }) => {
      const key = securityProfileQueryKey(organizationId)
      await queryClient.cancelQueries({ queryKey: key })
      const previousSnapshot = queryClient.getQueryData<{
        organization: unknown
        vendors: Vendor[]
      }>(key)

      queryClient.setQueryData(key, (current: unknown) => {
        if (!current || typeof current !== "object") {
          return current
        }

        const snapshot = current as { vendors: Vendor[] }
        return {
          ...snapshot,
          vendors: snapshot.vendors.map((currentVendor) =>
            currentVendor.id === id
              ? { ...currentVendor, ...vendor }
              : currentVendor
          ),
        }
      })

      return { previousSnapshot }
    },
    onError: (err: Error, _variables, context) => {
      if (context?.previousSnapshot) {
        queryClient.setQueryData(
          securityProfileQueryKey(organizationId),
          context.previousSnapshot
        )
      }
      toast.error(err.message ?? "Could not update vendor")
    },
    onSuccess: () => {
      toast.success("Vendor updated")
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: securityProfileQueryKey(organizationId),
      })
    },
  })
}

export const useDeleteVendor = () => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()
  const organizationId = selectedOrganizationId ?? ""

  return useMutation({
    mutationFn: (id: string) => deleteVendor(organizationId, id),
    onMutate: async (id) => {
      const key = securityProfileQueryKey(organizationId)
      await queryClient.cancelQueries({ queryKey: key })
      const previousSnapshot = queryClient.getQueryData<{
        organization: unknown
        vendors: Vendor[]
      }>(key)

      queryClient.setQueryData(key, (current: unknown) => {
        if (!current || typeof current !== "object") {
          return current
        }

        const snapshot = current as { vendors: Vendor[] }
        return {
          ...snapshot,
          vendors: snapshot.vendors.filter((vendor) => vendor.id !== id),
        }
      })

      return { previousSnapshot }
    },
    onError: (err: Error, _id, context) => {
      if (context?.previousSnapshot) {
        queryClient.setQueryData(
          securityProfileQueryKey(organizationId),
          context.previousSnapshot
        )
      }
      toast.error(err.message ?? "Could not delete vendor")
    },
    onSuccess: () => {
      toast.success("Vendor removed")
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: securityProfileQueryKey(organizationId),
      })
    },
  })
}

export const useCreateServiceVendorUse = () => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()

  return useMutation({
    mutationFn: (vendorUse: ServiceVendorUseInput) =>
      createServiceVendorUse(selectedOrganizationId ?? "", vendorUse),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: securityProfileQueryKey(selectedOrganizationId ?? ""),
      })
      toast.success("Vendor use added")
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Could not add vendor use")
    },
  })
}

export const useUpdateServiceVendorUse = () => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()
  const organizationId = selectedOrganizationId ?? ""

  return useMutation({
    mutationFn: (input: { id: string; vendorUse: ServiceVendorUseInput }) =>
      updateServiceVendorUse({ organizationId, ...input }),
    onMutate: async ({ id, vendorUse }) => {
      const key = securityProfileQueryKey(organizationId)
      await queryClient.cancelQueries({ queryKey: key })
      const previousSnapshot = queryClient.getQueryData<{
        organization: unknown
        serviceVendorUses: ServiceVendorUse[]
      }>(key)

      queryClient.setQueryData(key, (current: unknown) => {
        if (!current || typeof current !== "object") {
          return current
        }

        const snapshot = current as { serviceVendorUses: ServiceVendorUse[] }
        return {
          ...snapshot,
          serviceVendorUses: snapshot.serviceVendorUses.map((currentUse) =>
            currentUse.id === id ? { ...currentUse, ...vendorUse } : currentUse
          ),
        }
      })

      return { previousSnapshot }
    },
    onError: (err: Error, _variables, context) => {
      if (context?.previousSnapshot) {
        queryClient.setQueryData(
          securityProfileQueryKey(organizationId),
          context.previousSnapshot
        )
      }
      toast.error(err.message ?? "Could not update vendor use")
    },
    onSuccess: () => {
      toast.success("Vendor use updated")
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: securityProfileQueryKey(organizationId),
      })
    },
  })
}

export const useDeleteServiceVendorUse = () => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()
  const organizationId = selectedOrganizationId ?? ""

  return useMutation({
    mutationFn: (id: string) => deleteServiceVendorUse(organizationId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: securityProfileQueryKey(organizationId),
      })
      toast.success("Vendor use removed")
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Could not remove vendor use")
    },
  })
}
