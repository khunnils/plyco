import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type Vendor, type VendorInput } from "@complyflow/shared"

import {
  createVendor,
  deleteVendor,
  getSecurityProfile,
  saveSecurityProfile,
  updateVendor,
} from "@/lib/api"
import { type ProfileDraft } from "@/types/security-profile"

const securityProfileQueryKey = ["security-profile"] as const

export const useSecurityProfile = () =>
  useQuery({
    queryKey: securityProfileQueryKey,
    queryFn: getSecurityProfile,
  })

export const useSaveSecurityProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: saveSecurityProfile,
    onSuccess: (snapshot) => {
      queryClient.setQueryData(securityProfileQueryKey, snapshot)
    },
  })
}

export const useCreateVendor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createVendor,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: securityProfileQueryKey })
    },
  })
}

export const useCreateVendors = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vendors: VendorInput[]) =>
      Promise.all(vendors.map(createVendor)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: securityProfileQueryKey })
    },
  })
}

export const useUpdateVendor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateVendor,
    onMutate: async ({ id, vendor }) => {
      await queryClient.cancelQueries({ queryKey: securityProfileQueryKey })
      const previousSnapshot = queryClient.getQueryData<{
        organization: unknown
        vendors: Vendor[]
      }>(securityProfileQueryKey)

      queryClient.setQueryData(securityProfileQueryKey, (current: unknown) => {
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
    onError: (_error, _variables, context) => {
      if (context?.previousSnapshot) {
        queryClient.setQueryData(
          securityProfileQueryKey,
          context.previousSnapshot
        )
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: securityProfileQueryKey })
    },
  })
}

export const useDeleteVendor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteVendor,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: securityProfileQueryKey })
      const previousSnapshot = queryClient.getQueryData<{
        organization: unknown
        vendors: Vendor[]
      }>(securityProfileQueryKey)

      queryClient.setQueryData(securityProfileQueryKey, (current: unknown) => {
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
    onError: (_error, _id, context) => {
      if (context?.previousSnapshot) {
        queryClient.setQueryData(
          securityProfileQueryKey,
          context.previousSnapshot
        )
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: securityProfileQueryKey })
    },
  })
}

export type SaveProfilePayload = ProfileDraft
