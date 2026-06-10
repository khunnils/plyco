import {
  accessProfileSchema,
  companyProfileSchema,
  dataHandlingProfileSchema,
  infrastructureProfileSchema,
  privacyProfileSchema,
  reorderEntitiesSchema,
  serviceProfileInputSchema,
} from "@plyco/shared";
import { type FastifyInstance } from "fastify";
import { z } from "zod";

import { requireOrganizationMembership } from "../../infrastructure/organization-context.js";
import { type AccountRepository } from "../accounts/repository.js";
import { type ProviderSource } from "../../infrastructure/providers.js";
import {
  validateAccessProfileCodes,
  validateCompanyProfileCodes,
  validateDataHandlingProfileCodes,
  validateInfrastructureProfileCodes,
  validatePrivacyProfileCodes,
  validateServiceProfileCodes,
} from "../vocabulary/validation.js";
import { type VocabularyRepository } from "../vocabulary/repository.js";
import { type ProviderRepository } from "../vendors/repository.js";
import { type OrganizationRepository } from "./repository.js";

const securityProfileBodySchema = z.object({
  company: companyProfileSchema,
  services: z
    .array(serviceProfileInputSchema)
    .min(1, "At least one service is required"),
  privacy: privacyProfileSchema,
  infrastructure: infrastructureProfileSchema,
  dataHandling: dataHandlingProfileSchema,
  access: accessProfileSchema,
});

export async function registerOrganizationRoutes(
  app: FastifyInstance,
  {
    organizationRepository,
    providerSource,
    vendorRepository,
    accountRepository,
    vocabularyRepository,
  }: {
    accountRepository: AccountRepository;
    organizationRepository: OrganizationRepository;
    providerSource: ProviderSource;
    vendorRepository: ProviderRepository;
    vocabularyRepository: VocabularyRepository;
  },
) {
  app.get<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/security-profile",
    async (request) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      );

      return {
        organization: await organizationRepository.getOrganization(
          request.params.organizationId,
        ),
        businessActivities: await vendorRepository.listBusinessActivities(
          request.params.organizationId,
        ),
        organizationProviders: await vendorRepository.listOrganizationProviders(
          request.params.organizationId,
        ),
        serviceProviderUsage: await vendorRepository.listServiceProviderUsage(
          request.params.organizationId,
        ),
      };
    },
  );

  app.put<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/security-profile",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      );
      const body = securityProfileBodySchema.parse(request.body);
      await validateCompanyProfileCodes(
        vocabularyRepository,
        request.params.organizationId,
        body.company,
      );
      await validateDataHandlingProfileCodes(
        vocabularyRepository,
        request.params.organizationId,
        body.dataHandling,
      );
      await Promise.all(
        body.services.map((service, index) =>
          validateServiceProfileCodes(
            vocabularyRepository,
            request.params.organizationId,
            service,
            `services.${index}`,
          ),
        ),
      );
      await validatePrivacyProfileCodes(
        vocabularyRepository,
        request.params.organizationId,
        body.privacy,
      );
      await validateInfrastructureProfileCodes(
        vocabularyRepository,
        request.params.organizationId,
        body.infrastructure,
      );
      await validateAccessProfileCodes(
        vocabularyRepository,
        request.params.organizationId,
        body.access,
      );
      const organization = await organizationRepository.upsertProfile(
        request.params.organizationId,
        body,
        body.infrastructure.organizationProviders.length > 0 ||
          body.privacy.organizationProviders.length > 0
          ? await providerSource.listProviders()
          : [],
      );
      const organizationProviders =
        await vendorRepository.listOrganizationProviders(
          request.params.organizationId,
        );
      const businessActivities = await vendorRepository.listBusinessActivities(
        request.params.organizationId,
      );
      const serviceProviderUsage =
        await vendorRepository.listServiceProviderUsage(
          request.params.organizationId,
        );

      return reply.send({
        organization,
        businessActivities,
        organizationProviders,
        serviceProviderUsage,
      });
    },
  );

  app.put<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/services/order",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      );
      const { ids } = reorderEntitiesSchema.parse(request.body);
      await organizationRepository.reorderServices(
        request.params.organizationId,
        ids,
      );
      return reply.status(204).send();
    },
  );

  app.put<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/data-types/order",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      );
      const { ids } = reorderEntitiesSchema.parse(request.body);
      await organizationRepository.reorderDataTypes(
        request.params.organizationId,
        ids,
      );
      return reply.status(204).send();
    },
  );
}
