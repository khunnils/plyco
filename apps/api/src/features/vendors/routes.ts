import { vendorInputSchema } from "@complyflow/shared"
import { type FastifyInstance } from "fastify"

import { ApiError } from "../../errors.js"
import { requireOrganizationMembership } from "../../organization-context.js"
import { type AccountRepository } from "../accounts/repository.js"
import { type ProviderSource } from "../../providers.js"
import { type VocabularyRepository } from "../vocabulary/repository.js"
import { validateVendorCodes } from "../vocabulary/validation.js"
import { type VendorRepository } from "./repository.js"

export async function registerVendorRoutes(
  app: FastifyInstance,
  {
    providerSource,
    vendorRepository,
    accountRepository,
    vocabularyRepository,
  }: {
    accountRepository: AccountRepository
    providerSource: ProviderSource
    vendorRepository: VendorRepository
    vocabularyRepository: VocabularyRepository
  },
) {
  app.get("/providers", async () => providerSource.listProviders())

  app.get<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/vendors",
    async (request) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )

      return vendorRepository.listVendors(request.params.organizationId)
    },
  )

  app.post<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/vendors",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )
      const body = vendorInputSchema.parse(request.body)
      await validateVendorCodes(
        vocabularyRepository,
        request.params.organizationId,
        body,
      )
      const vendor = await vendorRepository.createVendor(
        request.params.organizationId,
        body,
      )

      return reply.status(201).send(vendor)
    },
  )

  app.put<{ Params: { organizationId: string; id: string } }>(
    "/organizations/:organizationId/vendors/:id",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )
      const body = vendorInputSchema.parse(request.body)
      await validateVendorCodes(
        vocabularyRepository,
        request.params.organizationId,
        body,
      )
      const vendor = await vendorRepository.updateVendor(
        request.params.organizationId,
        request.params.id,
        body,
      )

      if (!vendor) {
        throw new ApiError("VENDOR_NOT_FOUND", "Vendor was not found.", 404)
      }

      return reply.send(vendor)
    },
  )

  app.delete<{ Params: { organizationId: string; id: string } }>(
    "/organizations/:organizationId/vendors/:id",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )
      const deleted = await vendorRepository.deleteVendor(
        request.params.organizationId,
        request.params.id,
      )

      if (!deleted) {
        throw new ApiError("VENDOR_NOT_FOUND", "Vendor was not found.", 404)
      }

      return reply.status(204).send()
    },
  )
}
