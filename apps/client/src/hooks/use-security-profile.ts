import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  type Template,
  type Vendor,
  type VendorInput,
} from "@complyflow/shared"

import {
  createDocument,
  createTemplateFromSystem,
  createVendor,
  deleteTemplate,
  deleteVendor,
  getDocument,
  getDocuments,
  getProviders,
  getSecurityProfile,
  getTemplates,
  saveSecurityProfile,
  updateTemplate,
  updateVendor,
} from "@/lib/api"
import { type ProfileDraft } from "@/types/security-profile"

const securityProfileQueryKey = ["security-profile"] as const
const providersQueryKey = ["providers"] as const
const templatesQueryKey = ["templates"] as const
const documentsQueryKey = ["documents"] as const

export const useSecurityProfile = () =>
  useQuery({
    queryKey: securityProfileQueryKey,
    queryFn: getSecurityProfile,
  })

export const useProviders = () =>
  useQuery({
    queryKey: providersQueryKey,
    queryFn: getProviders,
  })

export const useTemplates = () =>
  useQuery({
    queryKey: templatesQueryKey,
    queryFn: getTemplates,
  })

export const useDocuments = () =>
  useQuery({
    queryKey: documentsQueryKey,
    queryFn: getDocuments,
  })

export const useDocument = (id: string | null) =>
  useQuery({
    enabled: Boolean(id),
    queryKey: ["document", id] as const,
    queryFn: () => getDocument(id ?? ""),
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

export const useCreateTemplateFromSystem = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTemplateFromSystem,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: templatesQueryKey })
      void queryClient.invalidateQueries({ queryKey: documentsQueryKey })
    },
  })
}

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTemplate,
    onMutate: async ({ id, template }) => {
      await queryClient.cancelQueries({ queryKey: templatesQueryKey })
      const previousCatalog = queryClient.getQueryData<{
        systemTemplates: unknown[]
        organizationTemplates: Template[]
      }>(templatesQueryKey)

      queryClient.setQueryData(templatesQueryKey, (current: unknown) => {
        if (!current || typeof current !== "object") {
          return current
        }

        const catalog = current as {
          organizationTemplates: Template[]
        }
        return {
          ...catalog,
          organizationTemplates: catalog.organizationTemplates.map(
            (currentTemplate) =>
              currentTemplate.id === id
                ? { ...currentTemplate, ...template }
                : currentTemplate
          ),
        }
      })

      return { previousCatalog }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousCatalog) {
        queryClient.setQueryData(templatesQueryKey, context.previousCatalog)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: templatesQueryKey })
      void queryClient.invalidateQueries({ queryKey: documentsQueryKey })
    },
  })
}

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTemplate,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: templatesQueryKey })
      const previousCatalog = queryClient.getQueryData<{
        systemTemplates: unknown[]
        organizationTemplates: Template[]
      }>(templatesQueryKey)

      queryClient.setQueryData(templatesQueryKey, (current: unknown) => {
        if (!current || typeof current !== "object") {
          return current
        }

        const catalog = current as {
          organizationTemplates: Template[]
        }
        return {
          ...catalog,
          organizationTemplates: catalog.organizationTemplates.filter(
            (template) => template.id !== id
          ),
        }
      })

      return { previousCatalog }
    },
    onError: (_error, _id, context) => {
      if (context?.previousCatalog) {
        queryClient.setQueryData(templatesQueryKey, context.previousCatalog)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: templatesQueryKey })
      void queryClient.invalidateQueries({ queryKey: documentsQueryKey })
    },
  })
}

export const useCreateDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createDocument,
    onSuccess: (document) => {
      void queryClient.invalidateQueries({ queryKey: documentsQueryKey })
      queryClient.setQueryData(["document", document.id], document)
    },
  })
}

export type SaveProfilePayload = ProfileDraft
