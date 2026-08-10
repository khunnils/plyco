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
  updateProfile: (body: unknown) => Promise<unknown>
  updateServices: (body: unknown) => Promise<unknown>
  updateDataHandling: (body: unknown) => Promise<unknown>
  updatePrivacyProfile: (body: unknown) => Promise<unknown>
  updateInfrastructureProfile: (body: unknown) => Promise<unknown>
  updateSecurityProfile: (body: unknown) => Promise<unknown>
  updateAccessProfile: (body: unknown) => Promise<unknown>
  addOrganizationProvider: (body: unknown) => Promise<unknown>
  updateOrganizationProvider: (id: string, body: unknown) => Promise<unknown>
  removeOrganizationProvider: (id: string) => Promise<unknown>
  resolveProvider: (body: unknown) => Promise<unknown>
  addServiceProviderUsage: (body: unknown) => Promise<unknown>
  updateServiceProviderUsage: (id: string, body: unknown) => Promise<unknown>
  removeServiceProviderUsage: (id: string) => Promise<unknown>
  addActivity: (body: unknown) => Promise<unknown>
  updateActivity: (id: string, body: unknown) => Promise<unknown>
  removeActivity: (id: string) => Promise<unknown>
  addVocabularyCode: (codeSetId: string, body: unknown) => Promise<unknown>
  updateVocabularyCode: (
    codeSetId: string,
    codeId: string,
    body: unknown,
  ) => Promise<unknown>
  removeVocabularyCode: (codeSetId: string, codeId: string) => Promise<unknown>
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
    updateProfile: (body) => api.sendJson("PUT", orgPath("/profile"), body),
    updateServices: (body) => api.sendJson("PUT", orgPath("/services"), body),
    updateDataHandling: (body) => api.sendJson("PUT", orgPath("/data"), body),
    updatePrivacyProfile: (body) =>
      api.sendJson("PUT", orgPath("/privacy"), body),
    updateInfrastructureProfile: (body) =>
      api.sendJson("PUT", orgPath("/infrastructure"), body),
    updateSecurityProfile: (body) =>
      api.sendJson("PUT", orgPath("/security"), body),
    updateAccessProfile: (body) =>
      api.sendJson("PUT", orgPath("/access"), body),
    addOrganizationProvider: (body) =>
      api.sendJson("POST", orgPath("/organization-providers"), body),
    updateOrganizationProvider: (id, body) =>
      api.sendJson(
        "PUT",
        orgPath(`/organization-providers/${encodeURIComponent(id)}`),
        body,
      ),
    removeOrganizationProvider: (id) =>
      api.sendJson(
        "DELETE",
        orgPath(`/organization-providers/${encodeURIComponent(id)}`),
      ),
    resolveProvider: (body) =>
      api.sendJson("POST", orgPath("/organization-providers/resolve"), body),
    addServiceProviderUsage: (body) =>
      api.sendJson("POST", orgPath("/service-provider-usage"), body),
    updateServiceProviderUsage: (id, body) =>
      api.sendJson(
        "PUT",
        orgPath(`/service-provider-usage/${encodeURIComponent(id)}`),
        body,
      ),
    removeServiceProviderUsage: (id) =>
      api.sendJson(
        "DELETE",
        orgPath(`/service-provider-usage/${encodeURIComponent(id)}`),
      ),
    addActivity: (body) =>
      api.sendJson("POST", orgPath("/business-activities"), body),
    updateActivity: (id, body) =>
      api.sendJson(
        "PUT",
        orgPath(`/business-activities/${encodeURIComponent(id)}`),
        body,
      ),
    removeActivity: (id) =>
      api.sendJson(
        "DELETE",
        orgPath(`/business-activities/${encodeURIComponent(id)}`),
      ),
    addVocabularyCode: (codeSetId, body) =>
      api.sendJson(
        "POST",
        orgPath(
          `/vocabulary/${encodeURIComponent(codeSetId)}/codes`,
        ),
        body,
      ),
    updateVocabularyCode: (codeSetId, codeId, body) =>
      api.sendJson(
        "PUT",
        orgPath(
          `/vocabulary/${encodeURIComponent(codeSetId)}/codes/${encodeURIComponent(codeId)}`,
        ),
        body,
      ),
    removeVocabularyCode: (codeSetId, codeId) =>
      api.sendJson(
        "DELETE",
        orgPath(
          `/vocabulary/${encodeURIComponent(codeSetId)}/codes/${encodeURIComponent(codeId)}`,
        ),
      ),
  }
}
