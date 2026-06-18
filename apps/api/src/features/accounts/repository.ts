import {
  type AuthUser,
  type CreateOrganization,
  type OrganizationInvitation,
  type OrganizationInvitationInput,
  type OrganizationMember,
  type OrganizationMemberRoleUpdate,
  type OrganizationMembershipRole,
  type OrganizationSummary,
} from "@plyco/shared"

export type AccountUserInput = {
  googleSubject: string
  email: string
  name: string
  picture?: string
}

export interface AccountRepository {
  getUser(userId: string): Promise<AuthUser | null>
  upsertUser(input: AccountUserInput): Promise<AuthUser>
  listOrganizations(userId: string): Promise<OrganizationSummary[]>
  listOrganizationMembers(organizationId: string): Promise<OrganizationMember[]>
  listOrganizationInvitations(
    organizationId: string,
  ): Promise<OrganizationInvitation[]>
  createOrganizationInvitation(input: {
    organizationId: string
    invitedByUserId: string
    invitation: OrganizationInvitationInput
    tokenHash: string
    expiresAt: Date
  }): Promise<OrganizationInvitation>
  cancelOrganizationInvitation(
    organizationId: string,
    invitationId: string,
  ): Promise<boolean>
  acceptOrganizationInvitation(input: {
    tokenHash: string
    userId: string
    email: string
    now: Date
  }): Promise<OrganizationSummary>
  updateOrganizationMemberRole(
    organizationId: string,
    userId: string,
    input: OrganizationMemberRoleUpdate,
  ): Promise<OrganizationMember | null>
  removeOrganizationMember(
    organizationId: string,
    userId: string,
  ): Promise<boolean>
  deleteOrganization(organizationId: string): Promise<boolean>
  createOrganization(
    userId: string,
    input: CreateOrganization,
  ): Promise<OrganizationSummary>
  getMembershipRole(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationMembershipRole | null>
}
