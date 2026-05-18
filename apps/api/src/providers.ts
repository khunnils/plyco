import {
  providerSchema,
  providerSystemTypeSchema,
  type Provider,
  type ProviderSystemType,
} from "@plyco/shared"
import { z } from "zod"

import { ApiError } from "./errors.js"

const AIRTABLE_API_URL = "https://api.airtable.com/v0"
const PROVIDERS_TABLE_NAME = "Providers"
const PROVIDER_LOAD_FAILED = "PROVIDER_CATALOG_LOAD_FAILED"
const PROVIDER_INVALID_RECORD = "PROVIDER_CATALOG_INVALID_RECORD"

const airtableAttachmentSchema = z.object({
  url: z.string().url(),
})

const airtableProviderRecordSchema = z.object({
  id: z.string().min(1),
  fields: z.record(z.string(), z.unknown()),
})

const airtableProviderResponseSchema = z.object({
  records: z.array(airtableProviderRecordSchema),
  offset: z.string().optional(),
})

export interface ProviderSource {
  listProviders(): Promise<Provider[]>
}

const stringField = (
  fields: Record<string, unknown>,
  ...names: string[]
): string | undefined => {
  for (const name of names) {
    const value = fields[name]

    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return undefined
}

const booleanField = (
  fields: Record<string, unknown>,
  ...names: string[]
): boolean => {
  for (const name of names) {
    const value = fields[name]

    if (typeof value === "boolean") {
      return value
    }
  }

  return false
}

const rawStringValues = (
  fields: Record<string, unknown>,
  ...names: string[]
): string[] => {
  for (const name of names) {
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
}

const systemTypesField = (
  fields: Record<string, unknown>,
): ProviderSystemType[] =>
  Array.from(
    new Set(
      rawStringValues(fields, "System Type", "System type", "System Types", "System types")
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

const mapAirtableProvider = (
  record: z.infer<typeof airtableProviderRecordSchema>
): Provider => {
  const fields = record.fields
  const provider = {
    id: stringField(fields, "Id") ?? record.id,
    name: stringField(fields, "Name") ?? "Unnamed provider",
    logoUrl: logoUrlField(fields),
    url: stringField(fields, "Url", "URL"),
    category:
      stringField(fields, "Category Name", "Category") ??
      rawStringValues(fields, "Category Name", "Category")[0],
    systemTypes: systemTypesField(fields),
    securityCriticality: stringField(
      fields,
      "Security Criticality",
      "Security criticality",
      "Security..."
    ),
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
    const records: Array<z.infer<typeof airtableProviderRecordSchema>> = []
    let offset: string | undefined

    do {
      const url = new URL(
        `${AIRTABLE_API_URL}/${this.baseId}/${encodeURIComponent(PROVIDERS_TABLE_NAME)}`
      )

      if (offset) {
        url.searchParams.set("offset", offset)
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        const body = await response.text()

        throw new ApiError(
          PROVIDER_LOAD_FAILED,
          "Unable to load provider catalog from Airtable.",
          502,
          {
            status: response.status,
            statusText: response.statusText,
            body: body.slice(0, 1000),
          }
        )
      }

      const body = airtableProviderResponseSchema.parse(await response.json())
      records.push(...body.records)
      offset = body.offset
    } while (offset)

    return records.map(mapAirtableProvider)
  }
}

export class StaticProviderSource implements ProviderSource {
  constructor(private readonly providers: Provider[] = []) {}

  async listProviders(): Promise<Provider[]> {
    return this.providers
  }
}
