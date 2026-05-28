import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  type CreateTemplateFromSystem,
  type Template,
  type TemplateInput,
} from "@plyco/shared"
import { toast } from "sonner"

import { useSelectedOrganization } from "@/features/organizations/hooks/use-selected-organization"
import { useAuthState } from "@/features/auth/hooks/use-auth"
import {
  createTemplate,
  createTemplateFromSystem,
  deleteTemplate,
  getOrganizationMembers,
  getOrganizationTemplates,
  getTemplateVariableCatalog,
  previewTemplate,
  updateTemplate,
} from "@/lib/api"
import {
  documentsQueryKey,
  organizationMembersQueryKey,
  templatePreviewQueryKey,
  templateSchemaQueryKey,
  templatesQueryKey,
} from "@/lib/query-keys"

export const useTemplates = (enabled = true) => {
  const { data: auth } = useAuthState()
  const user = auth?.user ?? null
  const { selectedOrganizationId } = useSelectedOrganization()

  return useQuery({
    enabled: enabled && Boolean(user) && Boolean(selectedOrganizationId),
    queryKey: templatesQueryKey(selectedOrganizationId ?? ""),
    queryFn: () => getOrganizationTemplates(selectedOrganizationId ?? ""),
  })
}

export const useOrganizationMembers = (enabled = true) => {
  const { data: auth } = useAuthState()
  const user = auth?.user ?? null
  const { selectedOrganizationId } = useSelectedOrganization()

  return useQuery({
    enabled: enabled && Boolean(user) && Boolean(selectedOrganizationId),
    queryKey: organizationMembersQueryKey(selectedOrganizationId ?? ""),
    queryFn: () => getOrganizationMembers(selectedOrganizationId ?? ""),
  })
}

export const useTemplateVariableCatalog = (enabled = true) => {
  const { data: auth } = useAuthState()
  const user = auth?.user ?? null
  const { selectedOrganizationId } = useSelectedOrganization()

  return useQuery({
    enabled: enabled && Boolean(user) && Boolean(selectedOrganizationId),
    queryKey: templateSchemaQueryKey(selectedOrganizationId ?? ""),
    queryFn: () => getTemplateVariableCatalog(selectedOrganizationId ?? ""),
  })
}

export const useTemplatePreview = (template: TemplateInput, enabled = true) => {
  const { data: auth } = useAuthState()
  const user = auth?.user ?? null
  const { selectedOrganizationId } = useSelectedOrganization()
  const organizationId = selectedOrganizationId ?? ""

  return useQuery({
    enabled:
      enabled &&
      Boolean(user) &&
      Boolean(organizationId) &&
      template.name.trim().length > 0,
    queryKey: templatePreviewQueryKey(
      organizationId,
      template.name,
      template.content
    ),
    queryFn: () => previewTemplate(organizationId, template),
    retry: false,
  })
}

export const useCreateTemplateFromSystem = () => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()
  const organizationId = selectedOrganizationId ?? ""

  return useMutation({
    mutationFn: (input: CreateTemplateFromSystem) =>
      createTemplateFromSystem(organizationId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: templatesQueryKey(organizationId),
      })
      void queryClient.invalidateQueries({
        queryKey: documentsQueryKey(organizationId),
      })
      toast.success("Template added")
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Could not add template")
    },
  })
}

export const useCreateTemplate = () => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()
  const organizationId = selectedOrganizationId ?? ""

  return useMutation({
    mutationFn: (input: TemplateInput) => createTemplate(organizationId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: templatesQueryKey(organizationId),
      })
      void queryClient.invalidateQueries({
        queryKey: documentsQueryKey(organizationId),
      })
      toast.success("Template created")
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Could not create template")
    },
  })
}

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()
  const organizationId = selectedOrganizationId ?? ""

  return useMutation({
    mutationFn: (input: { id: string; template: TemplateInput }) =>
      updateTemplate({ organizationId, ...input }),
    onMutate: async ({ id, template }) => {
      const key = templatesQueryKey(organizationId)
      await queryClient.cancelQueries({ queryKey: key })
      const previousCatalog = queryClient.getQueryData<{
        systemTemplates: unknown[]
        organizationTemplates: Template[]
      }>(key)

      queryClient.setQueryData(key, (current: unknown) => {
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
    onError: (err: Error, _variables, context) => {
      if (context?.previousCatalog) {
        queryClient.setQueryData(
          templatesQueryKey(organizationId),
          context.previousCatalog
        )
      }
      toast.error(err.message ?? "Could not update template")
    },
    onSuccess: () => {
      toast.success("Template saved")
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: templatesQueryKey(organizationId),
      })
      void queryClient.invalidateQueries({
        queryKey: documentsQueryKey(organizationId),
      })
    },
  })
}

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useSelectedOrganization()
  const organizationId = selectedOrganizationId ?? ""

  return useMutation({
    mutationFn: (id: string) => deleteTemplate(organizationId, id),
    onMutate: async (id) => {
      const key = templatesQueryKey(organizationId)
      await queryClient.cancelQueries({ queryKey: key })
      const previousCatalog = queryClient.getQueryData<{
        systemTemplates: unknown[]
        organizationTemplates: Template[]
      }>(key)

      queryClient.setQueryData(key, (current: unknown) => {
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
    onError: (err: Error, _id, context) => {
      if (context?.previousCatalog) {
        queryClient.setQueryData(
          templatesQueryKey(organizationId),
          context.previousCatalog
        )
      }
      toast.error(err.message ?? "Could not delete template")
    },
    onSuccess: () => {
      toast.success("Template deleted")
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: templatesQueryKey(organizationId),
      })
      void queryClient.invalidateQueries({
        queryKey: documentsQueryKey(organizationId),
      })
    },
  })
}
