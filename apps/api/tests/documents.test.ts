import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { type SecurityProgramSnapshot } from "@plyco/shared";
import { describe, expect, it } from "vitest";

import { createTestApp } from "./helpers.js";
import {
  Jinja2Renderer,
  ReportContextBuilder,
} from "../src/features/documents/document-generation.js";
import { InMemoryVocabularyRepository } from "../src/features/vocabulary/in-memory-repository.js";
import { parseSystemTemplate } from "../src/infrastructure/system-templates.js";

import {
  noProcessingVendorBody,
  noProcessingVendorUseBody,
  profileBody,
  serviceBody,
  storedService,
  subprocessorBody,
  subprocessorUseBody,
  vendorBody,
  vendorUseBody,
} from "./helpers.js";
import { testVocabularyCodeSets } from "./vocabulary-fixtures.js";

describe("documents / templates API", () => {
  it("builds report context with organization aliases and vendor collections", () => {
    const snapshot: SecurityProgramSnapshot = {
      organization: {
        id: "org-test",
        ...profileBody,
        services: [storedService],
        createdAt: "2026-05-15T00:00:00.000Z",
        updatedAt: "2026-05-15T00:00:00.000Z",
      },
      businessActivities: [],
      vendors: [
        {
          id: "vendor-limited",
          ...vendorBody,
          createdAt: "2026-05-15T00:00:00.000Z",
          updatedAt: "2026-05-15T00:00:00.000Z",
        },
        {
          id: "vendor-subprocessor",
          ...subprocessorBody,
          createdAt: "2026-05-15T00:00:00.000Z",
          updatedAt: "2026-05-15T00:00:00.000Z",
        },
        {
          id: "vendor-none",
          ...noProcessingVendorBody,
          createdAt: "2026-05-15T00:00:00.000Z",
          updatedAt: "2026-05-15T00:00:00.000Z",
        },
      ],
      serviceVendorUses: [
        {
          id: "vendor-use-limited",
          ...vendorUseBody,
          vendorName: "GitHub",
          serviceName: "Acme AI Platform",
          createdAt: "2026-05-15T00:00:00.000Z",
          updatedAt: "2026-05-15T00:00:00.000Z",
        },
        {
          id: "vendor-use-subprocessor",
          ...subprocessorUseBody,
          vendorName: "Stripe",
          serviceName: "Acme AI Platform",
          createdAt: "2026-05-15T00:00:00.000Z",
          updatedAt: "2026-05-15T00:00:00.000Z",
        },
        {
          id: "vendor-use-none",
          ...noProcessingVendorUseBody,
          vendorName: "Linear",
          serviceName: "Acme AI Platform",
          createdAt: "2026-05-15T00:00:00.000Z",
          updatedAt: "2026-05-15T00:00:00.000Z",
        },
      ],
    };

    const context = new ReportContextBuilder().build(snapshot);

    expect(context.organization.name).toBe("Acme AI");
    expect(context.organization.employeeCount).toBe(12);
    expect(context.company.name).toBe("Acme AI");
    expect(context.vendors.all.map((vendor) => vendor.name)).toEqual([
      "GitHub",
      "Stripe",
      "Linear",
    ]);
    expect(context.vendors.dataProcessors.map((vendor) => vendor.name)).toEqual(
      ["GitHub", "Stripe"],
    );
    expect(context.vendors.subprocessors.map((vendor) => vendor.name)).toEqual([
      "Stripe",
    ]);
    expect(context.vendors.byService).toEqual([
      expect.objectContaining({
        serviceId: "service-platform",
        serviceName: "Acme AI Platform",
        vendors: expect.arrayContaining([
          expect.objectContaining({ name: "GitHub" }),
          expect.objectContaining({ name: "Stripe" }),
        ]),
      }),
    ]);
    expect(context.services.all[0]).toMatchObject({
      vendors: expect.arrayContaining([
        expect.objectContaining({ name: "GitHub" }),
        expect.objectContaining({ name: "Stripe" }),
      ]),
      subprocessors: [expect.objectContaining({ name: "Stripe" })],
      dataTypes: [expect.objectContaining({ name: "Customer account data" })],
    });
  });

  it("adds answered and hasValue helper flags to report context fields", () => {
    const context = new ReportContextBuilder().build({
      organization: {
        id: "org-test",
        ...profileBody,
        company: {
          ...profileBody.company,
          industries: [],
          handlesPii: false,
        },
        services: [
          {
            ...storedService,
            userTypes: null,
            minimumUserAge: 0,
            privacy: {
              ...storedService.privacy,
              cookieTrackingCategories: [],
              usesCookiesOrTrackingTechnologies: false,
            },
          },
        ],
        privacy: {
          ...profileBody.privacy,
          supportedRights: null,
          requestMethods: [],
          identityVerificationRequired: false,
        },
        createdAt: "2026-05-15T00:00:00.000Z",
        updatedAt: "2026-05-15T00:00:00.000Z",
      },
      businessActivities: [],
      organizationProviders: [],
      serviceProviderUsage: [],
    });

    expect(context.privacy.supportedRightsAnswered).toBe(false);
    expect(context.privacy.requestMethodsAnswered).toBe(true);
    expect(context.privacy.requestMethodsHasValue).toBe(false);
    expect(context.privacy.identityVerificationRequiredAnswered).toBe(true);
    expect(context.privacy.identityVerificationRequiredHasValue).toBe(false);
    expect(context.service.userTypesAnswered).toBe(false);
    expect(context.service.minimumUserAgeAnswered).toBe(true);
    expect(context.service.minimumUserAgeHasValue).toBe(false);
    expect(context.service.privacy.cookieTrackingCategoriesAnswered).toBe(true);
    expect(context.service.privacy.cookieTrackingCategoriesHasValue).toBe(
      false,
    );
    expect(context.vendors.dataProcessorsHasValue).toBe(false);
  });

  it("loads the report builder variable schema", async () => {
    const schemaPath = fileURLToPath(
      new URL("../data/templates/schema.json", import.meta.url),
    );
    const schema = JSON.parse(await readFile(schemaPath, "utf8"));

    expect(schema.version).toBe(1);
    expect(schema.variables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "organization.name" }),
        expect.objectContaining({ key: "policy.version" }),
        expect.objectContaining({ key: "service.name" }),
        expect.objectContaining({ key: "service.description" }),
        expect.objectContaining({ key: "service.url" }),
        expect.objectContaining({ key: "service.userTypes" }),
        expect.objectContaining({ key: "service.userTypeLabels" }),
        expect.objectContaining({ key: "service.customerTypes" }),
        expect.objectContaining({ key: "service.customerTypeLabels" }),
        expect.objectContaining({ key: "service.availabilityRegions" }),
        expect.objectContaining({ key: "service.availabilityRegionLabels" }),
        expect.objectContaining({ key: "service.childrenDirected" }),
        expect.objectContaining({ key: "service.minimumUserAge" }),
        expect.objectContaining({
          key: "service.privacy.usesCookiesOrTrackingTechnologies",
        }),
        expect.objectContaining({
          key: "service.privacy.cookieTrackingCategories",
        }),
        expect.objectContaining({
          key: "service.privacy.cookieTrackingCategoryLabels",
        }),
        expect.objectContaining({
          key: "service.privacy.cookieConsentMechanism",
        }),
        expect.objectContaining({
          key: "service.privacy.cookieConsentMechanismLabel",
        }),
        expect.objectContaining({ key: "service.privacy.doNotTrackResponse" }),
        expect.objectContaining({
          key: "service.privacy.globalPrivacyControlSupported",
        }),
        expect.objectContaining({ key: "services.all" }),
        expect.objectContaining({ key: "services.primary" }),
        expect.objectContaining({ key: "privacy.supportedRights" }),
        expect.objectContaining({ key: "privacy.supportedRightLabels" }),
        expect.objectContaining({ key: "privacy.requestMethods" }),
        expect.objectContaining({ key: "privacy.requestMethodLabels" }),
        expect.objectContaining({ key: "privacy.responseTimelineDaysStatus" }),
        expect.objectContaining({
          key: "privacy.responseTimelineDaysStatusLabel",
        }),
        expect.objectContaining({ key: "privacy.responseTimelineDays" }),
        expect.objectContaining({
          key: "privacy.identityVerificationRequired",
        }),
        expect.objectContaining({ key: "privacy.authorizedAgentSupported" }),
        expect.objectContaining({ key: "privacy.appealProcessExists" }),
        expect.objectContaining({ key: "privacy.sendsMarketingEmails" }),
        expect.objectContaining({ key: "privacy.marketingOptOutMethod" }),
        expect.objectContaining({ key: "privacy.marketingOptOutMethodLabel" }),
        expect.objectContaining({ key: "privacy.transactionalEmailsSent" }),
        expect.objectContaining({ key: "privacy.crossBorderTransfers" }),
        expect.objectContaining({ key: "privacy.transferMechanisms" }),
        expect.objectContaining({ key: "privacy.transferMechanismLabels" }),
        expect.objectContaining({ key: "privacy.newsletterProvider" }),
        expect.objectContaining({ key: "privacy.newsletterProviderId" }),
        expect.objectContaining({
          key: "security.accessControl.leastPrivilege",
        }),
        expect.objectContaining({
          key: "security.authentication.mfaRequired",
        }),
        expect.objectContaining({
          key: "security.encryption.atRestAlgorithmLabel",
        }),
        expect.objectContaining({ key: "security.logging.logRetentionDays" }),
        expect.objectContaining({
          key: "security.vulnerabilityManagement.scanningCadenceLabel",
        }),
        expect.objectContaining({
          key: "security.incidentResponse.notificationTimelineLabel",
        }),
        expect.objectContaining({ key: "security.backups.backupCadenceLabel" }),
        expect.objectContaining({
          key: "security.vendorRisk.vendorReviewCadenceLabel",
        }),
        expect.objectContaining({ key: "vendors.all" }),
        expect.objectContaining({ key: "vendors.dataProcessors" }),
        expect.objectContaining({ key: "vendors.subprocessors" }),
        expect.objectContaining({ key: "vendors.byService" }),
      ]),
    );
  });

  it("exposes profile values and resolved labels in the document context", async () => {
    const vocabularyRepository = new InMemoryVocabularyRepository(
      testVocabularyCodeSets,
    );
    const vocabulary = await vocabularyRepository.listVocabulary("org-test");
    const snapshot: SecurityProgramSnapshot = {
      organization: {
        id: "org-test",
        ...profileBody,
        services: [storedService],
        createdAt: "2026-05-15T00:00:00.000Z",
        updatedAt: "2026-05-15T00:00:00.000Z",
      },
      businessActivities: [],
      vendors: [],
      serviceVendorUses: [],
    };

    const context = new ReportContextBuilder().build(
      snapshot,
      undefined,
      [],
      vocabulary,
    );

    expect(context.service).toMatchObject({
      id: "service-platform",
      name: "Acme AI Platform",
      description: "Cloud software for managing customer security reviews",
      url: "https://app.acme.example",
      userTypes: ["workspace_admins", "end_users"],
      userTypeLabels: ["Workspace admins", "End users"],
      customerTypes: ["smb", "mid_market"],
      customerTypeLabels: ["SMB", "Mid-market"],
      availabilityRegions: ["us", "eu"],
      availabilityRegionLabels: ["United States", "European Union"],
      childrenDirected: false,
      minimumUserAge: 13,
      privacy: {
        usesCookiesOrTrackingTechnologies: true,
        cookieTrackingCategories: ["necessary", "analytics"],
        cookieTrackingCategoryLabels: ["Necessary", "Analytics"],
        cookieConsentMechanism: "cookie_banner",
        cookieConsentMechanismLabel: "Cookie banner",
        doNotTrackResponse: false,
        globalPrivacyControlSupported: true,
        analyticsProviders: [],
        analyticsProviderIds: [],
        advertisingProviders: [],
        advertisingProviderIds: [],
        primaryHostingRegion: "us",
        primaryHostingRegionLabel: "United States",
      },
    });
    expect(context.services.primary).toMatchObject(context.service);
    expect(context.services.all).toHaveLength(1);
    expect(context.privacy).toMatchObject({
      supportedRights: ["access", "deletion", "correction", "opt_out"],
      supportedRightLabels: ["Access", "Deletion", "Correction", "Opt-out"],
      requestMethods: ["email", "web_form"],
      requestMethodLabels: ["Email", "Web form"],
      responseTimelineDaysStatus: "defined",
      responseTimelineDaysStatusLabel: "Defined",
      responseTimelineDays: 30,
      identityVerificationRequired: true,
      authorizedAgentSupported: true,
      appealProcessExists: false,
      sendsMarketingEmails: true,
      marketingOptOutMethod: "unsubscribe_link",
      marketingOptOutMethodLabel: "Unsubscribe link",
      transactionalEmailsSent: true,
      crossBorderTransfers: true,
      transferMechanisms: ["sccs", "dpf"],
      transferMechanismLabels: ["SCCs", "Data Privacy Framework"],
      newsletterProvider: "Mailchimp",
      newsletterProviderId: "prov-mailchimp",
    });
    expect(context.security).toMatchObject({
      accessControl: {
        leastPrivilege: true,
        roleBasedAccess: true,
        accessReviewCadence: "quarterly",
        accessReviewCadenceLabel: "Quarterly",
        adminApprovalRequired: true,
      },
      authentication: {
        mfaRequired: true,
        ssoSupported: false,
        passwordManagerRequired: true,
      },
      encryption: {
        atRestAlgorithm: "aes_256",
        atRestAlgorithmLabel: "AES-256",
        inTransitMinimumTlsVersion: "tls_1_2",
        inTransitMinimumTlsVersionLabel: "TLS 1.2",
        keyManagementProvider: "aws_kms",
        keyManagementProviderLabel: "AWS KMS",
      },
      logging: {
        centralizedLogging: false,
        logRetentionDays: 365,
        securityMonitoringOwner: "security",
        securityMonitoringOwnerLabel: "Security",
      },
      vulnerabilityManagement: {
        scanningCadence: "weekly",
        scanningCadenceLabel: "Weekly",
        patchingSlaCriticalDays: 7,
        patchingSlaHighDays: 30,
      },
      incidentResponse: {
        planExists: true,
        notificationTimeline: "within_72_hours",
        notificationTimelineLabel: "Within 72 hours",
        customerNotificationProcess: "email_notice",
        customerNotificationProcessLabel: "Email notice",
        lastTestedDate: "2026-05-21",
      },
      backups: {
        backupCadence: "daily",
        backupCadenceLabel: "Daily",
        backupRetentionDays: 30,
        restoreTestingCadence: "quarterly",
        restoreTestingCadenceLabel: "Quarterly",
      },
      vendorRisk: {
        vendorReviewRequired: true,
        vendorReviewCadence: "annually",
        vendorReviewCadenceLabel: "Annually",
        dpaRequiredForProcessors: true,
      },
    });
  });

  it("renders the subprocessors system template with data processors", async () => {
    const templatePath = fileURLToPath(
      new URL("../data/templates/subprocessors.md", import.meta.url),
    );
    const systemTemplate = parseSystemTemplate(
      await readFile(templatePath, "utf8"),
      "subprocessors.md",
    );
    const context = new ReportContextBuilder().build({
      organization: {
        id: "org-test",
        ...profileBody,
        services: [storedService],
        createdAt: "2026-05-15T00:00:00.000Z",
        updatedAt: "2026-05-15T00:00:00.000Z",
      },
      businessActivities: [],
      vendors: [
        {
          id: "vendor-limited",
          ...vendorBody,
          createdAt: "2026-05-15T00:00:00.000Z",
          updatedAt: "2026-05-15T00:00:00.000Z",
        },
        {
          id: "vendor-subprocessor",
          ...subprocessorBody,
          createdAt: "2026-05-15T00:00:00.000Z",
          updatedAt: "2026-05-15T00:00:00.000Z",
        },
      ],
      serviceVendorUses: [
        {
          id: "vendor-use-limited",
          ...vendorUseBody,
          vendorName: "GitHub",
          serviceName: "Acme AI Platform",
          createdAt: "2026-05-15T00:00:00.000Z",
          updatedAt: "2026-05-15T00:00:00.000Z",
        },
        {
          id: "vendor-use-subprocessor",
          ...subprocessorUseBody,
          vendorName: "Stripe",
          serviceName: "Acme AI Platform",
          createdAt: "2026-05-15T00:00:00.000Z",
          updatedAt: "2026-05-15T00:00:00.000Z",
        },
      ],
    });
    const renderedContent = new Jinja2Renderer().render(
      {
        id: "template-subprocessors",
        organizationId: "org-test",
        sourceSystemTemplateSlug: systemTemplate.slug,
        versionMajor: 1,
        versionMinor: 0,
        createdAt: "2026-05-15T00:00:00.000Z",
        updatedAt: "2026-05-15T00:00:00.000Z",
        ...systemTemplate,
      },
      context,
    );

    expect(renderedContent).toContain("# Acme AI Data Processors and Subprocessors");
    expect(renderedContent).toContain("## Acme AI Platform");
    expect(renderedContent).toContain(
      "| GitHub |  | Acme AI Platform | limited | Code hosting and pull requests | Customer account data | us | signed |",
    );
    expect(renderedContent).toContain(
      "| Stripe |  | Acme AI Platform | subprocessor | Payment processing | Customer account data | us, eu | signed |",
    );
  });

  it("previews draft templates without generating documents", async () => {
    const app = await createTestApp();
    await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: profileBody,
    });

    const response = await app.inject({
      method: "POST",
      url: "/organizations/org-test/templates/preview",
      payload: {
        name: "Security Policy",
        content:
          "# {{ company.name }} Security Policy\nVersion {{ policy.version }}\n",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      renderedContent: "# Acme AI Security Policy\nVersion 1.0\n",
    });

    const documentsResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/documents",
    });
    expect(documentsResponse.json()).toEqual([]);
  });

  it("returns structured errors for invalid template previews", async () => {
    const app = await createTestApp();
    const response = await app.inject({
      method: "POST",
      url: "/organizations/org-test/templates/preview",
      payload: {
        name: "Broken Policy",
        content: "{% if company.name %}",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("TEMPLATE_RENDER_FAILED");
  });

  it("copies, edits, and deletes organization templates", async () => {
    const app = await createTestApp();
    const createResponse = await app.inject({
      method: "POST",
      url: "/organizations/org-test/templates",
      payload: { sourceSystemTemplateSlug: "incident-response-plan" },
    });

    expect(createResponse.statusCode).toBe(201);
    const createdTemplate = createResponse.json();
    expect(createdTemplate).toMatchObject({
      name: "Incident Response Plan",
      slug: "incident-response-plan",
      sourceSystemTemplateSlug: "incident-response-plan",
      content: "# {{ company.name }} Incident Response Plan\n",
    });

    const updateResponse = await app.inject({
      method: "PUT",
      url: `/organizations/org-test/templates/${createdTemplate.id}`,
      payload: {
        name: "Customer Incident Response Plan",
        content: "# Updated policy\n",
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toMatchObject({
      name: "Customer Incident Response Plan",
      slug: "incident-response-plan",
      sourceSystemTemplateSlug: "incident-response-plan",
      content: "# Updated policy\n",
    });

    const listResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/templates",
    });
    expect(listResponse.json().organizationTemplates).toHaveLength(1);

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: `/organizations/org-test/templates/${createdTemplate.id}`,
    });
    expect(deleteResponse.statusCode).toBe(204);
  });

  it("creates custom organization templates from scratch", async () => {
    const app = await createTestApp();
    const createResponse = await app.inject({
      method: "POST",
      url: "/organizations/org-test/templates",
      payload: {
        name: "Custom Policy",
        content: "# Custom policy\n",
      },
    });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.json()).toMatchObject({
      name: "Custom Policy",
      slug: "custom-policy",
      sourceSystemTemplateSlug: null,
      content: "# Custom policy\n",
    });

    const duplicateResponse = await app.inject({
      method: "POST",
      url: "/organizations/org-test/templates",
      payload: {
        name: "Custom Policy",
        content: "# Duplicate\n",
      },
    });

    expect(duplicateResponse.statusCode).toBe(409);
    expect(duplicateResponse.json().error.code).toBe("TEMPLATE_SLUG_EXISTS");

    const documentsResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/documents",
    });

    expect(documentsResponse.statusCode).toBe(200);
    expect(documentsResponse.json()).toMatchObject([
      {
        template: {
          id: createResponse.json().id,
          slug: "custom-policy",
          sourceSystemTemplateSlug: null,
        },
        document: null,
        status: "not_generated",
      },
    ]);
  });

  it("rejects missing system templates", async () => {
    const app = await createTestApp();
    const response = await app.inject({
      method: "POST",
      url: "/organizations/org-test/templates",
      payload: { sourceSystemTemplateSlug: "missing-template" },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe("SYSTEM_TEMPLATE_NOT_FOUND");
  });

  it("implements automatic template versioning that increments versionMinor on save if a document exists for the current template version", async () => {
    const app = await createTestApp();
    await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: profileBody,
    });

    // 1. Create a template from scratch. New templates start at v1.0.
    const createResponse = await app.inject({
      method: "POST",
      url: "/organizations/org-test/templates",
      payload: {
        name: "Versioning Test Policy",
        content: "# Versioning test policy\n",
      },
    });
    expect(createResponse.statusCode).toBe(201);
    let template = createResponse.json();
    expect(template.versionMajor).toBe(1);
    expect(template.versionMinor).toBe(0);

    // 2. Update the template *before* generating a document. It should stay at v1.0.
    const update1Response = await app.inject({
      method: "PUT",
      url: `/organizations/org-test/templates/${template.id}`,
      payload: {
        name: "Versioning Test Policy",
        content: "# Versioning test policy (updated once)\n",
      },
    });
    expect(update1Response.statusCode).toBe(200);
    template = update1Response.json();
    expect(template.versionMajor).toBe(1);
    expect(template.versionMinor).toBe(0);

    // 3. Generate a document for the current version (v1.0).
    const docResponse1 = await app.inject({
      method: "POST",
      url: `/organizations/org-test/documents`,
      payload: {
        templateId: template.id,
      },
    });
    expect(docResponse1.statusCode).toBe(201);
    const document1 = docResponse1.json();
    expect(document1.templateVersionMajor).toBe(1);
    expect(document1.templateVersionMinor).toBe(0);

    // 4. Update the template now that a document exists for v1.0. It should auto-increment versionMinor to 1 (v1.1).
    const update2Response = await app.inject({
      method: "PUT",
      url: `/organizations/org-test/templates/${template.id}`,
      payload: {
        name: "Versioning Test Policy",
        content: "# Versioning test policy (updated twice)\n",
      },
    });
    expect(update2Response.statusCode).toBe(200);
    template = update2Response.json();
    expect(template.versionMajor).toBe(1);
    expect(template.versionMinor).toBe(1);

    // 5. Update the template again *without* generating a document for v1.1. It should stay at v1.1.
    const update3Response = await app.inject({
      method: "PUT",
      url: `/organizations/org-test/templates/${template.id}`,
      payload: {
        name: "Versioning Test Policy",
        content: "# Versioning test policy (updated thrice)\n",
      },
    });
    expect(update3Response.statusCode).toBe(200);
    template = update3Response.json();
    expect(template.versionMajor).toBe(1);
    expect(template.versionMinor).toBe(1);

    // 6. Generate/update document for the current version (v1.1).
    const docResponse2 = await app.inject({
      method: "POST",
      url: `/organizations/org-test/documents`,
      payload: {
        templateId: template.id,
      },
    });
    expect(docResponse2.statusCode).toBe(201);
    const document2 = docResponse2.json();
    expect(document2.templateVersionMajor).toBe(1);
    expect(document2.templateVersionMinor).toBe(1);

    // 7. Update the template again. Since a document exists for v1.1, it should auto-increment to v1.2.
    const update4Response = await app.inject({
      method: "PUT",
      url: `/organizations/org-test/templates/${template.id}`,
      payload: {
        name: "Versioning Test Policy",
        content: "# Versioning test policy (updated four times)\n",
      },
    });
    expect(update4Response.statusCode).toBe(200);
    template = update4Response.json();
    expect(template.versionMajor).toBe(1);
    expect(template.versionMinor).toBe(2);

    // 8. List summaries and verify multiple document versions are preserved and returned in the documents list
    const listResponse = await app.inject({
      method: "GET",
      url: `/organizations/org-test/documents`,
    });
    expect(listResponse.statusCode).toBe(200);
    const summaries = listResponse.json();
    const testSummary = summaries.find((s: any) => s.template.id === template.id);
    expect(testSummary).toBeDefined();
    expect(testSummary.documents).toHaveLength(2);
    expect(testSummary.documents[0].id).toBe(document2.id); // Sorted descending, so newest first (v1.1)
    expect(testSummary.documents[1].id).toBe(document1.id); // Then older (v1.0)
  });

  it("generates documents from templates and reports stale documents", async () => {
    const app = await createTestApp();
    await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: profileBody,
    });
    const createTemplateResponse = await app.inject({
      method: "POST",
      url: "/organizations/org-test/templates",
      payload: { sourceSystemTemplateSlug: "incident-response-plan" },
    });
    const template = createTemplateResponse.json();

    await app.inject({
      method: "PUT",
      url: `/organizations/org-test/templates/${template.id}`,
      payload: {
        name: "Incident Response Plan",
        content:
          '# {{ company.name }} Incident Response Plan\n\nService {{ service.name }} for {{ service.userTypeLabels | join(", ") }}\nPrivacy rights: {{ privacy.supportedRightLabels | join(", ") }}\nVersion {{ policy.version }}\n',
      },
    });

    const emptyDocumentsResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/documents",
    });
    expect(emptyDocumentsResponse.statusCode).toBe(200);
    expect(emptyDocumentsResponse.json()).toMatchObject([
      {
        template: { id: template.id, slug: "incident-response-plan" },
        document: null,
        status: "not_generated",
      },
    ]);

    const generateResponse = await app.inject({
      method: "POST",
      url: "/organizations/org-test/documents",
      payload: { templateId: template.id },
    });

    expect(generateResponse.statusCode).toBe(201);
    expect(generateResponse.json()).toMatchObject({
      templateId: template.id,
      title: "Incident Response Plan",
      renderedContent:
        "# Acme AI Incident Response Plan\n\nService Acme AI Platform for Workspace admins, End users\nPrivacy rights: Access, Deletion, Correction, Opt-out\nVersion 1.0\n",
      hasPdf: false,
    });
    expect(generateResponse.json().sourceHash).toHaveLength(64);

    const currentDocumentsResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/documents",
    });
    expect(currentDocumentsResponse.json()).toMatchObject([
      {
        document: { id: generateResponse.json().id },
        status: "current",
      },
    ]);

    await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: {
        ...profileBody,
        privacy: {
          ...profileBody.privacy,
          supportedRights: ["access", "deletion"],
        },
      },
    });
    const privacyStaleDocumentsResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/documents",
    });
    expect(privacyStaleDocumentsResponse.json()).toMatchObject([
      {
        document: { id: generateResponse.json().id },
        status: "stale",
      },
    ]);

    await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: profileBody,
    });
    const restoredDocumentsResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/documents",
    });
    expect(restoredDocumentsResponse.json()).toMatchObject([
      {
        document: { id: generateResponse.json().id },
        status: "current",
      },
    ]);

    await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: {
        ...profileBody,
        services: [
          {
            ...serviceBody,
            privacy: {
              ...serviceBody.privacy,
              primaryHostingRegion: "eu",
            },
          },
        ],
      },
    });
    const transferStaleDocumentsResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/documents",
    });
    expect(transferStaleDocumentsResponse.json()).toMatchObject([
      {
        document: { id: generateResponse.json().id },
        status: "stale",
      },
    ]);

    await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: profileBody,
    });

    await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: {
        ...profileBody,
        infrastructure: {
          ...profileBody.infrastructure,
          logRetentionDays: 180,
        },
      },
    });
    const securityStaleDocumentsResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/documents",
    });
    expect(securityStaleDocumentsResponse.json()).toMatchObject([
      {
        document: { id: generateResponse.json().id },
        status: "stale",
      },
    ]);

    await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: profileBody,
    });

    await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: {
        ...profileBody,
        services: [
          {
            ...serviceBody,
            privacy: {
              ...serviceBody.privacy,
              cookieTrackingCategories: [
                "necessary",
                "analytics",
                "preference",
              ],
            },
          },
        ],
      },
    });
    const cookieStaleDocumentsResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/documents",
    });
    expect(cookieStaleDocumentsResponse.json()).toMatchObject([
      {
        document: { id: generateResponse.json().id },
        status: "stale",
      },
    ]);

    await app.inject({
      method: "PUT",
      url: "/organizations/org-test/security-profile",
      payload: profileBody,
    });

    const duplicateResponse = await app.inject({
      method: "POST",
      url: "/organizations/org-test/documents",
      payload: { templateId: template.id },
    });
    expect(duplicateResponse.statusCode).toBe(201);

    const documentResponse = await app.inject({
      method: "GET",
      url: `/organizations/org-test/documents/${generateResponse.json().id}`,
    });
    expect(documentResponse.statusCode).toBe(200);
    expect(documentResponse.json().renderedContent).toBe(
      "# Acme AI Incident Response Plan\n\nService Acme AI Platform for Workspace admins, End users\nPrivacy rights: Access, Deletion, Correction, Opt-out\nVersion 1.0\n",
    );

    await app.inject({
      method: "PUT",
      url: `/organizations/org-test/templates/${template.id}`,
      payload: {
        name: "Security Policy",
        content:
          '# {{ company.name }} Security Policy\n\nService {{ service.name }} for {{ service.userTypeLabels | join(", ") }}\nPrivacy rights: {{ privacy.supportedRightLabels | join(", ") }}\nVersion {{ policy.version }}\n',
      },
    });

    const staleDocumentsResponse = await app.inject({
      method: "GET",
      url: "/organizations/org-test/documents",
    });
    expect(staleDocumentsResponse.json()).toMatchObject([
      {
        document: { id: generateResponse.json().id },
        status: "stale",
      },
    ]);
  });

  it("rejects document generation for missing templates", async () => {
    const app = await createTestApp();
    const response = await app.inject({
      method: "POST",
      url: "/organizations/org-test/documents",
      payload: { templateId: "template_missing" },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe("TEMPLATE_NOT_FOUND");
  });
});
