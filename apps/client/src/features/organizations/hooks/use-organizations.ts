import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type CreateOrganization, type OrganizationLookupInput } from "@plyco/shared"
import { toast } from "sonner"

import { createOrganization, lookupOrganization } from "@/lib/api"
import { authStateQueryKey } from "@/lib/query-keys"

export const useCreateOrganization = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateOrganization) => createOrganization(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authStateQueryKey })
      toast.success("Organization created")
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Could not create organization")
    },
  })
}

export const useLookupOrganization = () =>
  useMutation({
    mutationFn: (input: OrganizationLookupInput) => lookupOrganization(input),
    onError: (err: Error) => {
      toast.warning(
        err.message ??
          "Could not pull details from the website. You can continue manually."
      )
    },
  })
