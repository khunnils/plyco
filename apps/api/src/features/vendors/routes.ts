import {
  businessActivityInputSchema,
  serviceProviderUsageInputSchema,
  organizationProviderInputSchema,
  providerLookupInputSchema,
} from "@plyco/shared"
import { type FastifyInstance } from "fastify"

import { requireApiKey } from "../../infrastructure/api-key-auth.js"
import { ApiError } from "../../infrastructure/errors.js"
import { requireOrganizationMembership } from "../../infrastructure/organization-context.js"
import { type ProviderImportService } from "./provider-import.js"
import { type ProviderSource } from "../../infrastructure/providers.js"
import { type ProviderLookupService } from "./provider-lookup.js"
import { type AccountRepository } from "../accounts/repository.js"
import { type VocabularyRepository } from "../vocabulary/repository.js"
import {
  validateBusinessActivityCodes,
  validateServiceProviderUsageCodes,
  validateOrganizationProviderCodes,
} from "../vocabulary/validation.js"
import { type ProviderRepository } from "./repository.js"

export async function registerVendorRoutes(
  app: FastifyInstance,
  {
    providerSource,
    providerLookupService,
    providerImportService,
    providerLookupApiKey,
    providerRepository,
    accountRepository,
    vocabularyRepository,
  }: {
    accountRepository: AccountRepository
    providerSource: ProviderSource
    providerLookupService: ProviderLookupService
    providerImportService: ProviderImportService
    providerLookupApiKey?: string
    providerRepository: ProviderRepository
    vocabularyRepository: VocabularyRepository
  },
) {
  app.get("/providers", async () => providerSource.listProviders())

  app.post("/providers/lookup", async (request, reply) => {
    requireApiKey(request, providerLookupApiKey)
    const body = providerLookupInputSchema.parse(request.body)
    const result = await providerLookupService.lookup(body.inputUrl)

    return reply.send(result)
  })

  app.post("/providers/import", async (request, reply) => {
    requireApiKey(request, providerLookupApiKey)
    const body = providerLookupInputSchema.parse(request.body)
    const result = await providerImportService.importProvider(body.inputUrl)

    return reply.send(result)
  })

  app.get<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/business-activities",
    async (request) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )

      return providerRepository.listBusinessActivities(request.params.organizationId)
    },
  )

  app.post<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/business-activities",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )
      const body = businessActivityInputSchema.parse(request.body)
      await validateBusinessActivityCodes(
        vocabularyRepository,
        request.params.organizationId,
        body,
      )
      const activity = await providerRepository.createBusinessActivity(
        request.params.organizationId,
        body,
      )

      return reply.status(201).send(activity)
    },
  )

  app.put<{ Params: { organizationId: string; id: string } }>(
    "/organizations/:organizationId/business-activities/:id",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )
      const body = businessActivityInputSchema.parse(request.body)
      await validateBusinessActivityCodes(
        vocabularyRepository,
        request.params.organizationId,
        body,
      )
      const activity = await providerRepository.updateBusinessActivity(
        request.params.organizationId,
        request.params.id,
        body,
      )

      if (!activity) {
        throw new ApiError(
          "BUSINESS_ACTIVITY_NOT_FOUND",
          "Business activity was not found.",
          404,
        )
      }

      return reply.send(activity)
    },
  )

  app.delete<{ Params: { organizationId: string; id: string } }>(
    "/organizations/:organizationId/business-activities/:id",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )
      const deleted = await providerRepository.deleteBusinessActivity(
        request.params.organizationId,
        request.params.id,
      )

      if (!deleted) {
        throw new ApiError(
          "BUSINESS_ACTIVITY_NOT_FOUND",
          "Business activity was not found.",
          404,
        )
      }

      return reply.status(204).send()
    },
  )

  app.get<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/organization-providers",
    async (request) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )

      return providerRepository.listOrganizationProviders(request.params.organizationId)
    },
  )

  app.post<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/organization-providers/resolve",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )
      const body = providerLookupInputSchema.parse(request.body)
      const result = await providerLookupService.lookup(body.inputUrl)

      return reply.send(result)
    },
  )

  app.post<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/organization-providers",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )
      const body = organizationProviderInputSchema.parse(request.body)
      await validateOrganizationProviderCodes(
        vocabularyRepository,
        request.params.organizationId,
        body,
      )
      const provider = await providerRepository.createOrganizationProvider(
        request.params.organizationId,
        body,
      )

      return reply.status(201).send(provider)
    },
  )

  app.put<{ Params: { organizationId: string; id: string } }>(
    "/organizations/:organizationId/organization-providers/:id",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )
      const body = organizationProviderInputSchema.parse(request.body)
      await validateOrganizationProviderCodes(
        vocabularyRepository,
        request.params.organizationId,
        body,
      )
      const provider = await providerRepository.updateOrganizationProvider(
        request.params.organizationId,
        request.params.id,
        body,
      )

      if (!provider) {
        throw new ApiError("PROVIDER_NOT_FOUND", "Provider was not found.", 404)
      }

      return reply.send(provider)
    },
  )

  app.delete<{ Params: { organizationId: string; id: string } }>(
    "/organizations/:organizationId/organization-providers/:id",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )
      const deleted = await providerRepository.deleteOrganizationProvider(
        request.params.organizationId,
        request.params.id,
      )

      if (!deleted) {
        throw new ApiError("PROVIDER_NOT_FOUND", "Provider was not found.", 404)
      }

      return reply.status(204).send()
    },
  )

  app.get<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/service-provider-usage",
    async (request) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )

      return providerRepository.listServiceProviderUsage(request.params.organizationId)
    },
  )

  app.post<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/service-provider-usage",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )
      const body = serviceProviderUsageInputSchema.parse(request.body)
      await validateServiceProviderUsageCodes(
        vocabularyRepository,
        request.params.organizationId,
        body,
      )
      const providerUsage = await providerRepository.createServiceProviderUsage(
        request.params.organizationId,
        body,
      )

      return reply.status(201).send(providerUsage)
    },
  )

  app.put<{ Params: { organizationId: string; id: string } }>(
    "/organizations/:organizationId/service-provider-usage/:id",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )
      const body = serviceProviderUsageInputSchema.parse(request.body)
      await validateServiceProviderUsageCodes(
        vocabularyRepository,
        request.params.organizationId,
        body,
      )
      const providerUsage = await providerRepository.updateServiceProviderUsage(
        request.params.organizationId,
        request.params.id,
        body,
      )

      if (!providerUsage) {
        throw new ApiError(
          "SERVICE_PROVIDER_USAGE_NOT_FOUND",
          "Service provider usage was not found.",
          404,
        )
      }

      return reply.send(providerUsage)
    },
  )

  app.delete<{ Params: { organizationId: string; id: string } }>(
    "/organizations/:organizationId/service-provider-usage/:id",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      )
      const deleted = await providerRepository.deleteServiceProviderUsage(
        request.params.organizationId,
        request.params.id,
      )

      if (!deleted) {
        throw new ApiError(
          "SERVICE_PROVIDER_USAGE_NOT_FOUND",
          "Service provider usage was not found.",
          404,
        )
      }

      return reply.status(204).send()
    },
  )
}
