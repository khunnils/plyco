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
} from "@plyco/shared";

import { Jinja2Renderer, ReportContextBuilder } from "./document-generation.js";

const timestamp = "2026-06-01T00:00:00.000Z";

const template = (content: string): Template => ({
  id: "template_1",
  organizationId: "org_1",
  name: "Privacy Policy",
  slug: "privacy-policy",
  sourceSystemTemplateSlug: null,
  content,
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
          "{% if security.encryption.keyManagementProvider == \"none\" %}Raw sentinel is still available.{% endif %}",
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
