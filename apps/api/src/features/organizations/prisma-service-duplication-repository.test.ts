import { Prisma, type PrismaClient } from "@plyco/db";
import { describe, expect, it, vi } from "vitest";
import { PrismaServiceDuplicationRepository } from "./prisma-service-duplication-repository.js";

const input = {
  serviceName: "Copy",
  serviceUrl: "https://copy.example.com",
  primaryHostingRegion: "eu",
};
const timestamp = new Date("2026-01-01T00:00:00Z");
const source = {
  id: "source",
  organizationId: "org",
  sortOrder: 2,
  createdAt: timestamp,
  updatedAt: timestamp,
  fieldNotes: { serviceName: { internal: "Private note" } },
  privacyFieldNotes: {},
  processesCustomerData: true,
  serviceName: "Source",
  serviceDescription: "Description",
  serviceUrl: "https://source.example.com",
  userTypes: null,
  customerTypes: ["smb"],
  availabilityRegions: ["us"],
  childrenDirected: false,
  minimumUserAge: null,
  usesCookiesOrTrackingTechnologies: false,
  cookieCategories: null,
  cookieConsentMechanism: null,
  nonEssentialCookiesBlockedUntilConsent: null,
  cookieConsentWithdrawalMethod: null,
  globalPrivacyControlSupported: null,
  primaryHostingRegion: "us",
  businessActivities: [
    {
      id: "assignment",
      businessActivityId: "activity",
      serviceId: "source",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ],
  serviceProviderUsage: [
    {
      id: "usage",
      organizationId: "org",
      serviceId: "source",
      organizationProviderId: "provider",
      systemType: "hosting",
      purpose: "Original purpose",
      dataProcessingLevel: "limited",
      dpaStatus: "signed",
      dataRegions: ["us"],
      notes: "Usage notes",
      fieldNotes: {},
      createdAt: timestamp,
      updatedAt: timestamp,
      dataTypes: [
        {
          id: "link",
          serviceProviderUsageId: "usage",
          organizationDataTypeId: "data-type",
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    },
  ],
};

const setup = () => {
  const tx = {
    $queryRaw: vi.fn().mockResolvedValue([{ id: "org" }]),
    serviceProfile: {
      findFirst: vi.fn().mockResolvedValue(source),
      aggregate: vi.fn().mockResolvedValue({ _max: { sortOrder: 5 } }),
      create: vi.fn().mockResolvedValue({ id: "copy" }),
    },
  };
  const transaction = vi.fn(
    async (work: (client: typeof tx) => Promise<string>) => work(tx),
  );
  const repository = new PrismaServiceDuplicationRepository({
    $transaction: transaction,
  } as unknown as PrismaClient);
  return { tx, transaction, repository };
};

describe("Prisma service duplication", () => {
  it("creates the entire copied graph in one transactional write with fresh identities", async () => {
    const { repository, tx, transaction } = setup();
    expect(await repository.duplicateService("org", "source", input)).toBe(
      "copy",
    );
    expect(transaction).toHaveBeenCalledOnce();
    expect(tx.serviceProfile.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "source", organizationId: "org" },
      }),
    );
    const data = tx.serviceProfile.create.mock.calls[0]![0].data;
    expect(data).toMatchObject({
      ...input,
      organizationId: "org",
      sortOrder: 6,
      fieldNotes: source.fieldNotes,
      userTypes: Prisma.DbNull,
      cookieCategories: Prisma.DbNull,
    });
    expect(data.businessActivities.create).toEqual([
      { businessActivityId: "activity" },
    ]);
    expect(data.serviceProviderUsage.create).toEqual([
      {
        organizationId: "org",
        organizationProviderId: "provider",
        systemType: "hosting",
        purpose: "Original purpose",
        dataProcessingLevel: "limited",
        dpaStatus: "signed",
        dataRegions: ["us"],
        notes: "Usage notes",
        fieldNotes: {},
        dataTypes: { create: [{ organizationDataTypeId: "data-type" }] },
      },
    ]);
    for (const field of ["id", "createdAt", "updatedAt"])
      expect(data).not.toHaveProperty(field);
  });

  it("propagates nested-copy failure out of the transaction so Prisma rolls it back", async () => {
    const { repository, tx, transaction } = setup();
    const failure = new Error("Provider data-type link failed");
    tx.serviceProfile.create.mockRejectedValue(failure);
    await expect(
      repository.duplicateService("org", "source", input),
    ).rejects.toBe(failure);
    expect(transaction).toHaveBeenCalledOnce();
    expect(tx.serviceProfile.create).toHaveBeenCalledOnce();
    await expect(transaction.mock.results[0]!.value).rejects.toBe(failure);
  });

  it("does not write when the organization-scoped source is absent", async () => {
    const { repository, tx } = setup();
    tx.serviceProfile.findFirst.mockResolvedValue(null);
    await expect(
      repository.duplicateService("other-org", "source", input),
    ).rejects.toMatchObject({ code: "SERVICE_NOT_FOUND", statusCode: 404 });
    expect(tx.serviceProfile.create).not.toHaveBeenCalled();
  });
});
