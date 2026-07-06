import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type CreateOrganizationApiKey } from "@plyco/shared"
import { toast } from "sonner"

import {
  createOrganizationApiKey,
  getOrganizationApiKeys,
  revokeOrganizationApiKey,
} from "@/lib/api"
import { organizationApiKeysQueryKey } from "@/lib/query-keys"

export const useOrganizationApiKeys = (
  organizationId: string | null,
  enabled = true
) =>
  useQuery({
    enabled: enabled && Boolean(organizationId),
    queryKey: organizationApiKeysQueryKey(organizationId ?? ""),
    queryFn: () => getOrganizationApiKeys(organizationId ?? ""),
  })

export const useCreateOrganizationApiKey = (organizationId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateOrganizationApiKey) =>
      createOrganizationApiKey(organizationId, input),
    onSuccess: () => {
      toast.success("API key created")
      return queryClient.invalidateQueries({
        queryKey: organizationApiKeysQueryKey(organizationId),
      })
    },
    onError: (err: Error) =>
      toast.error(err.message ?? "Could not create API key"),
  })
}

export const useRevokeOrganizationApiKey = (organizationId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (keyId: string) =>
      revokeOrganizationApiKey(organizationId, keyId),
    onSuccess: () => {
      toast.success("API key revoked")
      return queryClient.invalidateQueries({
        queryKey: organizationApiKeysQueryKey(organizationId),
      })
    },
    onError: (err: Error) =>
      toast.error(err.message ?? "Could not revoke API key"),
  })
}
