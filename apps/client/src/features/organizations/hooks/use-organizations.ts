import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type CreateOrganization } from "@complyflow/shared"
import { toast } from "sonner"

import { createOrganization } from "@/lib/api"
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
