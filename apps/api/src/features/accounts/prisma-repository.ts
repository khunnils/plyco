import { Prisma, prisma, type PrismaClient } from "@plyco/db"
import {
  authUserSchema,
  organizationApiKeySchema,
  organizationInvitationSchema,
  organizationMemberSchema,
  organizationMembershipRoleSchema,
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

const toIsoString = (value: Date) => value.toISOString()

export class PrismaAccountRepository implements AccountRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async getUser(userId: string): Promise<AuthUser | null> {
    const user = await this.client.user.findUnique({
      where: { id: userId },
    })

    return user
      ? authUserSchema.parse({
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture ?? undefined,
        })
      : null
  }

  async upsertGoogleUser(input: GoogleAccountUserInput): Promise<AuthUser> {
    const email = input.email.toLowerCase()

    const user = await this.client.$transaction(async (transaction) => {
      const existingBySubject = await transaction.user.findUnique({
        where: { googleSubject: input.googleSubject },
      })

      if (existingBySubject) {
        return transaction.user.update({
          where: { id: existingBySubject.id },
          data: {
            email,
            name: input.name,
            picture: input.picture,
          },
        })
      }

      const existingByEmail = await transaction.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
      })

      if (existingByEmail) {
        if (
          existingByEmail.googleSubject &&
          existingByEmail.googleSubject !== input.googleSubject
        ) {
          throw new ApiError(
            "AUTH_EMAIL_ALREADY_LINKED",
            "That email is already linked to another Google account.",
            409,
          )
        }

        return transaction.user.update({
          where: { id: existingByEmail.id },
          data: {
            googleSubject: input.googleSubject,
            email,
            name: input.name,
            picture: input.picture,
          },
        })
      }

      return transaction.user.create({
        data: {
          googleSubject: input.googleSubject,
          email,
          name: input.name,
          picture: input.picture,
        },
      })
    })

    return authUserSchema.parse({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture ?? undefined,
    })
  }

  async upsertEmailUser(email: string): Promise<AuthUser> {
    const normalizedEmail = email.toLowerCase()
    const existing = await this.client.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    })

    const user = existing
      ? await this.client.user.update({
          where: { id: existing.id },
          data: { email: normalizedEmail },
        })
      : await this.client.user.create({
          data: {
            email: normalizedEmail,
            name: normalizedEmail,
          },
        })

    return authUserSchema.parse({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture ?? undefined,
    })
  }

  async createMagicLinkToken(input: {
    email: string
    tokenHash: string
    expiresAt: Date
  }): Promise<void> {
    await this.client.magicLinkToken.create({
      data: {
        email: input.email.toLowerCase(),
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      },
    })
  }

  async consumeMagicLinkToken(input: {
    tokenHash: string
    now: Date
  }): Promise<AuthUser> {
    return this.client.$transaction(async (transaction) => {
      const token = await transaction.magicLinkToken.findUnique({
        where: { tokenHash: input.tokenHash },
      })

      if (!token || token.usedAt || token.expiresAt <= input.now) {
        throw new ApiError(
          "MAGIC_LINK_INVALID",
          "This sign-in link is no longer valid.",
          400,
        )
      }

      await transaction.magicLinkToken.update({
        where: { id: token.id },
        data: { usedAt: input.now },
      })

      const existing = await transaction.user.findFirst({
        where: { email: { equals: token.email, mode: "insensitive" } },
      })
      const user = existing
        ? await transaction.user.update({
            where: { id: existing.id },
            data: { email: token.email.toLowerCase() },
          })
        : await transaction.user.create({
            data: {
              email: token.email.toLowerCase(),
              name: token.email.toLowerCase(),
            },
          })

      return authUserSchema.parse({
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture ?? undefined,
      })
    })
  }

  async listOrganizations(userId: string): Promise<OrganizationSummary[]> {
    const memberships = await this.client.organizationMembership.findMany({
      where: { userId },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    })

    return memberships.map((membership) =>
      organizationSummarySchema.parse({
        id: membership.organization.id,
        name: membership.organization.companyName,
        role: membership.role,
        createdAt: toIsoString(membership.organization.createdAt),
        updatedAt: toIsoString(membership.organization.updatedAt),
      }),
    )
  }

  async listOrganizationMembers(
    organizationId: string,
  ): Promise<OrganizationMember[]> {
    const memberships = await this.client.organizationMembership.findMany({
      where: { organizationId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    })

    return memberships.map((membership) =>
      organizationMemberSchema.parse({
        userId: membership.user.id,
        name: membership.user.name,
          email: membership.user.email,
          role: membership.role,
          createdAt: toIsoString(membership.createdAt),
        }),
    )
  }

  async listOrganizationInvitations(
    organizationId: string,
  ): Promise<OrganizationInvitation[]> {
    const invitations = await this.client.organizationInvitation.findMany({
      where: {
        organizationId,
        acceptedAt: null,
        canceledAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { invitedByUser: true },
      orderBy: { createdAt: "asc" },
    })

    return invitations.map((invitation) =>
      organizationInvitationSchema.parse({
        id: invitation.id,
        organizationId: invitation.organizationId,
        email: invitation.email,
        role: invitation.role,
        invitedByUserId: invitation.invitedByUserId,
        invitedByName: invitation.invitedByUser.name,
        expiresAt: toIsoString(invitation.expiresAt),
        createdAt: toIsoString(invitation.createdAt),
      }),
    )
  }

  async createOrganizationInvitation(input: {
    organizationId: string
    invitedByUserId: string
    invitation: OrganizationInvitationInput
    tokenHash: string
    expiresAt: Date
  }): Promise<OrganizationInvitation> {
    const existingMember = await this.client.organizationMembership.findFirst({
      where: {
        organizationId: input.organizationId,
        user: { email: { equals: input.invitation.email, mode: "insensitive" } },
      },
      select: { id: true },
    })

    if (existingMember) {
      throw new ApiError(
        "ORGANIZATION_MEMBER_ALREADY_EXISTS",
        "That email already belongs to this organization.",
        409,
      )
    }

    const existingInvitation =
      await this.client.organizationInvitation.findFirst({
        where: {
          organizationId: input.organizationId,
          email: { equals: input.invitation.email, mode: "insensitive" },
          acceptedAt: null,
          canceledAt: null,
          expiresAt: { gt: new Date() },
        },
        select: { id: true },
      })

    if (existingInvitation) {
      throw new ApiError(
        "ORGANIZATION_INVITATION_ALREADY_EXISTS",
        "That email already has a pending invitation.",
        409,
      )
    }

    const invitation = await this.client.organizationInvitation.create({
      data: {
        organizationId: input.organizationId,
        email: input.invitation.email,
        role: input.invitation.role,
        tokenHash: input.tokenHash,
        invitedByUserId: input.invitedByUserId,
        expiresAt: input.expiresAt,
      },
      include: { invitedByUser: true },
    })

    return organizationInvitationSchema.parse({
      id: invitation.id,
      organizationId: invitation.organizationId,
      email: invitation.email,
      role: invitation.role,
      invitedByUserId: invitation.invitedByUserId,
      invitedByName: invitation.invitedByUser.name,
      expiresAt: toIsoString(invitation.expiresAt),
      createdAt: toIsoString(invitation.createdAt),
    })
  }

  async cancelOrganizationInvitation(
    organizationId: string,
    invitationId: string,
  ): Promise<boolean> {
    const result = await this.client.organizationInvitation.updateMany({
      where: {
        id: invitationId,
        organizationId,
        acceptedAt: null,
        canceledAt: null,
      },
      data: { canceledAt: new Date() },
    })

    return result.count > 0
  }

  async acceptOrganizationInvitation(input: {
    tokenHash: string
    userId: string
    email: string
    now: Date
  }): Promise<OrganizationSummary> {
    return this.client.$transaction(async (transaction) => {
      const invitation = await transaction.organizationInvitation.findUnique({
        where: { tokenHash: input.tokenHash },
        include: { organization: true },
      })

      if (!invitation || invitation.canceledAt || invitation.expiresAt <= input.now) {
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

      if (invitation.acceptedAt) {
        const existingMembership =
          await transaction.organizationMembership.findUnique({
            where: {
              userId_organizationId: {
                userId: input.userId,
                organizationId: invitation.organizationId,
              },
            },
          })

        if (existingMembership) {
          return organizationSummarySchema.parse({
            id: invitation.organization.id,
            name: invitation.organization.companyName,
            role: existingMembership.role,
            createdAt: toIsoString(invitation.organization.createdAt),
            updatedAt: toIsoString(invitation.organization.updatedAt),
          })
        }

        throw new ApiError(
          "ORGANIZATION_INVITATION_INVALID",
          "This invitation is no longer valid.",
          400,
        )
      }

      const membership = await transaction.organizationMembership.upsert({
        where: {
          userId_organizationId: {
            userId: input.userId,
            organizationId: invitation.organizationId,
          },
        },
        create: {
          userId: input.userId,
          organizationId: invitation.organizationId,
          role: invitation.role,
        },
        update: {},
      })

      await transaction.organizationInvitation.update({
        where: { id: invitation.id },
        data: {
          acceptedAt: input.now,
          acceptedByUserId: input.userId,
        },
      })

      return organizationSummarySchema.parse({
        id: invitation.organization.id,
        name: invitation.organization.companyName,
        role: membership.role,
        createdAt: toIsoString(invitation.organization.createdAt),
        updatedAt: toIsoString(invitation.organization.updatedAt),
      })
    })
  }

  async updateOrganizationMemberRole(
    organizationId: string,
    userId: string,
    input: OrganizationMemberRoleUpdate,
  ): Promise<OrganizationMember | null> {
    return this.client.$transaction(async (transaction) => {
      const membership = await transaction.organizationMembership.findUnique({
        where: { userId_organizationId: { userId, organizationId } },
        include: { user: true },
      })

      if (!membership) {
        return null
      }

      if (membership.role === "owner" && input.role !== "owner") {
        await ensureAnotherOwner(transaction, organizationId, userId)
      }

      const updated = await transaction.organizationMembership.update({
        where: { id: membership.id },
        data: { role: input.role },
        include: { user: true },
      })

      return organizationMemberSchema.parse({
        userId: updated.user.id,
        name: updated.user.name,
        email: updated.user.email,
        role: updated.role,
        createdAt: toIsoString(updated.createdAt),
      })
    })
  }

  async removeOrganizationMember(
    organizationId: string,
    userId: string,
  ): Promise<boolean> {
    return this.client.$transaction(async (transaction) => {
      const membership = await transaction.organizationMembership.findUnique({
        where: { userId_organizationId: { userId, organizationId } },
      })

      if (!membership) {
        return false
      }

      if (membership.role === "owner") {
        await ensureAnotherOwner(transaction, organizationId, userId)
      }

      await transaction.organizationMembership.delete({ where: { id: membership.id } })

      return true
    })
  }

  async deleteOrganization(organizationId: string): Promise<boolean> {
    try {
      await this.client.organization.delete({ where: { id: organizationId } })
      return true
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2025"
      ) {
        return false
      }

      throw error
    }
  }

  async createOrganization(
    userId: string,
    input: CreateOrganization,
  ): Promise<OrganizationSummary> {
    const organization = await this.client.organization.create({
      data: {
        companyName: input.name,
        website: input.website,
        memberships: {
          create: {
            userId,
            role: "owner",
          },
        },
      },
    })

    return organizationSummarySchema.parse({
      id: organization.id,
      name: organization.companyName,
      role: "owner",
      createdAt: toIsoString(organization.createdAt),
      updatedAt: toIsoString(organization.updatedAt),
    })
  }

  async getMembershipRole(
    userId: string,
    organizationId: string,
  ): Promise<OrganizationMembershipRole | null> {
    const membership = await this.client.organizationMembership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      select: { role: true },
    })

    if (!membership) {
      return null
    }

    return organizationMembershipRoleSchema.parse(membership.role)
  }

  async listOrganizationApiKeys(
    organizationId: string,
  ): Promise<OrganizationApiKey[]> {
    const apiKeys = await this.client.organizationApiKey.findMany({
      where: { organizationId },
      include: { createdByUser: true },
      orderBy: { createdAt: "asc" },
    })

    return apiKeys.map((apiKey) =>
      organizationApiKeySchema.parse({
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        createdByUserId: apiKey.createdByUserId,
        createdByName: apiKey.createdByUser.name,
        createdAt: toIsoString(apiKey.createdAt),
      }),
    )
  }

  async createOrganizationApiKey(input: {
    organizationId: string
    createdByUserId: string
    name: string
    tokenHash: string
    keyPrefix: string
  }): Promise<OrganizationApiKey> {
    const apiKey = await this.client.organizationApiKey.create({
      data: {
        organizationId: input.organizationId,
        createdByUserId: input.createdByUserId,
        name: input.name,
        tokenHash: input.tokenHash,
        keyPrefix: input.keyPrefix,
      },
      include: { createdByUser: true },
    })

    return organizationApiKeySchema.parse({
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      createdByUserId: apiKey.createdByUserId,
      createdByName: apiKey.createdByUser.name,
      createdAt: toIsoString(apiKey.createdAt),
    })
  }

  async deleteOrganizationApiKey(
    organizationId: string,
    apiKeyId: string,
  ): Promise<boolean> {
    const result = await this.client.organizationApiKey.deleteMany({
      where: { id: apiKeyId, organizationId },
    })

    return result.count > 0
  }

  async getApiKeyOrganizationId(tokenHash: string): Promise<string | null> {
    const apiKey = await this.client.organizationApiKey.findUnique({
      where: { tokenHash },
      select: { organizationId: true },
    })

    return apiKey?.organizationId ?? null
  }
}

const ensureAnotherOwner = async (
  transaction: Prisma.TransactionClient,
  organizationId: string,
  userId: string,
) => {
  const ownerCount = await transaction.organizationMembership.count({
    where: {
      organizationId,
      role: "owner",
      userId: { not: userId },
    },
  })

  if (ownerCount < 1) {
    throw new ApiError(
      "ORGANIZATION_REQUIRES_OWNER",
      "An organization must have at least one owner.",
      400,
    )
  }
}
