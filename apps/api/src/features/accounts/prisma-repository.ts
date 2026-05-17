import { prisma, type PrismaClient } from "@complyflow/db"
import {
  authUserSchema,
  organizationMembershipRoleSchema,
  organizationSummarySchema,
  type AuthUser,
  type CreateOrganization,
  type OrganizationMembershipRole,
  type OrganizationSummary,
} from "@complyflow/shared"

import {
  type AccountRepository,
  type AccountUserInput,
} from "./repository.js"

const toIsoString = (value: Date) => value.toISOString()

const DEFAULT_PROFILE = {
  legalEntityName: "",
  website: "",
  contactEmail: "",
  securityContactEmail: "",
  privacyContactEmail: "",
  country: "",
  address: "",
  employeeCount: 1,
  industries: [],
  regions: [],
  handlesPii: false,
  handlesSensitiveData: false,
  complianceGoals: [],
}

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

  async createOrganization(
    userId: string,
    input: CreateOrganization,
  ): Promise<OrganizationSummary> {
    const organization = await this.client.organization.create({
      data: {
        companyName: input.name,
        ...DEFAULT_PROFILE,
        accessProfile: {
          create: {
            mfaRequired: false,
            ssoEnabled: false,
            sharedAccountsExist: false,
            offboardingProcessExists: false,
            accessReviewsPerformed: false,
            privilegedAccessRestricted: false,
          },
        },
        dataHandlingProfile: {
          create: {
            storesPii: false,
            storesHealthcareData: false,
            encryptionAtRest: false,
            encryptionInTransit: false,
            productionDataInDevelopment: false,
            retentionPolicyExists: false,
          },
        },
        infrastructureProfile: {
          create: {
            mfaEnabled: false,
            encryptedDevicesRequired: false,
            backupsEnabled: false,
            centralizedLoggingEnabled: false,
          },
        },
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
