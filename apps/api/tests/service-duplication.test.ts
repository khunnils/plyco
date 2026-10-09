import {
  businessActivityInputSchema,
  duplicateServiceResponseSchema,
  organizationProviderInputSchema,
  serviceProviderUsageInputSchema,
  securityProgramSnapshotSchema,
  businessActivitySchema,
  organizationProviderInventorySchema,
  serviceProviderUsageSchema,
} from "@plyco/contracts";
import { type FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import { hashOrganizationApiKey } from "../src/infrastructure/organization-api-key.js";
import {
  authConfig,
  createInMemoryRepositories,
  createTestApp,
  profileBody,
  saveProfileDraft,
  vendorBody,
  vendorUseBody,
} from "./helpers.js";

const input = {
  serviceName: "Regional copy",
  serviceUrl: "https://eu.acme.example",
  primaryHostingRegion: "eu",
};
const note = { customerFacing: "Customer note", internal: "Internal note" };
const apps: FastifyInstance[] = [];
afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

const setup = async (organizationId = "org-test") => {
  const repositories = createInMemoryRepositories();
  const app = await createTestApp(repositories);
  apps.push(app);
  const saved = await saveProfileDraft(app, organizationId, {
    ...profileBody,
    services: profileBody.services.map((service) => ({
      ...service,
      fieldNotes: { serviceName: note },
      privacy: {
        ...service.privacy,
        fieldNotes: { primaryHostingRegion: note },
      },
    })),
  });
  expect(saved.statusCode).toBe(200);
  const snapshot = securityProgramSnapshotSchema.parse(saved.json());
  const service = snapshot.organization!.services[0]!;
  return { app, repositories, service, snapshot };
};

describe("service duplication API", () => {
  it("copies settings, notes, activity links, and provider usage while reusing inventory", async () => {
    const { app, repositories, service, snapshot } = await setup();
    const activity = businessActivitySchema.parse(
      await repositories.vendorRepository.createBusinessActivity(
        "org-test",
        businessActivityInputSchema.parse({
          name: "Account management",
          purpose: "Operate customer accounts",
          dataTypeIds: [
            snapshot.organization!.dataHandling.dataTypesStored[0]!.id!,
          ],
        }),
      ),
    );
    const saved = await app.inject({
      method: "PUT",
      url: "/organizations/org-test/services",
      payload: [{ ...service, businessActivityIds: [activity.id] }],
    });
    expect(saved.statusCode).toBe(200);
    const source = securityProgramSnapshotSchema.parse(saved.json())
      .organization!.services[0]!;
    const provider = organizationProviderInventorySchema.parse(
      await repositories.vendorRepository.createOrganizationProvider(
        "org-test",
        organizationProviderInputSchema.parse(vendorBody),
      ),
    );
    const usage = serviceProviderUsageSchema.parse(
      await repositories.vendorRepository.createServiceProviderUsage(
        "org-test",
        serviceProviderUsageInputSchema.parse({
          ...vendorUseBody,
          serviceId: source.id,
          organizationProviderId: provider.id,
          fieldNotes: { purpose: note },
        }),
      ),
    );
    const original = structuredClone(source);
    const response = await app.inject({
      method: "POST",
      url: `/organizations/org-test/services/${source.id}/duplicate`,
      payload: input,
    });
    expect(response.statusCode).toBe(201);
    const result = duplicateServiceResponseSchema.parse(response.json());
    const copy = result.snapshot.organization!.services.at(-1)!;
    expect(copy).toEqual({
      ...source,
      serviceName: input.serviceName,
      serviceUrl: input.serviceUrl,
      privacy: {
        ...source.privacy,
        primaryHostingRegion: input.primaryHostingRegion,
      },
      id: result.serviceId,
      sortOrder: 1,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(copy.id).not.toBe(source.id);
    expect(result.snapshot.organization!.services[0]).toEqual(original);
    const copiedUsage = result.snapshot.serviceProviderUsage.find(
      (item) => item.serviceId === copy.id,
    )!;
    expect(copiedUsage).toEqual({
      ...usage,
      id: expect.any(String),
      serviceId: copy.id,
      serviceName: copy.serviceName,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(copiedUsage.id).not.toBe(usage.id);
    expect(copiedUsage.dataRegions).toEqual(["us"]);
    expect(result.snapshot.businessActivities).toEqual([activity]);
    expect(result.snapshot.organizationProviders).toEqual([provider]);
    expect(result.snapshot.organization!.dataHandling).toEqual(
      snapshot.organization!.dataHandling,
    );

    const storedCopy =
      (await repositories.organizationRepository.getOrganization(
        "org-test",
      ))!.services.at(-1)!;
    storedCopy.fieldNotes!.serviceName!.internal = "Changed copy";
    expect(source.fieldNotes!.serviceName!.internal).toBe(note.internal);
    await repositories.vendorRepository.deleteServiceProviderUsage(
      "org-test",
      copiedUsage.id,
    );
    expect(
      (
        await repositories.vendorRepository.listServiceProviderUsage("org-test")
      ).map((item) => serviceProviderUsageSchema.parse(item)),
    ).toEqual([usage]);
  });

  it("copies a service with no provider usage and allows matching names and URLs", async () => {
    const { app, service } = await setup();
    const response = await app.inject({
      method: "POST",
      url: `/organizations/org-test/services/${service.id}/duplicate`,
      payload: {
        ...input,
        serviceName: service.serviceName,
        serviceUrl: service.serviceUrl,
      },
    });
    expect(response.statusCode).toBe(201);
    const result = duplicateServiceResponseSchema.parse(response.json());
    expect(result.snapshot.serviceProviderUsage).toEqual([]);
    expect(result.snapshot.organization!.services).toHaveLength(2);
  });

  it.each([
    [{ serviceName: " " }, "VALIDATION_FAILED"],
    [{ serviceUrl: "ftp://acme.example" }, "VALIDATION_FAILED"],
    [{ primaryHostingRegion: "" }, "VALIDATION_FAILED"],
    [{ primaryHostingRegion: "unknown" }, "CODE_NOT_FOUND"],
    [{ primaryHostingRegion: "not_set" }, "CODE_NOT_FOUND"],
  ])(
    "rejects invalid input %j without creating a copy",
    async (override, code) => {
      const { app, service } = await setup();
      const response = await app.inject({
        method: "POST",
        url: `/organizations/org-test/services/${service.id}/duplicate`,
        payload: { ...input, ...override },
      });
      expect(response.statusCode).toBe(400);
      expect(response.json().error.code).toBe(code);
      const snapshot = (
        await app.inject({ method: "GET", url: "/organizations/org-test" })
      ).json();
      expect(snapshot.organization.services).toHaveLength(1);
    },
  );

  it("returns 404 for missing and foreign source IDs", async () => {
    const { app, service } = await setup();
    await saveProfileDraft(app, "org-other");
    for (const [organizationId, id] of [
      ["org-test", "missing"],
      ["org-other", service.id],
    ]) {
      const response = await app.inject({
        method: "POST",
        url: `/organizations/${organizationId}/services/${id}/duplicate`,
        payload: input,
      });
      expect(response.statusCode).toBe(404);
      expect(response.json().error.code).toBe("SERVICE_NOT_FOUND");
    }
  });

  it("enforces authentication, key write scope, and organization scope", async () => {
    const { repositories, service } = await setup();
    const app = await createTestApp({ ...repositories, auth: authConfig });
    apps.push(app);
    const user =
      await repositories.accountRepository.upsertEmailUser("owner@example.com");
    for (const [key, scope, organizationId] of [
      ["writer", "read_write", "org-test"],
      ["reader", "read", "org-test"],
      ["foreign", "read_write", "org-other"],
    ] as const) {
      await repositories.accountRepository.createOrganizationApiKey({
        organizationId,
        createdByUserId: user.id,
        name: key,
        scope,
        tokenHash: hashOrganizationApiKey(key),
        keyPrefix: key,
      });
    }
    const url = `/organizations/org-test/services/${service.id}/duplicate`;
    for (const key of [null, "reader", "foreign"]) {
      const response = await app.inject({
        method: "POST",
        url,
        payload: input,
        headers: key ? { authorization: `Bearer ${key}` } : {},
      });
      expect(response.statusCode).toBe(401);
    }
    const response = await app.inject({
      method: "POST",
      url,
      payload: input,
      headers: { authorization: "Bearer writer" },
    });
    expect(response.statusCode).toBe(201);
  });

  it("documents the new endpoint", async () => {
    const app = await createTestApp({ apiDocs: true });
    apps.push(app);
    const spec = (
      await app.inject({ method: "GET", url: "/docs/json" })
    ).json();
    expect(
      spec.paths[
        "/organizations/{organizationId}/services/{serviceId}/duplicate"
      ].post.responses["201"],
    ).toBeDefined();
  });

  it("allows member sessions and rejects sessions outside the organization", async () => {
    const { app: seedApp, repositories } = await setup();
    const owner =
      await repositories.accountRepository.upsertEmailUser("owner@example.com");
    const member =
      await repositories.accountRepository.upsertEmailUser(
        "member@example.com",
      );
    const organization =
      await repositories.accountRepository.createOrganization(owner.id, {
        name: "Acme",
      });
    const saved = await saveProfileDraft(seedApp, organization.id);
    const serviceId = securityProgramSnapshotSchema.parse(saved.json())
      .organization!.services[0]!.id;
    await repositories.accountRepository.createOrganizationInvitation({
      organizationId: organization.id,
      invitedByUserId: owner.id,
      invitation: { email: member.email, role: "member" },
      tokenHash: "invitation",
      expiresAt: new Date(Date.now() + 60_000),
    });
    await repositories.accountRepository.acceptOrganizationInvitation({
      tokenHash: "invitation",
      userId: member.id,
      email: member.email,
      now: new Date(),
    });
    const app = await createTestApp({ ...repositories, auth: authConfig });
    apps.push(app);
    for (const [email, status] of [
      ["member@example.com", 201],
      ["outsider@example.com", 403],
    ] as const) {
      const token = crypto.randomUUID();
      await repositories.accountRepository.createMagicLinkToken({
        email,
        tokenHash: hashOrganizationApiKey(token),
        expiresAt: new Date(Date.now() + 60_000),
      });
      const login = await app.inject({
        method: "GET",
        url: `/auth/magic-link/callback?token=${token}`,
      });
      const cookie = login.cookies.find((item) => item.name === "cf_session")!;
      const response = await app.inject({
        method: "POST",
        url: `/organizations/${organization.id}/services/${serviceId}/duplicate`,
        payload: input,
        cookies: { cf_session: cookie.value },
      });
      expect(response.statusCode).toBe(status);
      if (status === 403)
        expect(response.json().error.code).toBe("ORGANIZATION_ACCESS_DENIED");
    }
  });

  it("does not publish a service when preparing a provider copy fails", async () => {
    const { app, repositories, service } = await setup();
    const provider =
      await repositories.vendorRepository.createOrganizationProvider(
        "org-test",
        organizationProviderInputSchema.parse(vendorBody),
      );
    const usage =
      await repositories.vendorRepository.createServiceProviderUsage(
        "org-test",
        serviceProviderUsageInputSchema.parse({
          ...vendorUseBody,
          serviceId: service.id,
          organizationProviderId: provider.id,
        }),
      );
    usage.fieldNotes = {
      purpose: { internal: "x".repeat(5001), customerFacing: "" },
    };
    const response = await app.inject({
      method: "POST",
      url: `/organizations/org-test/services/${service.id}/duplicate`,
      payload: input,
    });
    expect(response.statusCode).toBe(400);
    expect(
      (await repositories.organizationRepository.getOrganization("org-test"))!
        .services,
    ).toHaveLength(1);
    expect(
      await repositories.vendorRepository.listServiceProviderUsage("org-test"),
    ).toHaveLength(1);
  });
});
