import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  type AuthState,
  type OrganizationInvitationInput,
  type OrganizationMemberRoleUpdate,
} from "@plyco/shared"
import { toast } from "sonner"

import { useCurrentOrganizationStore } from "@/features/organizations/stores/current-organization-store"
import {
  acceptOrganizationInvitation,
  cancelOrganizationInvitation,
  deleteOrganization,
  getOrganizationInvitations,
  getOrganizationMembers,
  inviteOrganizationMember,
  removeOrganizationMember,
  updateOrganizationMemberRole,
} from "@/lib/api"
import {
  authStateQueryKey,
  organizationInvitationsQueryKey,
  organizationMembersQueryKey,
} from "@/lib/query-keys"

export const useOrganizationMembers = (
  organizationId: string | null,
  enabled = true
) =>
  useQuery({
    enabled: enabled && Boolean(organizationId),
    queryKey: organizationMembersQueryKey(organizationId ?? ""),
    queryFn: () => getOrganizationMembers(organizationId ?? ""),
  })

export const useOrganizationInvitations = (
  organizationId: string | null,
  enabled = true
) =>
  useQuery({
    enabled: enabled && Boolean(organizationId),
    queryKey: organizationInvitationsQueryKey(organizationId ?? ""),
    queryFn: () => getOrganizationInvitations(organizationId ?? ""),
  })

export const useInviteOrganizationMember = (organizationId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: OrganizationInvitationInput) =>
      inviteOrganizationMember(organizationId, input),
    onSuccess: () => {
      toast.success("Invitation sent")
      return queryClient.invalidateQueries({
        queryKey: organizationInvitationsQueryKey(organizationId),
      })
    },
    onError: (err: Error) =>
      toast.error(err.message ?? "Could not send invitation"),
  })
}

export const useCancelOrganizationInvitation = (organizationId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: string) =>
      cancelOrganizationInvitation(organizationId, invitationId),
    onSuccess: () => {
      toast.success("Invitation canceled")
      return queryClient.invalidateQueries({
        queryKey: organizationInvitationsQueryKey(organizationId),
      })
    },
    onError: (err: Error) =>
      toast.error(err.message ?? "Could not cancel invitation"),
  })
}

export const useUpdateOrganizationMemberRole = (organizationId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      userId,
      input,
    }: {
      userId: string
      input: OrganizationMemberRoleUpdate
    }) => updateOrganizationMemberRole(organizationId, userId, input),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: organizationMembersQueryKey(organizationId),
        }),
        queryClient.invalidateQueries({ queryKey: authStateQueryKey }),
      ]).then(() => {
        toast.success("Member role updated")
      }),
    onError: (err: Error) =>
      toast.error(err.message ?? "Could not update member role"),
  })
}

export const useRemoveOrganizationMember = (organizationId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) =>
      removeOrganizationMember(organizationId, userId),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: organizationMembersQueryKey(organizationId),
        }),
        queryClient.invalidateQueries({ queryKey: authStateQueryKey }),
      ]).then(() => {
        toast.success("Member removed")
      }),
    onError: (err: Error) =>
      toast.error(err.message ?? "Could not remove member"),
  })
}

export const useDeleteOrganization = (organizationId: string) => {
  const queryClient = useQueryClient()
  const resetOrganization = useCurrentOrganizationStore((state) => state.reset)

  return useMutation({
    mutationFn: () => deleteOrganization(organizationId),
    onSuccess: () =>
      queryClient
        .invalidateQueries({ queryKey: authStateQueryKey })
        .then(() => {
          resetOrganization()
          toast.success("Organization deleted")
        }),
    onError: (err: Error) =>
      toast.error(err.message ?? "Could not delete organization"),
  })
}

export const useAcceptOrganizationInvitation = () => {
  const queryClient = useQueryClient()
  const selectOrganization = useCurrentOrganizationStore(
    (state) => state.selectOrganization
  )

  return useMutation({
    mutationFn: (token: string) => acceptOrganizationInvitation(token),
    onSuccess: (result) => {
      queryClient.setQueryData<AuthState>(authStateQueryKey, (current) => {
        if (!current?.user) {
          return current
        }

        const organizations = current.organizations.some(
          (organization) => organization.id === result.organization.id
        )
          ? current.organizations.map((organization) =>
              organization.id === result.organization.id
                ? result.organization
                : organization
            )
          : [...current.organizations, result.organization]

        return {
          ...current,
          organizations,
        }
      })
      selectOrganization(result.organization.id)
      toast.success(`Joined ${result.organization.name}`)
      void queryClient.invalidateQueries({ queryKey: authStateQueryKey })
    },
    onError: (err: Error) =>
      toast.error(err.message ?? "Could not accept invitation"),
  })
}
