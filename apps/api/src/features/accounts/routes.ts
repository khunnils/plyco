import {
  acceptOrganizationInvitationSchema,
  createOrganizationSchema,
  deleteOrganizationResponseSchema,
  organizationInvitationInputSchema,
  organizationInvitationSchema,
  organizationMemberRoleUpdateSchema,
  organizationMemberSchema,
} from "@plyco/shared"
import { createHash, randomBytes } from "node:crypto"
import { type FastifyInstance, type FastifyRequest } from "fastify"
import { z } from "zod"

import { getPersistedSessionUser } from "../../infrastructure/auth.js"
import { ApiError } from "../../infrastructure/errors.js"
import { requireOrganizationMembership } from "../../infrastructure/organization-context.js"
import { type AccountRepository } from "./repository.js"
import { type VocabularyRepository } from "../vocabulary/repository.js"
import { type InvitationEmailSender } from "./invitation-email.js"

export async function registerAccountRoutes(
  app: FastifyInstance,
  {
    accountRepository,
    clientUrl,
    invitationEmailSender,
    vocabularyRepository,
  }: {
    accountRepository: AccountRepository
    clientUrl: string
    invitationEmailSender: InvitationEmailSender
    vocabularyRepository: VocabularyRepository
  },
) {
  app.post("/organizations", async (request, reply) => {
    const user = await getPersistedSessionUser(request, accountRepository)

    if (!user) {
      throw new ApiError(
        "AUTHENTICATION_REQUIRED",
        "Authentication is required.",
        401,
      )
    }

    const body = createOrganizationSchema.parse(request.body)
    const organization = await accountRepository.createOrganization(
      user.id,
      body,
    )
    await vocabularyRepository.cloneOrganizationVocabulary(organization.id)

    return reply.status(201).send(organization)
  })

  app.get<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/members",
    async (request) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )

      return accountRepository.listOrganizationMembers(
        request.params.organizationId,
      )
    },
  )

  app.get<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/invitations",
    async (request) => {
      await requireOrganizationOwner(
        request,
        accountRepository,
        request.params.organizationId,
      )

      return accountRepository.listOrganizationInvitations(
        request.params.organizationId,
      )
    },
  )

  app.post<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/invitations",
    async (request, reply) => {
      const user = await requireOrganizationOwner(
        request,
        accountRepository,
        request.params.organizationId,
      )
      const body = organizationInvitationInputSchema.parse(request.body)
      const token = randomBytes(32).toString("base64url")
      const tokenHash = hashInvitationToken(token)
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      const invitation =
        await accountRepository.createOrganizationInvitation({
          organizationId: request.params.organizationId,
          invitedByUserId: user.id,
          invitation: body,
          tokenHash,
          expiresAt,
        })
      const organization = (await accountRepository.listOrganizations(user.id))
        .find((current) => current.id === request.params.organizationId)

      try {
        await invitationEmailSender.sendInvitation({
          organizationName: organization?.name ?? "your Plyco workspace",
          invitedByName: user.name,
          email: invitation.email,
          role: invitation.role,
          joinUrl: `${clientUrl.replace(/\/$/, "")}/invites/${token}`,
        })
      } catch (error) {
        await accountRepository.cancelOrganizationInvitation(
          request.params.organizationId,
          invitation.id,
        )
        throw error
      }

      return reply.status(201).send(organizationInvitationSchema.parse(invitation))
    },
  )

  app.delete<{
    Params: { organizationId: string; invitationId: string }
  }>(
    "/organizations/:organizationId/invitations/:invitationId",
    async (request, reply) => {
      await requireOrganizationOwner(
        request,
        accountRepository,
        request.params.organizationId,
      )

      const deleted = await accountRepository.cancelOrganizationInvitation(
        request.params.organizationId,
        request.params.invitationId,
      )

      if (!deleted) {
        throw new ApiError(
          "ORGANIZATION_INVITATION_NOT_FOUND",
          "Invitation not found.",
          404,
        )
      }

      return reply.status(204).send()
    },
  )

  app.patch<{
    Params: { organizationId: string; userId: string }
  }>(
    "/organizations/:organizationId/members/:userId",
    async (request) => {
      await requireOrganizationOwner(
        request,
        accountRepository,
        request.params.organizationId,
      )

      const body = organizationMemberRoleUpdateSchema.parse(request.body)
      const member = await accountRepository.updateOrganizationMemberRole(
        request.params.organizationId,
        request.params.userId,
        body,
      )

      if (!member) {
        throw new ApiError(
          "ORGANIZATION_MEMBER_NOT_FOUND",
          "Organization member not found.",
          404,
        )
      }

      return organizationMemberSchema.parse(member)
    },
  )

  app.delete<{
    Params: { organizationId: string; userId: string }
  }>(
    "/organizations/:organizationId/members/:userId",
    async (request, reply) => {
      await requireOrganizationOwner(
        request,
        accountRepository,
        request.params.organizationId,
      )

      const deleted = await accountRepository.removeOrganizationMember(
        request.params.organizationId,
        request.params.userId,
      )

      if (!deleted) {
        throw new ApiError(
          "ORGANIZATION_MEMBER_NOT_FOUND",
          "Organization member not found.",
          404,
        )
      }

      return reply.status(204).send()
    },
  )

  app.delete<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId",
    async (request) => {
      await requireOrganizationOwner(
        request,
        accountRepository,
        request.params.organizationId,
      )

      const deleted = await accountRepository.deleteOrganization(
        request.params.organizationId,
      )

      if (!deleted) {
        throw new ApiError("ORGANIZATION_NOT_FOUND", "Organization not found.", 404)
      }

      return deleteOrganizationResponseSchema.parse({ deleted: true })
    },
  )

  app.post<{ Params: { token: string } }>(
    "/invitations/:token/accept",
    async (request) => {
      const user = await getPersistedSessionUser(request, accountRepository)

      if (!user) {
        throw new ApiError(
          "AUTHENTICATION_REQUIRED",
          "Authentication is required.",
          401,
        )
      }

      const params = z.object({ token: z.string().min(20) }).parse(request.params)
      const organization = await accountRepository.acceptOrganizationInvitation({
        tokenHash: hashInvitationToken(params.token),
        userId: user.id,
        email: user.email,
        now: new Date(),
      })

      return acceptOrganizationInvitationSchema.parse({ organization })
    },
  )
}

const hashInvitationToken = (token: string) =>
  createHash("sha256").update(token).digest("hex")

const requireOrganizationOwner = async (
  request: FastifyRequest,
  accountRepository: AccountRepository,
  organizationId: string,
) => {
  const user = await getPersistedSessionUser(request, accountRepository)

  if (!user) {
    throw new ApiError(
      "AUTHENTICATION_REQUIRED",
      "Authentication is required.",
      401,
    )
  }

  const role = await accountRepository.getMembershipRole(user.id, organizationId)

  if (role !== "owner") {
    throw new ApiError(
      "ORGANIZATION_OWNER_REQUIRED",
      "Only organization owners can manage team members.",
      403,
    )
  }

  return user
}
