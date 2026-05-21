import {
  authStateSchema,
  securityProgramSnapshotSchema,
  structuredErrorSchema,
  providerSchema,
  countrySchema,
  vocabularySchema,
  vocabularyCodeSchema,
  vocabularyCodeInputSchema,
  templateCatalogSchema,
  businessActivitySchema,
  businessActivityInputSchema,
  serviceVendorUseSchema,
  serviceVendorUseInputSchema,
  vendorSchema,
  createDocumentSchema,
  documentSchema,
  documentSummarySchema,
  templateSchema,
  createOrganizationSchema,
  organizationSummarySchema,
  organizationMemberSchema,
  type Provider,
  type Country,
  type Vocabulary,
  type VocabularyCode,
  type VocabularyCodeInput,
  type CreateDocument,
  type CreateOrganization,
  type CreateTemplateFromSystem,
  type Document,
  type DocumentSummary,
  type AuthState,
  type SecurityProgramSnapshot,
  type Template,
  type TemplateCatalog,
  type TemplateInput,
  type BusinessActivity,
  type BusinessActivityInput,
  type ServiceVendorUse,
  type ServiceVendorUseInput,
  type Vendor,
  type VendorInput,
  type OrganizationSummary,
  type OrganizationMember,
} from "@plyco/shared"
import { z } from "zod"

import { type ProfileDraft } from "@/features/security-profile/types/security-profile"

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000"

const parseResponse = async <T>(
  response: Response,
  schema: z.ZodType<T>
): Promise<T> => {
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const parsedError = structuredErrorSchema.safeParse(body)
    throw new Error(
      parsedError.success ? parsedError.data.error.message : "Request failed"
    )
  }

  return schema.parse(await response.json())
}

const apiRequest = async <T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit
): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })

  return parseResponse(response, schema)
}

export const startGoogleLogin = () => {
  window.location.href = `${API_URL}/auth/google`
}

export const getAuthState = (): Promise<AuthState> =>
  apiRequest("/auth/me", authStateSchema)

export const logout = async (): Promise<void> => {
  const response = await fetch(`${API_URL}/auth/logout`, {
    credentials: "include",
    method: "POST",
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const parsedError = structuredErrorSchema.safeParse(body)
    throw new Error(
      parsedError.success ? parsedError.data.error.message : "Request failed"
    )
  }
}

export const getOrganizationSecurityProfile = (
  organizationId: string
): Promise<SecurityProgramSnapshot> =>
  apiRequest(
    `/organizations/${organizationId}/security-profile`,
    securityProgramSnapshotSchema
  )

export const getProviders = (): Promise<Provider[]> =>
  apiRequest("/providers", z.array(providerSchema))

export const getCountries = (): Promise<Country[]> =>
  apiRequest("/countries", z.array(countrySchema))

export const getVocabulary = (organizationId: string): Promise<Vocabulary> =>
  apiRequest(`/organizations/${organizationId}/vocabulary`, vocabularySchema)

export const getOrganizationMembers = (
  organizationId: string
): Promise<OrganizationMember[]> =>
  apiRequest(
    `/organizations/${organizationId}/members`,
    z.array(organizationMemberSchema)
  )

export const createVocabularyCode = ({
  organizationId,
  codeSetId,
  code,
}: {
  organizationId: string
  codeSetId: string
  code: VocabularyCodeInput
}): Promise<VocabularyCode> =>
  apiRequest(
    `/organizations/${organizationId}/vocabulary/${codeSetId}/codes`,
    vocabularyCodeSchema,
    {
      method: "POST",
      body: JSON.stringify(vocabularyCodeInputSchema.parse(code)),
    }
  )

export const updateVocabularyCode = ({
  organizationId,
  codeSetId,
  codeId,
  code,
}: {
  organizationId: string
  codeSetId: string
  codeId: string
  code: VocabularyCodeInput
}): Promise<VocabularyCode> =>
  apiRequest(
    `/organizations/${organizationId}/vocabulary/${codeSetId}/codes/${codeId}`,
    vocabularyCodeSchema,
    {
      method: "PUT",
      body: JSON.stringify(vocabularyCodeInputSchema.parse(code)),
    }
  )

export const deleteVocabularyCode = async ({
  organizationId,
  codeSetId,
  codeId,
}: {
  organizationId: string
  codeSetId: string
  codeId: string
}): Promise<void> => {
  const response = await fetch(
    `${API_URL}/organizations/${organizationId}/vocabulary/${codeSetId}/codes/${codeId}`,
    {
      credentials: "include",
      method: "DELETE",
    }
  )

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const parsedError = structuredErrorSchema.safeParse(body)
    throw new Error(
      parsedError.success ? parsedError.data.error.message : "Request failed"
    )
  }
}

export const getOrganizationTemplates = (
  organizationId: string
): Promise<TemplateCatalog> =>
  apiRequest(
    `/organizations/${organizationId}/templates`,
    templateCatalogSchema
  )

export const getOrganizationDocuments = (
  organizationId: string
): Promise<DocumentSummary[]> =>
  apiRequest(
    `/organizations/${organizationId}/documents`,
    z.array(documentSummarySchema)
  )

export const saveSecurityProfile = (
  organizationId: string,
  profile: ProfileDraft
): Promise<SecurityProgramSnapshot> =>
  apiRequest(
    `/organizations/${organizationId}/security-profile`,
    securityProgramSnapshotSchema,
    {
      method: "PUT",
      body: JSON.stringify(profile),
    }
  )

export const createVendor = (
  organizationId: string,
  vendor: VendorInput
): Promise<Vendor> =>
  apiRequest(`/organizations/${organizationId}/vendors`, vendorSchema, {
    method: "POST",
    body: JSON.stringify(vendor),
  })

export const createBusinessActivity = (
  organizationId: string,
  activity: BusinessActivityInput
): Promise<BusinessActivity> =>
  apiRequest(
    `/organizations/${organizationId}/business-activities`,
    businessActivitySchema,
    {
      method: "POST",
      body: JSON.stringify(businessActivityInputSchema.parse(activity)),
    }
  )

export const updateBusinessActivity = ({
  organizationId,
  id,
  activity,
}: {
  organizationId: string
  id: string
  activity: BusinessActivityInput
}): Promise<BusinessActivity> =>
  apiRequest(
    `/organizations/${organizationId}/business-activities/${id}`,
    businessActivitySchema,
    {
      method: "PUT",
      body: JSON.stringify(businessActivityInputSchema.parse(activity)),
    }
  )

export const deleteBusinessActivity = async (
  organizationId: string,
  id: string
): Promise<void> => {
  const response = await fetch(
    `${API_URL}/organizations/${organizationId}/business-activities/${id}`,
    {
      credentials: "include",
      method: "DELETE",
    }
  )

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const parsedError = structuredErrorSchema.safeParse(body)
    throw new Error(
      parsedError.success ? parsedError.data.error.message : "Request failed"
    )
  }
}

export const createTemplateFromSystem = (
  organizationId: string,
  input: CreateTemplateFromSystem
): Promise<Template> =>
  apiRequest(`/organizations/${organizationId}/templates`, templateSchema, {
    method: "POST",
    body: JSON.stringify(input),
  })

export const updateTemplate = ({
  organizationId,
  id,
  template,
}: {
  organizationId: string
  id: string
  template: TemplateInput
}): Promise<Template> =>
  apiRequest(
    `/organizations/${organizationId}/templates/${id}`,
    templateSchema,
    {
      method: "PUT",
      body: JSON.stringify(template),
    }
  )

export const createDocument = (
  organizationId: string,
  input: CreateDocument
): Promise<Document> =>
  apiRequest(`/organizations/${organizationId}/documents`, documentSchema, {
    method: "POST",
    body: JSON.stringify(createDocumentSchema.parse(input)),
  })

export const getDocument = (
  organizationId: string,
  id: string
): Promise<Document> =>
  apiRequest(`/organizations/${organizationId}/documents/${id}`, documentSchema)

export const downloadDocumentPdf = async ({
  organizationId,
  id,
  title,
}: {
  organizationId: string
  id: string
  title: string
}): Promise<void> => {
  const response = await fetch(
    `${API_URL}/organizations/${organizationId}/documents/${id}/pdf`,
    {
      credentials: "include",
    }
  )

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const parsedError = structuredErrorSchema.safeParse(body)
    throw new Error(
      parsedError.success ? parsedError.data.error.message : "Request failed"
    )
  }

  const blobUrl = URL.createObjectURL(await response.blob())
  const link = document.createElement("a")
  link.href = blobUrl
  link.download = `${safePdfFilename(title)}.pdf`
  link.click()
  URL.revokeObjectURL(blobUrl)
}

export const updateVendor = ({
  organizationId,
  id,
  vendor,
}: {
  organizationId: string
  id: string
  vendor: VendorInput
}): Promise<Vendor> =>
  apiRequest(`/organizations/${organizationId}/vendors/${id}`, vendorSchema, {
    method: "PUT",
    body: JSON.stringify(vendor),
  })

export const deleteVendor = async (
  organizationId: string,
  id: string
): Promise<void> => {
  const response = await fetch(
    `${API_URL}/organizations/${organizationId}/vendors/${id}`,
    {
      credentials: "include",
      method: "DELETE",
    }
  )

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const parsedError = structuredErrorSchema.safeParse(body)
    throw new Error(
      parsedError.success ? parsedError.data.error.message : "Request failed"
    )
  }
}

export const createServiceVendorUse = (
  organizationId: string,
  vendorUse: ServiceVendorUseInput
): Promise<ServiceVendorUse> =>
  apiRequest(
    `/organizations/${organizationId}/service-vendor-uses`,
    serviceVendorUseSchema,
    {
      method: "POST",
      body: JSON.stringify(serviceVendorUseInputSchema.parse(vendorUse)),
    }
  )

export const updateServiceVendorUse = ({
  organizationId,
  id,
  vendorUse,
}: {
  organizationId: string
  id: string
  vendorUse: ServiceVendorUseInput
}): Promise<ServiceVendorUse> =>
  apiRequest(
    `/organizations/${organizationId}/service-vendor-uses/${id}`,
    serviceVendorUseSchema,
    {
      method: "PUT",
      body: JSON.stringify(serviceVendorUseInputSchema.parse(vendorUse)),
    }
  )

export const deleteServiceVendorUse = async (
  organizationId: string,
  id: string
): Promise<void> => {
  const response = await fetch(
    `${API_URL}/organizations/${organizationId}/service-vendor-uses/${id}`,
    {
      credentials: "include",
      method: "DELETE",
    }
  )

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const parsedError = structuredErrorSchema.safeParse(body)
    throw new Error(
      parsedError.success ? parsedError.data.error.message : "Request failed"
    )
  }
}

export const deleteTemplate = async (
  organizationId: string,
  id: string
): Promise<void> => {
  const response = await fetch(
    `${API_URL}/organizations/${organizationId}/templates/${id}`,
    {
      credentials: "include",
      method: "DELETE",
    }
  )

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const parsedError = structuredErrorSchema.safeParse(body)
    throw new Error(
      parsedError.success ? parsedError.data.error.message : "Request failed"
    )
  }
}

export const createOrganization = (
  input: CreateOrganization
): Promise<OrganizationSummary> =>
  apiRequest("/organizations", organizationSummarySchema, {
    method: "POST",
    body: JSON.stringify(createOrganizationSchema.parse(input)),
  })

const safePdfFilename = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "document"
