import {
  authUserSchema,
  organizationInvitationSchema,
  organizationMemberSchema,
  organizationSummarySchema,
  type AuthUser,
  type CreateOrganization,
  type OrganizationInvitation,
  type OrganizationInvitationInput,
  type OrganizationMember,
  type OrganizationMemberRoleUpdate,
  type OrganizationMembershipRole,
  type OrganizationSummary,
} from "@plyco/shared"

import { ApiError } from "../../infrastructure/errors.js"
import {
  type AccountRepository,
  type AccountUserInput,
} from "./repository.js"

const now = () => new Date().toISOString()
const newId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`

export class InMemoryAccountRepository implements AccountRepository {
  private users = new Map<string, AuthUser>()
  private googleSubjectUserIds = new Map<string, string>()
  private organizations = new Map<string, OrganizationSummary>()
  private memberships = new Map<string, OrganizationMembershipRole>()
  private invitations = new Map<
    string,
    OrganizationInvitation & {
      tokenHash: string
      acceptedAt: string | null
      canceledAt: string | null
      acceptedByUserId: string | null
    }
  >()

  async getUser(userId: string): Promise<AuthUser | null> {
    return this.users.get(userId) ?? null
  }

  async upsertUser(input: AccountUserInput): Promise<AuthUser> {
    const id = this.googleSubjectUserIds.get(input.googleSubject) ?? newId("user")
    const user = authUserSchema.parse({
      id,
      email: input.email,
      name: input.name,
      picture: input.picture,
    })

    this.googleSubjectUserIds.set(input.googleSubject, id)
    this.users.set(id, user)

    return user
  }

  async listOrganizations(userId: string): Promise<OrganizationSummary[]> {
    return Array.from(this.organizations.values()).filter((organization) =>
      this.memberships.has(this.membershipKey(userId, organization.id)),
    )
  }

  async listOrganizationMembers(
    organizationId: string,
  ): Promise<OrganizationMember[]> {
    return Array.from(this.users.values())
      .filter((user) => this.memberships.has(this.membershipKey(user.id, organizationId)))
      .map((user) =>
        organizationMemberSchema.parse({
          userId: user.id,
          name: user.name,
          email: user.email,
          role: this.memberships.get(this.membershipKey(user.id, organizationId)),
          createdAt: now(),
        }),
      )
  }

  async listOrganizationInvitations(
    organizationId: string,
  ): Promise<OrganizationInvitation[]> {
    const timestamp = Date.now()

    return Array.from(this.invitations.values())
      .filter(
        (invitation) =>
          invitation.organizationId === organizationId &&
          !invitation.acceptedAt &&
          !invitation.canceledAt &&
          Date.parse(invitation.expiresAt) > timestamp,
      )
      .map((invitation) => organizationInvitationSchema.parse(invitation))
  }

  async createOrganizationInvitation(input: {
    organizationId: string
    invitedByUserId: string
    invitation: OrganizationInvitationInput
    tokenHash: string
    expiresAt: Date
  }): Promise<OrganizationInvitation> {
    const existingMember = Array.from(this.users.values()).some(
      (user) =>
        user.email.toLowerCase() === input.invitation.email.toLowerCase() &&
        this.memberships.has(this.membershipKey(user.id, input.organizationId)),
    )

    if (existingMember) {
      throw new ApiError(
        "ORGANIZATION_MEMBER_ALREADY_EXISTS",
        "That email already belongs to this organization.",
        409,
      )
    }

    const existingInvitation = Array.from(this.invitations.values()).some(
      (invitation) =>
        invitation.organizationId === input.organizationId &&
        invitation.email.toLowerCase() ===
          input.invitation.email.toLowerCase() &&
        !invitation.acceptedAt &&
        !invitation.canceledAt &&
        Date.parse(invitation.expiresAt) > Date.now(),
    )

    if (existingInvitation) {
      throw new ApiError(
        "ORGANIZATION_INVITATION_ALREADY_EXISTS",
        "That email already has a pending invitation.",
        409,
      )
    }

    const inviter = this.users.get(input.invitedByUserId)
    if (!inviter) {
      throw new ApiError("USER_NOT_FOUND", "Inviting user was not found.", 404)
    }

    const invitation = organizationInvitationSchema.parse({
      id: newId("invite"),
      organizationId: input.organizationId,
      email: input.invitation.email,
      role: input.invitation.role,
      invitedByUserId: input.invitedByUserId,
      invitedByName: inviter.name,
      expiresAt: input.expiresAt.toISOString(),
      createdAt: now(),
    })

    this.invitations.set(invitation.id, {
      ...invitation,
      tokenHash: input.tokenHash,
      acceptedAt: null,
      canceledAt: null,
      acceptedByUserId: null,
    })

    return invitation
  }

  async cancelOrganizationInvitation(
    organizationId: string,
    invitationId: string,
  ): Promise<boolean> {
    const invitation = this.invitations.get(invitationId)

    if (
      !invitation ||
      invitation.organizationId !== organizationId ||
      invitation.acceptedAt ||
      invitation.canceledAt
    ) {
      return false
    }

    this.invitations.set(invitationId, {
      ...invitation,
      canceledAt: now(),
    })

    return true
  }

  async acceptOrganizationInvitation(input: {
    tokenHash: string
    userId: string
    email: string
    now: Date
  }): Promise<OrganizationSummary> {
    const invitation = Array.from(this.invitations.values()).find(
      (current) => current.tokenHash === input.tokenHash,
    )

    if (
      !invitation ||
      invitation.canceledAt ||
      Date.parse(invitation.expiresAt) <= input.now.getTime()
    ) {
      throw new ApiError(
        "ORGANIZATION_INVITATION_INVALID",
        "This invitation is no longer valid.",
        400,
      )
    }

    if (invitation.email.toLowerCase() !== input.email.toLowerCase()) {
      throw new ApiError(
        "ORGANIZATION_INVITATION_EMAIL_MISMATCH",
        "Sign in with the email address this invitation was sent to.",
        403,
      )
    }

    const organization = this.organizations.get(invitation.organizationId)
    if (!organization) {
      throw new ApiError("ORGANIZATION_NOT_FOUND", "Organization not found.", 404)
    }

    if (invitation.acceptedAt) {
      const currentRole = this.memberships.get(
        this.membershipKey(input.userId, invitation.organizationId),
      )

      if (currentRole) {
        return { ...organization, role: currentRole }
      }

      throw new ApiError(
        "ORGANIZATION_INVITATION_INVALID",
        "This invitation is no longer valid.",
        400,
      )
    }

    this.memberships.set(
      this.membershipKey(input.userId, invitation.organizationId),
      invitation.role,
    )
    this.invitations.set(invitation.id, {
      ...invitation,
      acceptedAt: input.now.toISOString(),
      acceptedByUserId: input.userId,
    })

    return { ...organization, role: invitation.role }
  }

  async updateOrganizationMemberRole(
    organizationId: string,
    userId: string,
    input: OrganizationMemberRoleUpdate,
  ): Promise<OrganizationMember | null> {
    const key = this.membershipKey(userId, organizationId)
    const currentRole = this.memberships.get(key)
    const user = this.users.get(userId)

    if (!currentRole || !user) {
      return null
    }

    if (currentRole === "owner" && input.role !== "owner") {
      this.ensureAnotherOwner(organizationId, userId)
    }

    this.memberships.set(key, input.role)

    return organizationMemberSchema.parse({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: input.role,
      createdAt: now(),
    })
  }

  async removeOrganizationMember(
    organizationId: string,
    userId: string,
  ): Promise<boolean> {
    const key = this.membershipKey(userId, organizationId)
    const role = this.memberships.get(key)

    if (!role) {
      return false
    }

    if (role === "owner") {
      this.ensureAnotherOwner(organizationId, userId)
    }

    return this.memberships.delete(key)
  }

  async deleteOrganization(organizationId: string): Promise<boolean> {
    const deleted = this.organizations.delete(organizationId)

    if (deleted) {
      for (const key of this.memberships.keys()) {
        if (key.endsWith(`:${organizationId}`)) {
          this.memberships.delete(key)
        }
      }
      for (const [id, invitation] of this.invitations) {
        if (invitation.organizationId === organizationId) {
          this.invitations.delete(id)
        }
      }
    }

    return deleted
  }

  async createOrganization(
    userId: string,
    input: CreateOrganization,
  ): Promise<OrganizationSummary> {
    const timestamp = now()
    const organization = organizationSummarySchema.parse({
      id: newId("org"),
      name: input.name,
      role: "owner",
      createdAt: timestamp,
      updatedAt: timestamp,
    })

    this.organizations.set(organization.id, organization)
    this.memberships.set(this.membershipKey(userId, organization.id), "owner")

    return organization
  }

  async getMembershipRole(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationMembershipRole | null> {
    return this.memberships.get(this.membershipKey(userId, organizationId)) ?? null
  }

  addMembership(
    userId: string,
    organization: OrganizationSummary,
    role: OrganizationMembershipRole = "member",
  ) {
    this.organizations.set(organization.id, { ...organization, role })
    this.memberships.set(this.membershipKey(userId, organization.id), role)
  }

  private membershipKey(userId: string, organizationId: string) {
    return `${userId}:${organizationId}`
  }

  private ensureAnotherOwner(organizationId: string, userId: string) {
    const hasAnotherOwner = Array.from(this.memberships.entries()).some(
      ([key, role]) =>
        key.endsWith(`:${organizationId}`) &&
        key !== this.membershipKey(userId, organizationId) &&
        role === "owner",
    )

    if (!hasAnotherOwner) {
      throw new ApiError(
        "ORGANIZATION_REQUIRES_OWNER",
        "An organization must have at least one owner.",
        400,
      )
    }
  }
}
