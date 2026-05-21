import { createHash } from "node:crypto"

import nunjucks from "nunjucks"
import {
  type PrivacyProfile,
  type ServiceProfile,
  type SecurityProgramSnapshot,
  type OrganizationMember,
  type Template,
  type Vendor,
  type Vocabulary,
} from "@plyco/shared"

export type NormalizedTemplateContext = {
  organization: Record<string, unknown>
  company: Record<string, unknown>
  policy: Record<string, unknown>
  service: Record<string, unknown>
  services: {
    all: Array<Record<string, unknown>>
    primary: Record<string, unknown>
  }
  privacy: Record<string, unknown>
  infrastructure: Record<string, unknown>
  dataHandling: Record<string, unknown>
  access: Record<string, unknown>
  vendors: {
    all: Array<Record<string, unknown>>
    dataProcessors: Array<Record<string, unknown>>
    subprocessors: Array<Record<string, unknown>>
    byService: Array<Record<string, unknown>>
  }
}

export class ReportContextBuilder {
  build(
    snapshot: SecurityProgramSnapshot,
    template?: Template,
    members: OrganizationMember[] = [],
    vocabulary?: Vocabulary,
  ): NormalizedTemplateContext {
    const organization = snapshot.organization
    const organizationContext = organization
      ? {
          ...organization.company,
          name: organization.company.companyName,
        }
      : {}
    const vendors = snapshot.vendors.map((vendor) => this.vendorContext(vendor))
    const services = organization
      ? organization.services.map((service) =>
          this.serviceContext(service, vocabulary),
        )
      : []
    const primaryService = services[0] ?? {}

    return {
      organization: organizationContext,
      company: organizationContext,
      policy: template ? this.policyContext(template, members) : {},
      service: primaryService,
      services: {
        all: services,
        primary: primaryService,
      },
      privacy: organization
        ? this.privacyContext(organization.privacy, vocabulary)
        : {},
      infrastructure: organization?.infrastructure ?? {},
      dataHandling: organization?.dataHandling ?? {},
      access: organization?.access ?? {},
      vendors: {
        all: vendors,
        dataProcessors: vendors.filter((vendor) =>
          ["limited", "subprocessor"].includes(
            String(vendor.dataProcessingLevel),
          ),
        ),
        subprocessors: vendors.filter(
          (vendor) => vendor.dataProcessingLevel === "subprocessor",
        ),
        byService: this.vendorsByService(services, vendors),
      },
    }
  }

  private policyContext(template: Template, members: OrganizationMember[]) {
    const owner = members.find(
      (member) => member.userId === template.policyOwnerUserId,
    )
    const approver = members.find(
      (member) => member.userId === template.policyApproverUserId,
    )

    return {
      effectiveDate: template.policyEffectiveDate,
      lastReviewedDate: template.policyLastReviewedDate,
      version: template.policyVersion,
      ownerUserId: template.policyOwnerUserId,
      ownerName: owner?.name ?? "",
      ownerEmail: owner?.email ?? "",
      approverUserId: template.policyApproverUserId,
      approverName: approver?.name ?? "",
      approverEmail: approver?.email ?? "",
      reviewCadence: template.policyReviewCadence,
    }
  }

  private serviceContext(service: ServiceProfile, vocabulary?: Vocabulary) {
    return {
      id: service.id,
      name: service.serviceName,
      description: service.serviceDescription,
      url: service.serviceUrl,
      userTypes: service.userTypes,
      userTypeLabels: this.codeLabels(
        vocabulary,
        "service_user_types",
        service.userTypes,
      ),
      customerTypes: service.customerTypes,
      customerTypeLabels: this.codeLabels(
        vocabulary,
        "service_customer_types",
        service.customerTypes,
      ),
      availabilityRegions: service.availabilityRegions,
      availabilityRegionLabels: this.codeLabels(
        vocabulary,
        "regions",
        service.availabilityRegions,
      ),
      childrenDirected: service.childrenDirected,
      minimumUserAge: service.minimumUserAge,
    }
  }

  private privacyContext(privacy: PrivacyProfile, vocabulary?: Vocabulary) {
    return {
      supportedRights: privacy.supportedRights,
      supportedRightLabels: this.codeLabels(
        vocabulary,
        "privacy_supported_rights",
        privacy.supportedRights,
      ),
      requestMethods: privacy.requestMethods,
      requestMethodLabels: this.codeLabels(
        vocabulary,
        "privacy_request_methods",
        privacy.requestMethods,
      ),
      responseTimelineDays: privacy.responseTimelineDays,
      identityVerificationRequired: privacy.identityVerificationRequired,
      authorizedAgentSupported: privacy.authorizedAgentSupported,
      appealProcessExists: privacy.appealProcessExists,
      usesCookies: privacy.usesCookies,
      cookieTypes: privacy.cookieTypes,
      cookieTypeLabels: this.codeLabels(
        vocabulary,
        "privacy_cookie_types",
        privacy.cookieTypes,
      ),
      analyticsProviders: this.providerNames(privacy, "analytics"),
      analyticsProviderIds: this.providerIds(privacy, "analytics"),
      advertisingProviders: this.providerNames(privacy, "advertising"),
      advertisingProviderIds: this.providerIds(privacy, "advertising"),
      cookieConsentMechanism: privacy.cookieConsentMechanism,
      cookieConsentMechanismLabel: privacy.cookieConsentMechanism
        ? this.codeLabels(
            vocabulary,
            "privacy_cookie_consent_mechanisms",
            [privacy.cookieConsentMechanism],
          )[0]
        : "",
      doNotTrackResponse: privacy.doNotTrackResponse,
      globalPrivacyControlSupported: privacy.globalPrivacyControlSupported,
      sendsMarketingEmails: privacy.sendsMarketingEmails,
      marketingOptOutMethod: privacy.marketingOptOutMethod,
      marketingOptOutMethodLabel: privacy.marketingOptOutMethod
        ? this.codeLabels(
            vocabulary,
            "privacy_marketing_opt_out_methods",
            [privacy.marketingOptOutMethod],
          )[0]
        : "",
      transactionalEmailsSent: privacy.transactionalEmailsSent,
      newsletterProvider: this.providerNames(privacy, "newsletter")[0] ?? "",
      newsletterProviderId: this.providerIds(privacy, "newsletter")[0] ?? "",
      crossBorderTransfers: privacy.crossBorderTransfers,
      transferMechanisms: privacy.transferMechanisms,
      transferMechanismLabels: this.codeLabels(
        vocabulary,
        "privacy_transfer_mechanisms",
        privacy.transferMechanisms,
      ),
      primaryHostingRegion: privacy.primaryHostingRegion,
      primaryHostingRegionLabel: privacy.primaryHostingRegion
        ? this.codeLabels(vocabulary, "regions", [privacy.primaryHostingRegion])[0]
        : "",
      dataResidencyOptions: privacy.dataResidencyOptions,
      dataResidencyOptionLabels: this.codeLabels(
        vocabulary,
        "regions",
        privacy.dataResidencyOptions,
      ),
      sellsOrSharesData: privacy.sellsOrSharesData,
      doNotSellLink: privacy.doNotSellLink,
      dpoName: privacy.dpoName,
      dpoEmail: privacy.dpoEmail,
      euRepresentativeName: privacy.euRepresentativeName,
      euRepresentativeAddress: privacy.euRepresentativeAddress,
      usesAutomatedDecisionMaking: privacy.usesAutomatedDecisionMaking,
    }
  }

  private providerIds(privacy: PrivacyProfile, systemType: string) {
    return privacy.organizationProviders
      .filter((provider) => provider.systemType === systemType)
      .map((provider) => provider.providerId)
  }

  private providerNames(privacy: PrivacyProfile, systemType: string) {
    return privacy.organizationProviders
      .filter((provider) => provider.systemType === systemType)
      .map((provider) => provider.name ?? provider.providerId)
  }

  private codeLabels(
    vocabulary: Vocabulary | undefined,
    codeSetId: string,
    values: string[],
  ) {
    const codeSet = vocabulary?.codeSets.find(
      (currentCodeSet) => currentCodeSet.codeSetId === codeSetId,
    )

    return values.map(
      (value) =>
        codeSet?.codes.find((code) => code.codeId === value)?.name ?? value,
    )
  }

  private vendorContext(vendor: Vendor) {
    return {
      serviceId: vendor.serviceId,
      serviceName: vendor.serviceName,
      name: vendor.name,
      category: vendor.category,
      purpose: vendor.purpose,
      countryOfRegistration: vendor.countryOfRegistration,
      hasSubprocessors: vendor.hasSubprocessors,
      dataProcessingLevel: vendor.dataProcessingLevel,
      dataProcessed: vendor.dataProcessed,
      dpaStatus: vendor.dpaStatus,
      dataRegions: vendor.dataRegions,
      criticality: vendor.criticality,
      owner: vendor.owner,
      notes: vendor.notes,
    }
  }

  private vendorsByService(
    services: Array<Record<string, unknown>>,
    vendors: Array<Record<string, unknown>>,
  ) {
    return services.map((service) => ({
      serviceId: service.id,
      serviceName: service.name,
      vendors: vendors.filter((vendor) => vendor.serviceId === service.id),
    }))
  }
}

export class Jinja2Renderer {
  render(template: Template, context: NormalizedTemplateContext): string {
    return nunjucks.renderString(template.content, context)
  }
}

export function templateSourceHash(
  template: Pick<Template, "content">,
  context: NormalizedTemplateContext,
) {
  return createHash("sha256")
    .update(stableStringify({ content: template.content, context }))
    .digest("hex")
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`
  }

  return JSON.stringify(value)
}
