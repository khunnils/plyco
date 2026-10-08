import { FileSystemTemplateSource } from "../src/infrastructure/system-templates.js";
import { hashOrganizationApiKey } from "../src/infrastructure/organization-api-key.js";
import {
  type SecurityProgramSnapshot,
  type OrganizationProvider,
  emptySecurityProfile,
} from "@plyco/contracts";
import { describe, expect, it } from "vitest";
import {
  createTestApp,
  profileBody,
  saveProfileDraft,
  vendorBody,
  vendorUseBody,
  createInMemoryRepositories,
  authConfig,
} from "./helpers.js";

const note = {
  customerFacing: "GitHub required reviewers",
  internal: "Verify branch protection",
};
const notes = { codeReviewRequired: note };

describe("field notes API", () => {
  it("round-trips singleton maps, preserves omission, clears supplied maps, and scopes tenants", async () => {
    const app = await createTestApp();
    try {
      const first = await saveProfileDraft(app, "org-a", {
        ...profileBody,
        company: { ...profileBody.company, fieldNotes: { companyName: note } },
        privacy: {
          ...profileBody.privacy,
          fieldNotes: { supportedRights: note },
        },
        infrastructure: {
          ...profileBody.infrastructure,
          fieldNotes: { mfaEnabled: note },
        },
        access: { ...profileBody.access, fieldNotes: { mfaRequired: note } },
        security: { ...profileBody.security, fieldNotes: notes },
      });
      expect(first.statusCode).toBe(200);
      for (const section of [
        "company",
        "privacy",
        "infrastructure",
        "access",
        "security",
      ]) {
        expect(
          Object.values(first.json().organization[section].fieldNotes),
        ).toEqual([note]);
      }
      const update = await app.inject({
        method: "PUT",
        url: "/organizations/org-a/security",
        payload: profileBody.security,
      });
      expect(update.json().organization.security.fieldNotes).toEqual(notes);
      await saveProfileDraft(app, "org-b");
      const other = await app.inject({
        method: "GET",
        url: "/organizations/org-b/security",
      });
      expect(other.json().fieldNotes).toEqual({});
      const cleared = await app.inject({
        method: "PUT",
        url: "/organizations/org-a/security",
        payload: { ...profileBody.security, fieldNotes: {} },
      });
      expect(cleared.json().organization.security.fieldNotes).toEqual({});
      const invalid = await app.inject({
        method: "PUT",
        url: "/organizations/org-a/security",
        payload: { ...profileBody.security, fieldNotes: { companyName: note } },
      });
      expect(invalid.statusCode).toBe(400);
      expect(invalid.json().error.code).toBe("VALIDATION_FAILED");
    } finally {
      await app.close();
    }
  });

  it("retains service and data-type notes on their IDs through rename, reorder, and omission", async () => {
    const app = await createTestApp();
    try {
      const initial = await saveProfileDraft(app, "org-a", {
        ...profileBody,
        services: profileBody.services.map((service) => ({
          ...service,
          fieldNotes: { serviceName: note },
          privacy: {
            ...service.privacy,
            fieldNotes: { primaryHostingRegion: note },
          },
        })),
        dataHandling: {
          dataTypesStored: profileBody.dataHandling.dataTypesStored.map(
            (item) => ({ ...item, fieldNotes: { name: note } }),
          ),
        },
      });
      expect(initial.statusCode).toBe(200);
      const organization =
        initial.json<SecurityProgramSnapshot>().organization!;
      const services = organization.services.map(
        ({ fieldNotes: _notes, ...service }) => ({
          ...service,
          serviceName: "Renamed service",
          privacy: { ...service.privacy, fieldNotes: undefined },
        }),
      );
      const update = await app.inject({
        method: "PUT",
        url: "/organizations/org-a/services",
        payload: services,
      });
      expect(update.json().organization.services[0]).toMatchObject({
        id: organization.services[0].id,
        fieldNotes: { serviceName: note },
      });
      expect(update.json().organization.services[0].privacy.fieldNotes).toEqual(
        { primaryHostingRegion: note },
      );
      const dataTypes = organization.dataHandling.dataTypesStored.map(
        ({ fieldNotes: _notes, ...item }, i) => ({
          ...item,
          name: `Renamed ${i}`,
        }),
      );
      const dataUpdate = await app.inject({
        method: "PUT",
        url: "/organizations/org-a/data",
        payload: { dataTypesStored: dataTypes },
      });
      expect(
        dataUpdate.json().organization.dataHandling.dataTypesStored[0],
      ).toMatchObject({ id: dataTypes[0].id, fieldNotes: { name: note } });
      const reorderedIds = dataTypes.map((item) => item.id).reverse();
      const order = await app.inject({
        method: "PUT",
        url: "/organizations/org-a/data-types/order",
        payload: { ids: reorderedIds },
      });
      expect(order.statusCode).toBe(204);
      const reordered = await app.inject({
        method: "GET",
        url: "/organizations/org-a/data",
      });
      expect(
        reordered
          .json<{
            dataTypesStored: import("@plyco/contracts").StoredDataType[];
          }>()
          .dataTypesStored.map((item) => item.id),
      ).toEqual(reorderedIds);
      expect(
        reordered
          .json<{
            dataTypesStored: import("@plyco/contracts").StoredDataType[];
          }>()
          .dataTypesStored.every(
            (item) => item.fieldNotes?.name?.internal === note.internal,
          ),
      ).toBe(true);
      const deletion = await app.inject({
        method: "PUT",
        url: "/organizations/org-a/data",
        payload: { dataTypesStored: [] },
      });
      expect(deletion.json().organization.dataHandling.dataTypesStored).toEqual(
        [],
      );
    } finally {
      await app.close();
    }
  });

  it("round-trips activity, provider inventory, and service-provider usage notes", async () => {
    const app = await createTestApp();
    try {
      const snapshot = (
        await saveProfileDraft(app, "org-a")
      ).json<SecurityProgramSnapshot>();
      const cases = [
        [
          "business-activities",
          {
            name: "Review changes",
            purpose: "Engineering",
            role: "controller",
            fieldNotes: { purpose: note },
          },
        ],
        [
          "organization-providers",
          { ...vendorBody, fieldNotes: { criticality: note } },
        ],
      ] as const;
      for (const [endpoint, payload] of cases) {
        const created = await app.inject({
          method: "POST",
          url: `/organizations/org-a/${endpoint}`,
          payload,
        });
        expect(created.statusCode).toBe(201);
        expect(created.json().fieldNotes).toEqual(payload.fieldNotes);
        const { fieldNotes: _notes, ...withoutNotes } = payload;
        const update = await app.inject({
          method: "PUT",
          url: `/organizations/org-a/${endpoint}/${created.json().id}`,
          payload: { ...withoutNotes, name: `Renamed ${payload.name}` },
        });
        expect(update.json().fieldNotes).toEqual(payload.fieldNotes);
      }
      const providers = (
        await app.inject({
          method: "GET",
          url: "/organizations/org-a/organization-providers",
        })
      ).json<OrganizationProvider[]>();
      const payload = {
        ...vendorUseBody,
        serviceId: snapshot.organization!.services[0].id,
        organizationProviderId: providers[0].id,
        fieldNotes: { purpose: note },
      };
      const created = await app.inject({
        method: "POST",
        url: "/organizations/org-a/service-provider-usage",
        payload,
      });
      expect(created.statusCode).toBe(201);
      expect(created.json().fieldNotes).toEqual(payload.fieldNotes);
      const { fieldNotes: _notes, ...withoutNotes } = payload;
      const update = await app.inject({
        method: "PUT",
        url: `/organizations/org-a/service-provider-usage/${created.json().id}`,
        payload: withoutNotes,
      });
      expect(update.json().fieldNotes).toEqual(payload.fieldNotes);
    } finally {
      await app.close();
    }
  });
  it("restricts internal-note reads and note writes to the authenticated organization and key scope", async () => {
    const repositories = createInMemoryRepositories();
    const owner = await repositories.accountRepository.upsertGoogleUser({
      googleSubject: "owner",
      email: "owner@example.com",
      name: "Owner",
    });
    const organization =
      await repositories.accountRepository.createOrganization(owner.id, {
        name: "Company",
      });
    const other = await repositories.accountRepository.createOrganization(
      owner.id,
      { name: "Other" },
    );
    const seed = await createTestApp(repositories);
    const app = await createTestApp({ ...repositories, auth: authConfig });
    try {
      await saveProfileDraft(seed, organization.id, {
        ...profileBody,
        security: { ...profileBody.security, fieldNotes: notes },
      });
      for (const scope of ["read", "read_write"] as const) {
        const token = `plyco_org_test_${scope}`;
        await repositories.accountRepository.createOrganizationApiKey({
          organizationId: organization.id,
          createdByUserId: owner.id,
          name: scope,
          scope,
          tokenHash: hashOrganizationApiKey(token),
          keyPrefix: token.slice(0, 14),
        });
      }
      const url = `/organizations/${organization.id}/security`;
      expect((await app.inject({ method: "GET", url })).statusCode).toBe(401);
      const readHeaders = { authorization: "Bearer plyco_org_test_read" };
      const read = await app.inject({
        method: "GET",
        url,
        headers: readHeaders,
      });
      expect(read.json().fieldNotes).toEqual(notes);
      expect(
        (
          await app.inject({
            method: "GET",
            url: `/organizations/${other.id}/security`,
            headers: readHeaders,
          })
        ).statusCode,
      ).toBe(401);
      const payload = { ...emptySecurityProfile, fieldNotes: {} };
      expect(
        (
          await app.inject({
            method: "PUT",
            url,
            headers: readHeaders,
            payload,
          })
        ).statusCode,
      ).toBe(401);
      const write = await app.inject({
        method: "PUT",
        url,
        headers: { authorization: "Bearer plyco_org_test_read_write" },
        payload,
      });
      expect(write.statusCode).toBe(200);
      expect(write.json().organization.security.fieldNotes).toEqual({});
    } finally {
      await seed.close();
      await app.close();
    }
  });
  it("updates new template copies while leaving existing copies and public document snapshots intact", async () => {
    const repositories = createInMemoryRepositories();
    const legacyApp = await createTestApp(repositories);
    const currentApp = await createTestApp({
      ...repositories,
      systemTemplateSource: new FileSystemTemplateSource(),
    });
    try {
      await saveProfileDraft(legacyApp, "org-a", {
        ...profileBody,
        security: { ...profileBody.security, fieldNotes: notes },
      });
      const legacy = await legacyApp.inject({
        method: "POST", url: "/organizations/org-a/templates",
        payload: { sourceSystemTemplateSlug: "data-security-policy" },
      });
      expect(legacy.statusCode).toBe(201);
      const oldTemplate = legacy.json();
      const generated = await legacyApp.inject({
        method: "POST", url: "/organizations/org-a/documents",
        payload: { templateId: oldTemplate.id },
      });
      expect(generated.statusCode).toBe(201);
      await legacyApp.inject({
        method: "PUT", url: `/organizations/org-a/templates/${oldTemplate.id}/visibility`,
        payload: { isPublic: true },
      });
      const before = await legacyApp.inject({ method: "GET", url: "/public/acme-ai/data-security-policy" });
      expect(before.statusCode).toBe(200);
      const oldCopy = await currentApp.inject({
        method: "GET", url: "/organizations/org-a/templates",
      });
      expect(oldCopy.json().organizationTemplates.find((item: { id: string }) => item.id === oldTemplate.id).content).toBe(oldTemplate.content);
      const unchanged = await currentApp.inject({
        method: "GET", url: `/organizations/org-a/documents/${generated.json().id}`,
      });
      expect(unchanged.json()).toEqual(generated.json());
      const after = await currentApp.inject({ method: "GET", url: "/public/acme-ai/data-security-policy" });
      expect(after.body).toBe(before.body);
      expect(after.body).not.toContain(note.internal);
      const newCopy = await currentApp.inject({
        method: "POST", url: "/organizations/org-b/templates",
        payload: { sourceSystemTemplateSlug: "data-security-policy" },
      });
      expect(newCopy.statusCode).toBe(201);
      expect(newCopy.json().content).toContain("customerNotes.codeReviewRequired");
      expect(oldTemplate.content).not.toContain("customerNotes");
    } finally {
      await legacyApp.close();
      await currentApp.close();
    }
  });

});
