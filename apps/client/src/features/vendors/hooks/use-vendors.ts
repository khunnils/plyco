import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  type ServiceProviderUsage,
  type ServiceProviderUsageInput,
  type OrganizationProvider,
  type OrganizationProviderInput,
} from "@plyco/shared"
import { toast } from "sonner"

import { useSelectedOrganization } from "@/features/organizations/hooks/use-selected-organization"
import { useAuthState } from "@/features/auth/hooks/use-auth"
import {
  createOrganizationProvider,
  createServiceProviderUsage,
  deleteServiceProviderUsage,
  deleteOrganizationProvider,
  getProviders,
  updateServiceProviderUsage,
  updateOrganizationProvider,
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

export const useCreateOrganizationProvider = () => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()

  return useMutation({
    mutationFn: (provider: OrganizationProviderInput) =>
      createOrganizationProvider(selectedOrganizationId ?? "", provider),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: securityProfileQueryKey(selectedOrganizationId ?? ""),
      })
      toast.success("Provider added")
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Could not add provider")
    },
  })
}

export const useCreateOrganizationProviders = () => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()

  return useMutation({
    mutationFn: (providers: OrganizationProviderInput[]) =>
      Promise.all(
        providers.map((provider) =>
          createOrganizationProvider(selectedOrganizationId ?? "", provider),
        ),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: securityProfileQueryKey(selectedOrganizationId ?? ""),
      })
      toast.success("Providers added")
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Could not add providers")
    },
  })
}

export const useUpdateOrganizationProvider = () => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()
  const organizationId = selectedOrganizationId ?? ""

  return useMutation({
    mutationFn: (input: { id: string; provider: OrganizationProviderInput }) =>
      updateOrganizationProvider({ organizationId, ...input }),
    onMutate: async ({ id, provider }) => {
      const key = securityProfileQueryKey(organizationId)
      await queryClient.cancelQueries({ queryKey: key })
      const previousSnapshot = queryClient.getQueryData<{
        organization: unknown
        organizationProviders: OrganizationProvider[]
      }>(key)

      queryClient.setQueryData(key, (current: unknown) => {
        if (!current || typeof current !== "object") {
          return current
        }

        const snapshot = current as {
          organizationProviders: OrganizationProvider[]
        }
        return {
          ...snapshot,
          organizationProviders: snapshot.organizationProviders.map(
            (currentProvider) =>
              currentProvider.id === id
                ? { ...currentProvider, ...provider }
                : currentProvider,
          ),
        }
      })

      return { previousSnapshot }
    },
    onError: (err: Error, _variables, context) => {
      if (context?.previousSnapshot) {
        queryClient.setQueryData(
          securityProfileQueryKey(organizationId),
          context.previousSnapshot,
        )
      }
      toast.error(err.message ?? "Could not update provider")
    },
    onSuccess: () => {
      toast.success("Provider updated")
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: securityProfileQueryKey(organizationId),
      })
    },
  })
}

export const useDeleteOrganizationProvider = () => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()
  const organizationId = selectedOrganizationId ?? ""

  return useMutation({
    mutationFn: (id: string) => deleteOrganizationProvider(organizationId, id),
    onMutate: async (id) => {
      const key = securityProfileQueryKey(organizationId)
      await queryClient.cancelQueries({ queryKey: key })
      const previousSnapshot = queryClient.getQueryData<{
        organization: unknown
        organizationProviders: OrganizationProvider[]
      }>(key)

      queryClient.setQueryData(key, (current: unknown) => {
        if (!current || typeof current !== "object") {
          return current
        }

        const snapshot = current as {
          organizationProviders: OrganizationProvider[]
        }
        return {
          ...snapshot,
          organizationProviders: snapshot.organizationProviders.filter(
            (provider) => provider.id !== id,
          ),
        }
      })

      return { previousSnapshot }
    },
    onError: (err: Error, _id, context) => {
      if (context?.previousSnapshot) {
        queryClient.setQueryData(
          securityProfileQueryKey(organizationId),
          context.previousSnapshot,
        )
      }
      toast.error(err.message ?? "Could not delete provider")
    },
    onSuccess: () => {
      toast.success("Provider removed")
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: securityProfileQueryKey(organizationId),
      })
    },
  })
}

export const useCreateServiceProviderUsage = () => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()

  return useMutation({
    mutationFn: (providerUsage: ServiceProviderUsageInput) =>
      createServiceProviderUsage(selectedOrganizationId ?? "", providerUsage),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: securityProfileQueryKey(selectedOrganizationId ?? ""),
      })
      toast.success("Provider usage added")
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Could not add provider usage")
    },
  })
}

export const useUpdateServiceProviderUsage = () => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()
  const organizationId = selectedOrganizationId ?? ""

  return useMutation({
    mutationFn: (input: {
      id: string
      providerUsage: ServiceProviderUsageInput
    }) => updateServiceProviderUsage({ organizationId, ...input }),
    onMutate: async ({ id, providerUsage }) => {
      const key = securityProfileQueryKey(organizationId)
      await queryClient.cancelQueries({ queryKey: key })
      const previousSnapshot = queryClient.getQueryData<{
        organization: unknown
        serviceProviderUsage: ServiceProviderUsage[]
      }>(key)

      queryClient.setQueryData(key, (current: unknown) => {
        if (!current || typeof current !== "object") {
          return current
        }

        const snapshot = current as {
          serviceProviderUsage: ServiceProviderUsage[]
        }
        return {
          ...snapshot,
          serviceProviderUsage: snapshot.serviceProviderUsage.map(
            (currentUsage) =>
              currentUsage.id === id
                ? { ...currentUsage, ...providerUsage }
                : currentUsage,
          ),
        }
      })

      return { previousSnapshot }
    },
    onError: (err: Error, _variables, context) => {
      if (context?.previousSnapshot) {
        queryClient.setQueryData(
          securityProfileQueryKey(organizationId),
          context.previousSnapshot,
        )
      }
      toast.error(err.message ?? "Could not update provider usage")
    },
    onSuccess: () => {
      toast.success("Provider usage updated")
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: securityProfileQueryKey(organizationId),
      })
    },
  })
}

export const useDeleteServiceProviderUsage = () => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()
  const organizationId = selectedOrganizationId ?? ""

  return useMutation({
    mutationFn: (id: string) => deleteServiceProviderUsage(organizationId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: securityProfileQueryKey(organizationId),
      })
      toast.success("Provider usage removed")
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Could not remove provider usage")
    },
  })
}
