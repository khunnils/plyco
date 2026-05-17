import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type VocabularyCodeInput } from "@complyflow/shared"
import { toast } from "sonner"

import { useAuthState } from "@/features/auth/hooks/use-auth"
import { useSelectedOrganization } from "@/features/organizations/hooks/use-selected-organization"
import {
  createVocabularyCode,
  deleteVocabularyCode,
  getCountries,
  getVocabulary,
  updateVocabularyCode,
} from "@/lib/api"
import { countriesQueryKey, vocabularyQueryKey } from "@/lib/query-keys"

export const useCountries = (enabled = true) => {
  const { data: auth } = useAuthState()

  return useQuery({
    enabled: enabled && Boolean(auth?.user),
    queryKey: countriesQueryKey,
    queryFn: getCountries,
  })
}

export const useVocabulary = (enabled = true) => {
  const { selectedOrganizationId } = useSelectedOrganization()

  return useQuery({
    enabled: enabled && Boolean(selectedOrganizationId),
    queryKey: vocabularyQueryKey(selectedOrganizationId ?? ""),
    queryFn: () => getVocabulary(selectedOrganizationId ?? ""),
  })
}

export const useCreateVocabularyCode = () => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()
  const organizationId = selectedOrganizationId ?? ""

  return useMutation({
    mutationFn: (input: { codeSetId: string; code: VocabularyCodeInput }) =>
      createVocabularyCode({ organizationId, ...input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: vocabularyQueryKey(organizationId),
      })
      toast.success("Code added")
    },
    onError: (err: Error) => toast.error(err.message ?? "Could not add code"),
  })
}

export const useUpdateVocabularyCode = () => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()
  const organizationId = selectedOrganizationId ?? ""

  return useMutation({
    mutationFn: (input: {
      codeSetId: string
      codeId: string
      code: VocabularyCodeInput
    }) => updateVocabularyCode({ organizationId, ...input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: vocabularyQueryKey(organizationId),
      })
      toast.success("Code updated")
    },
    onError: (err: Error) => toast.error(err.message ?? "Could not update code"),
  })
}

export const useDeleteVocabularyCode = () => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()
  const organizationId = selectedOrganizationId ?? ""

  return useMutation({
    mutationFn: (input: { codeSetId: string; codeId: string }) =>
      deleteVocabularyCode({ organizationId, ...input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: vocabularyQueryKey(organizationId),
      })
      toast.success("Code removed")
    },
    onError: (err: Error) => toast.error(err.message ?? "Could not remove code"),
  })
}
