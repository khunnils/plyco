import {
  documentSourceFingerprint,
  templateSourceHash,
  referencedTemplatePaths,
} from "./document-generation.js";
import {
  renderDocumentHtml,
  renderPublicDocumentPage,
} from "../../infrastructure/document-html.js";
import { documentPlainText } from "../../infrastructure/document-text.js";
import { FileSystemTemplateSource } from "../../infrastructure/system-templates.js";
import {
  loadTemplateVariableCatalog,
  validateTemplateReferences,
} from "./template-llm.js";
import { describe, expect, it } from "vitest";
import {
  emptyAccessProfile,
  emptyCompanyProfile,
  emptyDataHandlingProfile,
  emptyInfrastructureProfile,
  emptyPrivacyProfile,
  emptySecurityProfile,
  emptyServiceProfile,
  type SecurityProgramSnapshot,
  type Template,
  type Vocabulary,
} from "@plyco/contracts";

import { Jinja2Renderer, ReportContextBuilder } from "./document-generation.js";

const timestamp = "2026-06-01T00:00:00.000Z";

const template = (content: string): Template => ({
  id: "template_1",
  organizationId: "org_1",
  name: "Privacy Policy",
  slug: "privacy-policy",
  sourceSystemTemplateSlug: null,
  content,
  isPublic: false,
  versionMajor: 1,
  versionMinor: 0,
  createdAt: timestamp,
  updatedAt: timestamp,
});

const vocabulary: Vocabulary = {
  codeSets: [
    {
      id: "code_set_cookie_consent",
      codeSetId: "privacy_cookie_consent_mechanisms",
      name: "Cookie consent mechanisms",
      description: "",
      usesHints: false,
      isSystem: true,
      codes: [
        {
          id: "code_cookie_consent_none",
          codeId: "none",
          name: "None",
          description: "",
          sortOrder: 0,
          active: true,
          isSystem: true,
        },
      ],
    },
    {
      id: "code_set_key_management",
      codeSetId: "security_key_management_providers",
      name: "Security key management providers",
      description: "",
      usesHints: false,
      isSystem: true,
      codes: [
        {
          id: "code_key_management_none",
          codeId: "none",
          name: "None",
          description: "",
          sortOrder: 0,
          active: true,
          isSystem: true,
        },
      ],
    },
  ],
};

const snapshot: SecurityProgramSnapshot = {
  organization: {
    id: "org_1",
    company: {
      ...emptyCompanyProfile,
      companyName: "Acme",
    },
    services: [
      {
        ...emptyServiceProfile,
        id: "service_1",
        serviceName: "Acme App",
        privacy: {
          ...emptyServiceProfile.privacy,
          usesCookiesOrTrackingTechnologies: true,
          cookieConsentMechanism: "none",
        },
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    privacy: {
      ...emptyPrivacyProfile,
      organizationProviders: [
        {
          systemType: "newsletter",
          providerId: "none",
          name: "None",
        },
      ],
    },
    infrastructure: {
      ...emptyInfrastructureProfile,
      keyManagementProvider: "none",
    },
    security: emptySecurityProfile,
    dataHandling: emptyDataHandlingProfile,
    access: emptyAccessProfile,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  businessActivities: [],
  organizationProviders: [],
  serviceProviderUsage: [],
};

describe("ReportContextBuilder", () => {
  it("does not expose the none sentinel as generated display text", () => {
    const context = new ReportContextBuilder().build(
      snapshot,
      template(""),
      [],
      vocabulary,
    );
    const rendered = new Jinja2Renderer().render(
      template(
        [
          "{% if service.privacy.cookieConsentMechanismLabel %}You can manage your preferences through {{ service.privacy.cookieConsentMechanismLabel }}.{% endif %}",
          "{% if privacy.newsletterProvider %}We use {{ privacy.newsletterProvider }} to manage email communications.{% endif %}",
          '{% if security.encryption.keyManagementProvider == "none" %}Raw sentinel is still available.{% endif %}',
        ].join("\n"),
      ),
      context,
    );

    expect(rendered).not.toContain("None");
    expect(rendered).not.toContain("none");
    expect(rendered).not.toContain("You can manage your preferences through");
    expect(rendered).not.toContain("We use  to manage email communications");
    expect(rendered).toContain("Raw sentinel is still available.");
  });
});

const notedSnapshot = (): SecurityProgramSnapshot => {
  const next = structuredClone(snapshot);
  next.organization!.security.codeReviewRequired = true;
  next.organization!.security.fieldNotes = {
    codeReviewRequired: {
      customerFacing: "GitHub required reviewers",
      internal: "PRIVATE BRANCH SETTINGS",
    },
  };
  return next;
};

describe("customer-facing field notes in documents", () => {
  it("places notes under the statement's inclusion conditions", async () => {
    const source = (
      await new FileSystemTemplateSource().listSystemTemplates()
    ).find((item) => item.slug === "data-security-policy")!;
    const next = notedSnapshot();
    const renderer = new Jinja2Renderer();
    const builder = new ReportContextBuilder();
    const content = renderer.render(
      template(source.content),
      builder.build(next),
    );
    expect(content).toContain(
      "Code changes require review before they are merged. GitHub required reviewers",
    );
    expect(content).not.toContain("PRIVATE BRANCH SETTINGS");
    next.organization!.security.codeReviewRequired = false;
    const omitted = renderer.render(
      template(source.content),
      builder.build(next),
    );
    expect(omitted).not.toContain("GitHub required reviewers");
  });


  it("renders field notes in the selected conditional branch and inside their table cells", async () => {
    const sources = await new FileSystemTemplateSource().listSystemTemplates();
    const next = notedSnapshot();
    next.organization!.company.securityContactEmail = "security@example.com";
    next.organization!.company.contactEmail = "contact@example.com";
    next.organization!.company.fieldNotes = {
      securityContactEmail: { customerFacing: "SECURITY CONTACT NOTE", internal: "" },
      contactEmail: { customerFacing: "FALLBACK CONTACT NOTE", internal: "" },
      handlesPersonalData: { customerFacing: "PERSONAL DATA NOTE", internal: "" },
    };
    next.organization!.services[0]!.fieldNotes = {
      processesCustomerData: { customerFacing: "SERVICE DATA NOTE", internal: "" },
    };
    const render = (slug: string) => new Jinja2Renderer().render(
      template(sources.find((source) => source.slug === slug)!.content),
      new ReportContextBuilder().build(next),
    );
    const security = render("data-security-policy");
    expect(security).toContain("SECURITY CONTACT NOTE");
    expect(security).not.toContain("FALLBACK CONTACT NOTE");
    next.organization!.company.securityContactEmail = null;
    const fallback = render("data-security-policy");
    expect(fallback).not.toContain("SECURITY CONTACT NOTE");
    expect(fallback).toContain("FALLBACK CONTACT NOTE");
    const questionnaire = render("security-questionnaire-response-pack");
    expect(questionnaire.split("\n").find((line) => line.includes("Handles personal data"))).toMatch(/PERSONAL DATA NOTE.*\|$/);
    expect(questionnaire.split("\n").find((line) => line.includes("SERVICE DATA NOTE"))).toMatch(/Yes<br.*SERVICE DATA NOTE.*\|.*\|$/);
    expect(renderDocumentHtml(questionnaire)).toContain("SERVICE DATA NOTE");
  });

  it("keeps literal markup, template syntax, pipes, and line breaks across rendering paths", () => {
    const next = notedSnapshot();
    const text =
      "**GitHub** | <script>alert(1)</script>\n{{ organization.name }} & tools";
    next.organization!.security.fieldNotes!.codeReviewRequired!.customerFacing =
      text;
    const context = new ReportContextBuilder().build(next);
    const content = new Jinja2Renderer().render(
      template(
        "{{ security.developmentSecurity.customerNotes.codeReviewRequired }}",
      ),
      context,
    );
    expect(content).not.toContain("&amp;#");
    expect(content).toContain("&#124;");
    expect(content).toContain("<br />");
    expect(content).not.toContain("Acme");
    const html = renderDocumentHtml(content);
    expect(html).not.toContain("<strong>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("<br");
    expect(documentPlainText(content)).toBe(text);
    const page = renderPublicDocumentPage({
      title: "Policy",
      organizationName: "Acme",
      generatedAt: timestamp,
      bodyHtml: html,
    });
    expect(page).not.toContain("PRIVATE BRANCH SETTINGS");
    expect(page).not.toContain("<script>");
  });

  it("never exposes internal notes or raw note maps, including record collections", () => {
    const next = notedSnapshot();
    const internalOnly = { customerFacing: "", internal: "INTERNAL ONLY" };
    next.organization!.company.fieldNotes = { companyName: internalOnly };
    next.organization!.access.fieldNotes = { leastPrivilege: internalOnly };
    next.organization!.infrastructure.fieldNotes = {
      backupsEnabled: internalOnly,
    };
    next.organization!.privacy.fieldNotes = { supportedRights: internalOnly };
    next.organization!.services[0]!.fieldNotes = { serviceName: internalOnly };
    next.organization!.services[0]!.privacy.fieldNotes = {
      cookieConsentMechanism: internalOnly,
    };
    next.organization!.dataHandling.dataTypesStored = [
      {
        id: "d",
        sortOrder: 0,
        name: "Email",
        description: null,
        subjectTypes: null,
        collectionMethods: null,
        isSensitive: null,
        isRequired: null,
        fieldNotes: { name: internalOnly },
      },
    ];
    const context = new ReportContextBuilder().build(next);
    expect(JSON.stringify(context)).not.toMatch(
      /INTERNAL ONLY|PRIVATE BRANCH SETTINGS|fieldNotes|fieldNotesAnswered/,
    );
    const source = template(
      "{{ security.developmentSecurity.customerNotes.codeReviewRequired }}",
    );
    expect(
      JSON.stringify(documentSourceFingerprint(source, context)),
    ).not.toMatch(/INTERNAL ONLY|PRIVATE BRANCH SETTINGS/);
  });

  it("fingerprints referenced public notes while ignoring internal and unreferenced notes", () => {
    const next = notedSnapshot();
    const source = template(
      "{{ security.developmentSecurity.customerNotes.codeReviewRequired }}",
    );
    const builder = new ReportContextBuilder();
    const hash = () => templateSourceHash(source, builder.build(next));
    const initial = hash();
    next.organization!.security.fieldNotes!.codeReviewRequired!.internal =
      "Changed internal";
    expect(hash()).toBe(initial);
    next.organization!.security.fieldNotes!.secretScanning = {
      customerFacing: "Another field",
      internal: "",
    };
    expect(hash()).toBe(initial);
    next.organization!.security.fieldNotes!.codeReviewRequired!.customerFacing =
      "GitLab reviews";
    expect(hash()).not.toBe(initial);
  });

  it("declares every built-in template note reference in the public variable catalog", async () => {
    const catalog = await loadTemplateVariableCatalog();
    const templates =
      await new FileSystemTemplateSource().listSystemTemplates();
    for (const source of templates) {
      const noteReferences = referencedTemplatePaths(source.content).filter(
        (path) => path.includes(".customerNotes."),
      );
      expect(
        () =>
          validateTemplateReferences(
            noteReferences.map((path) => `{{ ${path} }}`).join("\n"),
            catalog,
          ),
        source.slug,
      ).not.toThrow();
      expect(
        () =>
          new Jinja2Renderer().render(
            template(source.content),
            new ReportContextBuilder().build(notedSnapshot()),
          ),
        source.slug,
      ).not.toThrow();
    }
    expect(JSON.stringify(catalog)).not.toContain(".internal");
  });
});
