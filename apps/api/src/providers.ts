import {
  providerSchema,
  providerSystemTypeSchema,
  type Provider,
  type ProviderSystemType,
} from "@plyco/shared"
import { z } from "zod"

import { countries } from "./features/vocabulary/reference-data.js"

// Simple country name to ISO 2-letter code mapping
const countryNameToCode = (name: string | undefined): string | undefined => {
  if (!name) return undefined
  const cleanedName = name.trim().toLowerCase()
  if (cleanedName === "united states" || cleanedName === "usa" || cleanedName === "united states of america") {
    return "US"
  }
  if (cleanedName === "united kingdom" || cleanedName === "uk" || cleanedName === "great britain") {
    return "GB"
  }
  
  // Find in standard countries list
  const found = countries.find(
    (c) =>
      c.name.toLowerCase() === cleanedName ||
      c.name.toLowerCase().includes(cleanedName) ||
      cleanedName.includes(c.name.toLowerCase())
  )
  return found?.code
}

// Maps arbitrary category codes/names to valid vendor_category vocabulary codes
const mapCategoryCode = (code: string | undefined, name: string | undefined): string | undefined => {
  const cleanedCode = code?.trim().toLowerCase()
  const cleanedName = name?.trim().toLowerCase()

  if (cleanedCode === "source_control" || cleanedCode === "source-control" || cleanedName === "source control") {
    return "source_control"
  }
  if (cleanedCode === "payments" || cleanedName === "payments") {
    return "payments"
  }
  if (cleanedCode === "project_management" || cleanedCode === "project-management" || cleanedName === "project management") {
    return "project_management"
  }
  return undefined
}

import {
  listAirtableRecords,
  stringField,
  linkedRecordIds,
  type AirtableRecord,
} from "./airtable.js"
import { ApiError } from "./errors.js"

const PROVIDERS_TABLE_NAME = "Providers"
const PROVIDER_ORGANIZATIONS_TABLE_NAME = "Provider Organizations"
const PROVIDER_CATEGORIES_TABLE_NAME = "Provider Categories"

const PROVIDER_LOAD_FAILED = "PROVIDER_CATALOG_LOAD_FAILED"
const PROVIDER_INVALID_RECORD = "PROVIDER_CATALOG_INVALID_RECORD"

const airtableAttachmentSchema = z.object({
  url: z.string().url(),
})

export interface ProviderSource {
  listProviders(): Promise<Provider[]>
}

const booleanField = (
  fields: Record<string, unknown>,
  name: string,
): boolean => {
  const value = fields[name]
  if (typeof value === "boolean") {
    return value
  }
  return false
}

const rawStringValues = (
  fields: Record<string, unknown>,
  name: string,
): string[] => {
  const value = fields[name]

  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string => typeof item === "string" && Boolean(item.trim()),
    )
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

const systemTypeAliases: Record<string, ProviderSystemType> = {
  auth: "auth",
  authentication: "auth",
  "identity provider": "auth",
  "source control": "source_control",
  "source_control": "source_control",
  scm: "source_control",
  cloud: "cloud",
  hosting: "cloud",
  "password manager": "password_manager",
  "password_manager": "password_manager",
  analytics: "analytics",
  "analytics provider": "analytics",
  advertising: "advertising",
  ads: "advertising",
  "advertising provider": "advertising",
  marketing: "advertising",
  newsletter: "newsletter",
  "newsletter provider": "newsletter",
  "email marketing": "newsletter",
  "email marketing provider": "newsletter",
  "email_marketing": "newsletter",
}

const systemTypesField = (
  fields: Record<string, unknown>,
): ProviderSystemType[] =>
  Array.from(
    new Set(
      rawStringValues(fields, "System Type")
        .map((value) => systemTypeAliases[value.trim().toLowerCase()])
        .filter((value): value is ProviderSystemType =>
          providerSystemTypeSchema.safeParse(value).success,
        ),
    ),
  )

const logoUrlField = (fields: Record<string, unknown>): string | undefined => {
  const parsedLogo = z.array(airtableAttachmentSchema).safeParse(fields.Logo)
  return parsedLogo.success ? parsedLogo.data[0]?.url : undefined
}

const getSingleStringOrArrayFirst = (
  fields: Record<string, unknown>,
  name: string,
): string => {
  const value = fields[name]
  if (typeof value === "string") {
    return value.trim()
  }
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
    return value[0].trim()
  }
  return ""
}

const mapAirtableProvider = (
  record: AirtableRecord,
  orgsMap: Map<string, AirtableRecord>,
  categoriesMap: Map<string, AirtableRecord>,
): Provider => {
  const fields = record.fields

  // 1. Linked Organization lookup
  const orgIds = linkedRecordIds(fields, "Organization")
  const orgRecord = orgIds[0] ? orgsMap.get(orgIds[0]) : undefined

  // 2. Linked Category lookup
  const categoryIds = linkedRecordIds(fields, "Provider Categories")
  const categoryRecord = categoryIds[0] ? categoriesMap.get(categoryIds[0]) : undefined

  const categoryName = categoryRecord
    ? getSingleStringOrArrayFirst(categoryRecord.fields, "Name")
    : getSingleStringOrArrayFirst(fields, "Category Name")

  const categoryCode = categoryRecord
    ? getSingleStringOrArrayFirst(categoryRecord.fields, "Code")
    : getSingleStringOrArrayFirst(fields, "Category Code")

  const provider = {
    id: getSingleStringOrArrayFirst(fields, "Id") || record.id,
    name: getSingleStringOrArrayFirst(fields, "Name") || "Unnamed provider",
    logoUrl: logoUrlField(fields),
    url: getSingleStringOrArrayFirst(fields, "Url") || undefined,
    category: categoryName || undefined,
    categoryCode: mapCategoryCode(categoryCode, categoryName),
    legalName: orgRecord ? getSingleStringOrArrayFirst(orgRecord.fields, "Legal Name") || undefined : undefined,
    countryOfRegistration: orgRecord ? countryNameToCode(getSingleStringOrArrayFirst(orgRecord.fields, "Country of Registration")) || undefined : undefined,
    systemTypes: systemTypesField(fields),
    securityCriticality: getSingleStringOrArrayFirst(fields, "Security Relevance") || undefined,
    handlesCustomerData: booleanField(fields, "Handles Customer Data"),
  }

  const parsedProvider = providerSchema.safeParse(provider)

  if (!parsedProvider.success) {
    throw new ApiError(
      PROVIDER_INVALID_RECORD,
      "Provider catalog contains an invalid provider record.",
      502,
      {
        recordId: record.id,
        fields: Object.keys(fields),
        validation: parsedProvider.error.flatten(),
      }
    )
  }

  return parsedProvider.data
}

export class AirtableProviderSource implements ProviderSource {
  constructor(
    private readonly baseId: string,
    private readonly apiKey: string
  ) {}

  async listProviders(): Promise<Provider[]> {
    let providerRecords: AirtableRecord[]
    let orgRecords: AirtableRecord[]
    let categoryRecords: AirtableRecord[]

    try {
      const results = await Promise.all([
        listAirtableRecords({
          apiKey: this.apiKey,
          baseId: this.baseId,
          tableName: PROVIDERS_TABLE_NAME,
        }),
        listAirtableRecords({
          apiKey: this.apiKey,
          baseId: this.baseId,
          tableName: PROVIDER_ORGANIZATIONS_TABLE_NAME,
        }),
        listAirtableRecords({
          apiKey: this.apiKey,
          baseId: this.baseId,
          tableName: PROVIDER_CATEGORIES_TABLE_NAME,
        }),
      ])
      providerRecords = results[0]
      orgRecords = results[1]
      categoryRecords = results[2]
    } catch (error) {
      if (error instanceof ApiError && error.code === "AIRTABLE_LOAD_FAILED") {
        throw new ApiError(
          PROVIDER_LOAD_FAILED,
          "Unable to load provider catalog from Airtable.",
          502,
          error.details,
        )
      }

      throw error
    }

    const orgsMap = new Map(orgRecords.map((record) => [record.id, record]))
    const categoriesMap = new Map(categoryRecords.map((record) => [record.id, record]))

    return providerRecords.map((record) => mapAirtableProvider(record, orgsMap, categoriesMap))
  }
}

export class StaticProviderSource implements ProviderSource {
  constructor(private readonly providers: Provider[] = []) {}

  async listProviders(): Promise<Provider[]> {
    return this.providers
  }
}
