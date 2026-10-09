import { type DuplicateServiceInput } from "@plyco/contracts";
import { Prisma, prisma, type PrismaClient } from "@plyco/db";
import { ApiError } from "../../infrastructure/errors.js";
import { type ServiceDuplicationRepository } from "./service-duplication-repository.js";

const jsonValue = (value: Prisma.JsonValue) =>
  value === null ? Prisma.DbNull : (value as Prisma.InputJsonValue);

export class PrismaServiceDuplicationRepository implements ServiceDuplicationRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async duplicateService(
    organizationId: string,
    sourceServiceId: string,
    input: DuplicateServiceInput,
  ): Promise<string> {
    return this.client.$transaction(async (tx) => {
      // Serialize copies within an organization before allocating the appended order.
      await tx.$queryRaw`SELECT "id" FROM "organizations" WHERE "id" = ${organizationId} FOR UPDATE`;
      const source = await tx.serviceProfile.findFirst({
        where: { id: sourceServiceId, organizationId },
        include: {
          businessActivities: true,
          serviceProviderUsage: { include: { dataTypes: true } },
        },
      });
      if (!source) {
        throw new ApiError(
          "SERVICE_NOT_FOUND",
          "Service was not found for this organization.",
          404,
        );
      }
      const order = await tx.serviceProfile.aggregate({
        where: { organizationId },
        _max: { sortOrder: true },
      });
      const {
        id,
        createdAt,
        updatedAt,
        businessActivities,
        serviceProviderUsage,
        ...settings
      } = source;
      const service = await tx.serviceProfile.create({
        data: {
          ...settings,
          ...input,
          sortOrder: (order._max.sortOrder ?? -1) + 1,
          fieldNotes: settings.fieldNotes as Prisma.InputJsonValue,
          privacyFieldNotes:
            settings.privacyFieldNotes as Prisma.InputJsonValue,
          userTypes: jsonValue(settings.userTypes),
          customerTypes: jsonValue(settings.customerTypes),
          availabilityRegions: jsonValue(settings.availabilityRegions),
          cookieCategories: jsonValue(settings.cookieCategories),
          businessActivities: {
            create: businessActivities.map(({ businessActivityId }) => ({
              businessActivityId,
            })),
          },
          serviceProviderUsage: {
            create: serviceProviderUsage.map((usage) => ({
              organizationId,
              organizationProviderId: usage.organizationProviderId,
              systemType: usage.systemType,
              purpose: usage.purpose,
              dataProcessingLevel: usage.dataProcessingLevel,
              dpaStatus: usage.dpaStatus,
              dataRegions: usage.dataRegions,
              notes: usage.notes,
              fieldNotes: usage.fieldNotes as Prisma.InputJsonValue,
              dataTypes: {
                create: usage.dataTypes.map(({ organizationDataTypeId }) => ({
                  organizationDataTypeId,
                })),
              },
            })),
          },
        },
        select: { id: true },
      });
      return service.id;
    });
  }
}
