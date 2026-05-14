import {
  accessProfileSchema,
  companyProfileSchema,
  dataHandlingProfileSchema,
  infrastructureProfileSchema,
} from "@complyflow/shared"
import { type FastifyInstance } from "fastify"
import { z } from "zod"

import { requireOrganizationMembership } from "../../organization-context.js"
import { type AccountRepository } from "../accounts/repository.js"
import { type ProviderSource } from "../../providers.js"
import { type VendorRepository } from "../vendors/repository.js"
import { type OrganizationRepository } from "./repository.js"

const securityProfileBodySchema = z.object({
  company: companyProfileSchema,
  infrastructure: infrastructureProfileSchema,
  dataHandling: dataHandlingProfileSchema,
  access: accessProfileSchema,
})

export async function registerOrganizationRoutes(
  app: FastifyInstance,
  {
    organizationRepository,
    providerSource,
    vendorRepository,
    accountRepository,
  }: {
    accountRepository: AccountRepository
    organizationRepository: OrganizationRepository
    providerSource: ProviderSource
    vendorRepository: VendorRepository
  },
) {
  app.get<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/security-profile",
    async (request) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )

      return {
        organization: await organizationRepository.getOrganization(
          request.params.organizationId,
        ),
        vendors: await vendorRepository.listVendors(
          request.params.organizationId,
        ),
      }
    },
  )

  app.put<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/security-profile",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )
      const body = securityProfileBodySchema.parse(request.body)
      const organization = await organizationRepository.upsertProfile(
        request.params.organizationId,
        body,
        body.infrastructure.organizationProviders.length > 0
          ? await providerSource.listProviders()
          : [],
      )
      const vendors = await vendorRepository.listVendors(
        request.params.organizationId,
      )

      return reply.send({ organization, vendors })
    },
  )
}
