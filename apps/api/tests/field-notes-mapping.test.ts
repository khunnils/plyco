import { describe, expect, it } from "vitest";
import {
  emptyAccessProfile,
  emptyCompanyProfile,
  emptyInfrastructureProfile,
  emptyPrivacyProfile,
  emptySecurityProfile,
  emptyServiceProfile,
  storedDataTypeSchema,
} from "@plyco/contracts";
import {
  mapOrganizationRecord,
  mapBusinessActivityRecord,
  mapOrganizationProviderRecord,
  mapServiceProviderUsageRecord,
} from "@plyco/db";

const note = { customerFacing: "Public detail", internal: "Internal detail" };
const now = new Date("2026-10-08T00:00:00Z");

describe("Prisma field note mapping", () => {
  it("maps singleton, service-privacy, and data-type columns into their owning DTOs", () => {
    const value = mapOrganizationRecord({
      id: "org",
      ...emptyCompanyProfile,
      companyName: "Company",
      fieldNotes: { companyName: note },
      createdAt: now,
      updatedAt: now,
      organizationProviders: [],
      privacyProfile: {
        ...emptyPrivacyProfile,
        fieldNotes: { supportedRights: note },
      },
      infrastructureProfile: {
        ...emptyInfrastructureProfile,
        explicitNoProviderSystemTypes: [],
        fieldNotes: { mfaEnabled: note },
      },
      securityProfile: {
        ...emptySecurityProfile,
        fieldNotes: { codeReviewRequired: note },
      },
      accessProfile: {
        ...emptyAccessProfile,
        fieldNotes: { mfaRequired: note },
      },
      dataTypes: [
        {
          ...storedDataTypeSchema.parse({ name: "Email" }),
          id: "data",
          fieldNotes: { name: note },
        },
      ],
      services: [
        {
          ...emptyServiceProfile,
          ...emptyServiceProfile.privacy,
          id: "service",
          fieldNotes: { serviceName: note },
          privacyFieldNotes: { primaryHostingRegion: note },
          createdAt: now,
          updatedAt: now,
        },
      ],
    });
    for (const section of [
      value.company,
      value.privacy,
      value.infrastructure,
      value.security,
      value.access,
      value.dataHandling.dataTypesStored[0]!,
      value.services[0]!,
      value.services[0]!.privacy,
    ]) {
      expect(Object.values(section.fieldNotes ?? {})).toEqual([note]);
    }
  });
  it("maps repeated record notes independently of existing provider Notes fields", () => {
    const activity = mapBusinessActivityRecord({
      id: "a",
      sortOrder: 0,
      name: "Activity",
      purpose: "Purpose",
      role: "controller",
      legalBasis: [],
      usesAi: false,
      aiUseCases: "",
      aiCustomerDataUsedForTraining: null,
      aiCustomerDataSentToProviders: null,
      aiHumanReviewOfOutputs: null,
      aiUsersInformedWhenUsed: null,
      retentionDays: 0,
      retentionPolicy: null,
      createdAt: now,
      updatedAt: now,
      fieldNotes: { purpose: note },
    });
    const provider = mapOrganizationProviderRecord({
      id: "p",
      systemTypes: [],
      name: "Provider",
      legalName: "",
      category: "",
      countryOfRegistration: "",
      criticality: "high",
      notes: "Existing notes",
      purpose: "",
      createdAt: now,
      updatedAt: now,
      fieldNotes: { criticality: note },
    });
    const usage = mapServiceProviderUsageRecord({
      id: "u",
      serviceId: "s",
      organizationProviderId: "p",
      systemType: null,
      purpose: "Hosting",
      dataProcessingLevel: "limited",
      dpaStatus: null,
      dataRegions: [],
      dataTypes: [],
      notes: "Usage notes",
      createdAt: now,
      updatedAt: now,
      fieldNotes: { purpose: note },
    });
    expect(activity.fieldNotes).toEqual({ purpose: note });
    expect(provider.fieldNotes).toEqual({ criticality: note });
    expect(provider.notes).toBe("Existing notes");
    expect(usage.fieldNotes).toEqual({ purpose: note });
    expect(usage.notes).toBe("Usage notes");
  });
});
