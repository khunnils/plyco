import { prisma, type PrismaClient } from "@plyco/db"
import {
  authUserSchema,
  organizationMemberSchema,
  organizationMembershipRoleSchema,
  organizationSummarySchema,
  type AuthUser,
  type CreateOrganization,
  type OrganizationMember,
  type OrganizationMembershipRole,
  type OrganizationSummary,
} from "@plyco/shared"

import {
  type AccountRepository,
  type AccountUserInput,
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

  async upsertUser(input: AccountUserInput): Promise<AuthUser> {
    const user = await this.client.user.upsert({
      where: { googleSubject: input.googleSubject },
      create: {
        googleSubject: input.googleSubject,
        email: input.email,
        name: input.name,
        picture: input.picture,
      },
      update: {
        email: input.email,
        name: input.name,
        picture: input.picture,
      },
    })

    return authUserSchema.parse({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture ?? undefined,
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
      }),
    )
  }

  async createOrganization(
    userId: string,
    input: CreateOrganization,
  ): Promise<OrganizationSummary> {
    const organization = await this.client.organization.create({
      data: {
        companyName: input.name,
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
}
