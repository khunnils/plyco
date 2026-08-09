import { createFetchJsonClient, type FetchJsonClient } from "./api.js"
import { type OrgClientConfig } from "./config.js"

export type OrgClient = {
  getOverview: () => Promise<unknown>
  getProfile: () => Promise<unknown>
  getServices: () => Promise<unknown>
  getDataTypes: () => Promise<unknown>
  getPrivacyProfile: () => Promise<unknown>
  getInfrastructureProfile: () => Promise<unknown>
  getSecurityProfile: () => Promise<unknown>
  getAccessProfile: () => Promise<unknown>
  getActivities: () => Promise<unknown>
  getOrganizationProviders: () => Promise<unknown>
  getServiceProviderUsage: () => Promise<unknown>
  getRecommendations: () => Promise<unknown>
  getVocabulary: () => Promise<unknown>
  listTemplates: () => Promise<unknown>
  listDocuments: () => Promise<unknown>
  getDocument: (documentId: string) => Promise<unknown>
}

export type CreateOrgClientOptions = {
  fetchFn?: typeof fetch
  transport?: FetchJsonClient
}

export function createOrgClient(
  config: OrgClientConfig,
  { fetchFn = fetch, transport }: CreateOrgClientOptions = {},
): OrgClient {
  const api = transport ?? createFetchJsonClient(config, fetchFn)
  const orgPath = (suffix = "") =>
    `/organizations/${encodeURIComponent(config.organizationId)}${suffix}`

  return {
    getOverview: () => api.getJson(orgPath()),
    getProfile: () => api.getJson(orgPath("/profile")),
    getServices: () => api.getJson(orgPath("/services")),
    getDataTypes: async () => {
      const dataHandling = (await api.getJson(orgPath("/data"))) as {
        dataTypesStored?: unknown
      }

      return dataHandling.dataTypesStored ?? []
    },
    getPrivacyProfile: () => api.getJson(orgPath("/privacy")),
    getInfrastructureProfile: () => api.getJson(orgPath("/infrastructure")),
    getSecurityProfile: () => api.getJson(orgPath("/security")),
    getAccessProfile: () => api.getJson(orgPath("/access")),
    getActivities: () => api.getJson(orgPath("/business-activities")),
    getOrganizationProviders: () =>
      api.getJson(orgPath("/organization-providers")),
    getServiceProviderUsage: () =>
      api.getJson(orgPath("/service-provider-usage")),
    getRecommendations: () => api.getJson(orgPath("/recommendations")),
    getVocabulary: () => api.getJson(orgPath("/vocabulary")),
    listTemplates: () => api.getJson(orgPath("/templates")),
    listDocuments: () => api.getJson(orgPath("/documents")),
    getDocument: (documentId: string) =>
      api.getJson(orgPath(`/documents/${encodeURIComponent(documentId)}`)),
  }
}
