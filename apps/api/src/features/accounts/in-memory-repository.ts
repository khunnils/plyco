import {
  authUserSchema,
  organizationApiKeySchema,
  organizationInvitationSchema,
  organizationMemberSchema,
  organizationSummarySchema,
  type AuthUser,
  type CreateOrganization,
  type OrganizationApiKey,
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
  type GoogleAccountUserInput,
} from "./repository.js"

const now = () => new Date().toISOString()
const newId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`

export class InMemoryAccountRepository implements AccountRepository {
  private users = new Map<string, AuthUser>()
  private googleSubjectUserIds = new Map<string, string>()
  private emailUserIds = new Map<string, string>()
  private magicLinkTokens = new Map<
    string,
    { email: string; expiresAt: string; usedAt: string | null }
  >()
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
  private apiKeys = new Map<
    string,
    OrganizationApiKey & { organizationId: string; tokenHash: string }
  >()

  async getUser(userId: string): Promise<AuthUser | null> {
    return this.users.get(userId) ?? null
  }

  async upsertGoogleUser(input: GoogleAccountUserInput): Promise<AuthUser> {
    const email = input.email.toLowerCase()
    const existingBySubjectId = this.googleSubjectUserIds.get(input.googleSubject)
    const existingByEmailId = this.emailUserIds.get(email)
    const id = existingBySubjectId ?? existingByEmailId ?? newId("user")
    const existingUser = this.users.get(id)

    if (
      existingByEmailId &&
      existingBySubjectId &&
      existingByEmailId !== existingBySubjectId
    ) {
      throw new ApiError(
        "AUTH_EMAIL_ALREADY_LINKED",
        "That email is already linked to another Google account.",
        409,
      )
    }

    const user = authUserSchema.parse({
      id,
      email,
      name: input.name,
      picture: input.picture,
    })

    if (existingUser) {
      this.emailUserIds.delete(existingUser.email.toLowerCase())
    }
    this.googleSubjectUserIds.set(input.googleSubject, id)
    this.emailUserIds.set(email, id)
    this.users.set(id, user)

    return user
  }

  async upsertEmailUser(email: string): Promise<AuthUser> {
    const normalizedEmail = email.toLowerCase()
    const id = this.emailUserIds.get(normalizedEmail) ?? newId("user")
    const existing = this.users.get(id)
    const user = authUserSchema.parse({
      id,
      email: normalizedEmail,
      name: existing?.name ?? normalizedEmail,
      picture: existing?.picture,
    })

    this.emailUserIds.set(normalizedEmail, id)
    this.users.set(id, user)

    return user
  }

  async createMagicLinkToken(input: {
    email: string
    tokenHash: string
    expiresAt: Date
  }): Promise<void> {
    this.magicLinkTokens.set(input.tokenHash, {
      email: input.email.toLowerCase(),
      expiresAt: input.expiresAt.toISOString(),
      usedAt: null,
    })
  }

  async consumeMagicLinkToken(input: {
    tokenHash: string
    now: Date
  }): Promise<AuthUser> {
    const token = this.magicLinkTokens.get(input.tokenHash)

    if (
      !token ||
      token.usedAt ||
      Date.parse(token.expiresAt) <= input.now.getTime()
    ) {
      throw new ApiError(
        "MAGIC_LINK_INVALID",
        "This sign-in link is no longer valid.",
        400,
      )
    }

    this.magicLinkTokens.set(input.tokenHash, {
      ...token,
      usedAt: input.now.toISOString(),
    })

    return this.upsertEmailUser(token.email)
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
      for (const [id, apiKey] of this.apiKeys) {
        if (apiKey.organizationId === organizationId) {
          this.apiKeys.delete(id)
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

  async listOrganizationApiKeys(
    organizationId: string,
  ): Promise<OrganizationApiKey[]> {
    return Array.from(this.apiKeys.values())
      .filter((apiKey) => apiKey.organizationId === organizationId)
      .map(({ tokenHash: _tokenHash, ...apiKey }) =>
        organizationApiKeySchema.parse(apiKey),
      )
  }

  async createOrganizationApiKey(input: {
    organizationId: string
    createdByUserId: string
    name: string
    tokenHash: string
    keyPrefix: string
  }): Promise<OrganizationApiKey> {
    const creator = this.users.get(input.createdByUserId)
    if (!creator) {
      throw new ApiError("USER_NOT_FOUND", "Creating user was not found.", 404)
    }

    const apiKey = organizationApiKeySchema.parse({
      id: newId("apikey"),
      name: input.name,
      keyPrefix: input.keyPrefix,
      createdByUserId: input.createdByUserId,
      createdByName: creator.name,
      createdAt: now(),
    })

    this.apiKeys.set(apiKey.id, {
      ...apiKey,
      organizationId: input.organizationId,
      tokenHash: input.tokenHash,
    })

    return apiKey
  }

  async deleteOrganizationApiKey(
    organizationId: string,
    apiKeyId: string,
  ): Promise<boolean> {
    const apiKey = this.apiKeys.get(apiKeyId)

    if (!apiKey || apiKey.organizationId !== organizationId) {
      return false
    }

    return this.apiKeys.delete(apiKeyId)
  }

  async getApiKeyOrganizationId(tokenHash: string): Promise<string | null> {
    const apiKey = Array.from(this.apiKeys.values()).find(
      (current) => current.tokenHash === tokenHash,
    )

    return apiKey?.organizationId ?? null
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
