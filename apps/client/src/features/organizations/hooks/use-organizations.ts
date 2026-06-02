import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  type CreateOrganization,
  type OrganizationPrivacyPolicyLookupInput,
  type OrganizationWebsiteLookupInput,
} from "@plyco/shared"
import { toast } from "sonner"

import {
  createOrganization,
  lookupOrganizationWebsite,
  lookupPrivacyPolicy,
} from "@/lib/api"
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

export const useLookupOrganizationWebsite = () =>
  useMutation({
    mutationFn: (input: OrganizationWebsiteLookupInput) =>
      lookupOrganizationWebsite(input),
    onError: (err: Error) => {
      toast.warning(
        err.message ??
          "Could not pull details from the website. You can continue manually."
      )
    },
  })

export const useLookupPrivacyPolicy = () =>
  useMutation({
    mutationFn: (input: OrganizationPrivacyPolicyLookupInput) =>
      lookupPrivacyPolicy(input),
    onError: (err: Error) => {
      toast.warning(
        err.message ??
          "Could not pull details from the privacy policy. You can continue manually."
      )
    },
  })
