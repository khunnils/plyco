import { type FastifyRequest } from "fastify"

import { getSessionUser } from "./auth.js"
import { ApiError } from "./errors.js"
import { type AccountRepository } from "../features/accounts/repository.js"

export async function requireOrganizationMembership(
  request: FastifyRequest,
  accountRepository: AccountRepository,
  organizationId: string,
) {
  if (request.organizationApiKeyOrgId === organizationId) {
    return
  }

  const user = getSessionUser(request)

  if (!user) {
    if (!request.session) {
      return
    }

    throw new ApiError(
      "AUTHENTICATION_REQUIRED",
      "Authentication is required.",
      401,
    )
  }

  const role = await accountRepository.getMembershipRole(user.id, organizationId)

  if (!role) {
    throw new ApiError(
      "ORGANIZATION_ACCESS_DENIED",
      "You do not have access to this organization.",
      403,
    )
  }
}
