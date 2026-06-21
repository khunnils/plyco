import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type CreateDocument } from "@plyco/shared"
import { toast } from "sonner"

import { useSelectedOrganization } from "@/features/organizations/hooks/use-selected-organization"
import { useAuthState } from "@/features/auth/hooks/use-auth"
import {
  createDocument,
  downloadDocumentPdf,
  getDocument,
  getOrganizationDocuments,
} from "@/lib/api"
import { documentQueryKey, documentsQueryKey } from "@/lib/query-keys"

export const useDocuments = (enabled = true) => {
  const { data: auth } = useAuthState()
  const user = auth?.user ?? null
  const { selectedOrganizationId } = useSelectedOrganization()

  return useQuery({
    enabled: enabled && Boolean(user) && Boolean(selectedOrganizationId),
    queryKey: documentsQueryKey(selectedOrganizationId ?? ""),
    queryFn: () => getOrganizationDocuments(selectedOrganizationId ?? ""),
  })
}

export const useDocument = (id: string | null, enabled = true) => {
  const { data: auth } = useAuthState()
  const user = auth?.user ?? null
  const { selectedOrganizationId } = useSelectedOrganization()

  return useQuery({
    enabled:
      enabled &&
      Boolean(user) &&
      Boolean(selectedOrganizationId) &&
      Boolean(id),
    queryKey: documentQueryKey(selectedOrganizationId ?? "", id ?? ""),
    queryFn: () => getDocument(selectedOrganizationId ?? "", id ?? ""),
  })
}

export const useCreateDocument = () => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()
  const organizationId = selectedOrganizationId ?? ""

  return useMutation({
    mutationFn: (input: CreateDocument) =>
      createDocument(organizationId, input),
    onSuccess: (document) => {
      void queryClient.invalidateQueries({
        queryKey: documentsQueryKey(organizationId),
      })
      queryClient.setQueryData(
        documentQueryKey(organizationId, document.id),
        document
      )
      toast.success("Document generated")
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Could not generate document")
    },
  })
}

export const useDownloadDocumentPdf = () => {
  const { selectedOrganizationId } = useSelectedOrganization()
  const organizationId = selectedOrganizationId ?? ""

  return useMutation({
    mutationFn: (input: { id: string; title: string }) =>
      downloadDocumentPdf({
        organizationId,
        id: input.id,
        title: input.title,
      }),
    onError: (err: Error) => {
      toast.error(err.message ?? "Could not download PDF")
    },
  })
}
