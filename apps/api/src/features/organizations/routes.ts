import {
  accessProfileSchema,
  companyProfileSchema,
  dataHandlingProfileSchema,
  emptyAccessProfile,
  emptyCompanyProfile,
  emptyDataHandlingProfile,
  emptyInfrastructureProfile,
  emptyPrivacyProfile,
  emptySecurityProfile,
  emptyServiceProfile,
  infrastructureProfileSchema,
  type OrganizationSecurityProfile,
  securityProfileSchema,
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
  validateSecurityProfileCodes,
  validatePrivacyProfileCodes,
  validateServiceProfileCodes,
} from "../vocabulary/validation.js";
import { type VocabularyRepository } from "../vocabulary/repository.js";
import { type ProviderRepository } from "../vendors/repository.js";
import {
  type OrganizationRepository,
  type SecurityProfileInput,
} from "./repository.js";

const servicesProfileBodySchema = z
  .array(serviceProfileInputSchema)
  .min(1, "At least one service is required");

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
    "/organizations/:organizationId",
    async (request) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      );

      return organizationSnapshot(
        request.params.organizationId,
        organizationRepository,
        vendorRepository,
      );
    },
  );

  app.get<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/profile",
    async (request) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      );

      const organization = await organizationRepository.getOrganization(
        request.params.organizationId,
      );
      const input = profileInputFromOrganization(organization);

      return input.company;
    },
  );

  app.put<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/profile",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      );
      const body = companyProfileSchema.parse(request.body);
      await validateCompanyProfileCodes(
        vocabularyRepository,
        request.params.organizationId,
        body,
      );

      return reply.send(
        await updateOrganizationProfileSection(
          request.params.organizationId,
          organizationRepository,
          vendorRepository,
          providerSource,
          (current) => ({ ...current, company: body }),
        ),
      );
    },
  );

  app.get<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/services",
    async (request) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      );

      const organization = await organizationRepository.getOrganization(
        request.params.organizationId,
      );
      const input = profileInputFromOrganization(organization);

      return input.services;
    },
  );

  app.put<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/services",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      );
      const body = servicesProfileBodySchema.parse(request.body);
      await Promise.all(
        body.map((service, index) =>
          validateServiceProfileCodes(
            vocabularyRepository,
            request.params.organizationId,
            service,
            `services.${index}`,
          ),
        ),
      );

      return reply.send(
        await updateOrganizationProfileSection(
          request.params.organizationId,
          organizationRepository,
          vendorRepository,
          providerSource,
          (current) => ({ ...current, services: body }),
        ),
      );
    },
  );

  app.get<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/data",
    async (request) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      );

      const organization = await organizationRepository.getOrganization(
        request.params.organizationId,
      );
      const input = profileInputFromOrganization(organization);

      return input.dataHandling;
    },
  );

  app.put<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/data",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      );
      const body = dataHandlingProfileSchema.parse(request.body);
      await validateDataHandlingProfileCodes(
        vocabularyRepository,
        request.params.organizationId,
        body,
      );

      return reply.send(
        await updateOrganizationProfileSection(
          request.params.organizationId,
          organizationRepository,
          vendorRepository,
          providerSource,
          (current) => ({ ...current, dataHandling: body }),
        ),
      );
    },
  );

  app.get<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/privacy",
    async (request) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      );

      const organization = await organizationRepository.getOrganization(
        request.params.organizationId,
      );
      const input = profileInputFromOrganization(organization);

      return input.privacy;
    },
  );

  app.put<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/privacy",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      );
      const body = privacyProfileSchema.parse(request.body);
      await validatePrivacyProfileCodes(
        vocabularyRepository,
        request.params.organizationId,
        body,
      );

      return reply.send(
        await updateOrganizationProfileSection(
          request.params.organizationId,
          organizationRepository,
          vendorRepository,
          providerSource,
          (current) => ({ ...current, privacy: body }),
        ),
      );
    },
  );

  app.get<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/infrastructure",
    async (request) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      );

      const organization = await organizationRepository.getOrganization(
        request.params.organizationId,
      );
      const input = profileInputFromOrganization(organization);

      return input.infrastructure;
    },
  );

  app.put<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/infrastructure",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      );
      const body = infrastructureProfileSchema.parse(request.body);
      await validateInfrastructureProfileCodes(
        vocabularyRepository,
        request.params.organizationId,
        body,
      );

      return reply.send(
        await updateOrganizationProfileSection(
          request.params.organizationId,
          organizationRepository,
          vendorRepository,
          providerSource,
          (current) => ({ ...current, infrastructure: body }),
        ),
      );
    },
  );

  app.get<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/security",
    async (request) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      );

      const organization = await organizationRepository.getOrganization(
        request.params.organizationId,
      );
      const input = profileInputFromOrganization(organization);

      return input.security;
    },
  );

  app.put<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/security",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      );
      const body = securityProfileSchema.parse(request.body);
      await validateSecurityProfileCodes(
        vocabularyRepository,
        request.params.organizationId,
        body,
      );

      return reply.send(
        await updateOrganizationProfileSection(
          request.params.organizationId,
          organizationRepository,
          vendorRepository,
          providerSource,
          (current) => ({ ...current, security: body }),
        ),
      );
    },
  );

  app.get<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/access",
    async (request) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      );

      const organization = await organizationRepository.getOrganization(
        request.params.organizationId,
      );
      const input = profileInputFromOrganization(organization);

      return input.access;
    },
  );

  app.put<{ Params: { organizationId: string } }>(
    "/organizations/:organizationId/access",
    async (request, reply) => {
      await requireOrganizationMembership(
        request,
        accountRepository,
        request.params.organizationId,
      );
      const body = accessProfileSchema.parse(request.body);
      await validateAccessProfileCodes(
        vocabularyRepository,
        request.params.organizationId,
        body,
      );

      return reply.send(
        await updateOrganizationProfileSection(
          request.params.organizationId,
          organizationRepository,
          vendorRepository,
          providerSource,
          (current) => ({ ...current, access: body }),
        ),
      );
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

const organizationSnapshot = async (
  organizationId: string,
  organizationRepository: OrganizationRepository,
  vendorRepository: ProviderRepository,
) => ({
  organization: await organizationRepository.getOrganization(organizationId),
  businessActivities:
    await vendorRepository.listBusinessActivities(organizationId),
  organizationProviders:
    await vendorRepository.listOrganizationProviders(organizationId),
  serviceProviderUsage:
    await vendorRepository.listServiceProviderUsage(organizationId),
});

const updateOrganizationProfileSection = async (
  organizationId: string,
  organizationRepository: OrganizationRepository,
  vendorRepository: ProviderRepository,
  providerSource: ProviderSource,
  merge: (input: SecurityProfileInput) => SecurityProfileInput,
) => {
  const current = await organizationRepository.getOrganization(organizationId);
  const input = merge(profileInputFromOrganization(current));
  const providerCatalog =
    input.infrastructure.organizationProviders.some(
      (provider) => provider.providerId !== "none",
    ) ||
    input.privacy.organizationProviders.some(
      (provider) => provider.providerId !== "none",
    )
      ? await providerSource.listProviders()
      : [];

  await organizationRepository.upsertProfile(
    organizationId,
    input,
    providerCatalog,
  );

  return organizationSnapshot(
    organizationId,
    organizationRepository,
    vendorRepository,
  );
};

const profileInputFromOrganization = (
  organization: OrganizationSecurityProfile | null,
): SecurityProfileInput => ({
  company: organization?.company ?? emptyCompanyProfile,
  services:
    organization && organization.services.length > 0
      ? organization.services.map((service) => ({
          id: service.id,
          sortOrder: service.sortOrder,
          serviceName: service.serviceName,
          serviceDescription: service.serviceDescription,
          serviceUrl: service.serviceUrl,
          businessActivityIds: service.businessActivityIds,
          userTypes: service.userTypes,
          customerTypes: service.customerTypes,
          availabilityRegions: service.availabilityRegions,
          childrenDirected: service.childrenDirected,
          minimumUserAge: service.minimumUserAge,
          privacy: service.privacy,
        }))
      : [emptyServiceProfile],
  privacy: organization?.privacy ?? emptyPrivacyProfile,
  infrastructure: organization?.infrastructure ?? emptyInfrastructureProfile,
  security: organization?.security ?? emptySecurityProfile,
  dataHandling: organization?.dataHandling ?? emptyDataHandlingProfile,
  access: organization?.access ?? emptyAccessProfile,
});
