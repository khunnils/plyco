import {
  emptyAccessProfile,
  emptyCompanyProfile,
  emptyDataHandlingProfile,
  emptyInfrastructureProfile,
  emptyPrivacyProfile,
  emptySecurityProfile,
  type BusinessActivity,
  type OrganizationProvider,
  type OrganizationSecurityProfile,
  type SecurityProgramSnapshot,
  type ServiceProviderUsage,
} from "@plyco/shared"
import { describe, expect, it } from "vitest"

import { buildProductDataGraph } from "@/features/company/graph/lib/product-data-graph"

const now = "2026-01-01T00:00:00.000Z"

const activity = (
  id: string,
  name: string,
  dataTypeIds: string[] = []
): BusinessActivity => ({
  id,
  sortOrder: 0,
  name,
  purpose: `${name} purpose`,
  role: "controller",
  legalBasis: [],
  dataTypeIds,
  retentionPolicy: null,
  retentionDays: 0,
  createdAt: now,
  updatedAt: now,
})

const provider = (id: string, name: string): OrganizationProvider => ({
  id,
  providerId: id,
  systemTypes: [],
  name,
  legalName: "",
  category: "",
  countryOfRegistration: "",
  criticality: "medium",
  notes: "",
  purpose: "",
  createdAt: now,
  updatedAt: now,
})

const usage = (
  input: Pick<
    ServiceProviderUsage,
    "id" | "serviceId" | "organizationProviderId" | "dataProcessed"
  >
): ServiceProviderUsage => ({
  ...input,
  serviceName: "",
  providerName: "",
  systemType: null,
  purpose: "Runs the service",
  dataProcessingLevel: "limited",
  dpaStatus: null,
  dataRegions: [],
  notes: "",
  createdAt: now,
  updatedAt: now,
})

const snapshot = (
  overrides: Partial<SecurityProgramSnapshot> = {}
): SecurityProgramSnapshot => {
  const organization: OrganizationSecurityProfile = {
    id: "org_1",
    company: {
      ...emptyCompanyProfile,
      companyName: "Acme",
      website: "https://acme.example",
    },
    services: [
      {
        id: "svc_1",
        sortOrder: 0,
        serviceName: "App",
        serviceDescription: "Customer app",
        serviceUrl: "https://app.example",
        businessActivityIds: ["act_1"],
        userTypes: null,
        customerTypes: null,
        availabilityRegions: null,
        childrenDirected: null,
        minimumUserAge: null,
        privacy: {
          usesCookiesOrTrackingTechnologies: null,
          cookieTrackingCategories: null,
          cookieConsentMechanism: null,
          doNotTrackResponse: null,
          globalPrivacyControlSupported: null,
          primaryHostingRegion: null,
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "svc_2",
        sortOrder: 1,
        serviceName: "Admin",
        serviceDescription: null,
        serviceUrl: null,
        businessActivityIds: [],
        userTypes: null,
        customerTypes: null,
        availabilityRegions: null,
        childrenDirected: null,
        minimumUserAge: null,
        privacy: {
          usesCookiesOrTrackingTechnologies: null,
          cookieTrackingCategories: null,
          cookieConsentMechanism: null,
          doNotTrackResponse: null,
          globalPrivacyControlSupported: null,
          primaryHostingRegion: null,
        },
        createdAt: now,
        updatedAt: now,
      },
    ],
    privacy: emptyPrivacyProfile,
    infrastructure: emptyInfrastructureProfile,
    security: emptySecurityProfile,
    dataHandling: {
      ...emptyDataHandlingProfile,
      dataTypesStored: [
        {
          id: "data_email",
          sortOrder: 0,
          name: "Email Address",
          description: "User emails",
          subjectTypes: null,
          collectionMethods: null,
          isSensitive: null,
          isRequired: null,
        },
      ],
    },
    access: emptyAccessProfile,
    createdAt: now,
    updatedAt: now,
  }

  return {
    organization,
    businessActivities: [
      activity("act_1", "Account management", ["data_email"]),
    ],
    organizationProviders: [provider("prov_1", "Stripe")],
    serviceProviderUsage: [
      usage({
        id: "use_1",
        serviceId: "svc_1",
        organizationProviderId: "prov_1",
        dataProcessed: ["Email Address"],
      }),
    ],
    ...overrides,
  }
}

describe("buildProductDataGraph", () => {
  it("creates company and service nodes with company edges", () => {
    const graph = buildProductDataGraph(snapshot())

    expect(graph.nodes.map((node) => node.id)).toEqual(
      expect.arrayContaining(["company", "service:svc_1", "service:svc_2"])
    )
    expect(graph.edges.map((edge) => edge.id)).toEqual(
      expect.arrayContaining(["company-to-svc_1", "company-to-svc_2"])
    )
  })

  it("connects activities only to services that reference them", () => {
    const graph = buildProductDataGraph(snapshot())

    expect(graph.edges.map((edge) => edge.id)).toContain(
      "service-svc_1-to-activity-act_1"
    )
    expect(graph.edges.map((edge) => edge.id)).not.toContain(
      "service-svc_2-to-activity-act_1"
    )
  })

  it("connects data types through service provider usage", () => {
    const graph = buildProductDataGraph(snapshot())

    expect(graph.nodes.map((node) => node.id)).toContain("data:email-address")
    expect(graph.edges.map((edge) => edge.id)).toEqual(
      expect.arrayContaining([
        "service-svc_1-to-data-email-address",
        "data-email-address-to-provider-prov_1-use_1",
      ])
    )
  })

  it("connects activities to mapped data types", () => {
    const graph = buildProductDataGraph(snapshot())

    expect(graph.nodes.map((node) => node.id)).toContain("data:email-address")
    expect(graph.edges.map((edge) => edge.id)).toContain(
      "activity-act_1-to-data-data_email"
    )
  })

  it("lays out each relationship stage in a separate left-to-right column", () => {
    const graph = buildProductDataGraph(snapshot())
    const xPosition = (nodeId: string) =>
      graph.nodes.find((node) => node.id === nodeId)?.position.x

    expect([
      xPosition("company"),
      xPosition("service:svc_1"),
      xPosition("activity:act_1"),
      xPosition("data:email-address"),
      xPosition("provider:prov_1"),
    ]).toEqual([0, 340, 680, 1020, 1360])
  })

  it("ignores stale activity data type mappings", () => {
    const graph = buildProductDataGraph(
      snapshot({
        businessActivities: [
          activity("act_1", "Account management", ["data_missing"]),
        ],
      })
    )

    expect(graph.edges.map((edge) => edge.id)).not.toContain(
      "activity-act_1-to-data-data_missing"
    )
  })

  it("ignores provider usage data names that are not stored data types", () => {
    const graph = buildProductDataGraph(
      snapshot({
        serviceProviderUsage: [
          usage({
            id: "use_1",
            serviceId: "svc_1",
            organizationProviderId: "prov_1",
            dataProcessed: ["Unknown Data"],
          }),
        ],
      })
    )

    expect(graph.nodes.map((node) => node.id)).not.toContain(
      "data:unknown-data"
    )
    expect(graph.edges.map((edge) => edge.id)).not.toContain(
      "service-svc_1-to-data-unknown-data"
    )
  })

  it("adds a subdued direct service-provider edge when usage has no data", () => {
    const graph = buildProductDataGraph(
      snapshot({
        serviceProviderUsage: [
          usage({
            id: "use_1",
            serviceId: "svc_1",
            organizationProviderId: "prov_1",
            dataProcessed: [],
          }),
        ],
      })
    )
    const directEdge = graph.edges.find(
      (edge) => edge.id === "service-svc_1-to-provider-prov_1-use_1"
    )

    expect(directEdge).toMatchObject({
      source: "service:svc_1",
      target: "provider:prov_1",
      label: "usage",
    })
    expect(directEdge?.style).toMatchObject({ strokeDasharray: "5 5" })
  })
})
