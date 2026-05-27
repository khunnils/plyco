import {
  providerImportResultSchema,
  type ProviderImportResult,
  type ProviderLookupResult,
} from "@plyco/shared"

import {
  createAirtableRecord,
  listAirtableRecords,
  updateAirtableRecord,
  type AirtableRecord,
} from "./airtable.js"
import { ApiError } from "./errors.js"
import { type ProviderLookupService } from "./provider-lookup.js"

const PROVIDER_ORGANIZATIONS_TABLE = "Provider Organizations"
const PROVIDERS_TABLE = "Providers"
const PROVIDER_CATEGORIES_TABLE = "Provider Categories"

type ImportAction = "created" | "updated"

export interface ProviderImportService {
  importProvider(inputUrl: string): Promise<ProviderImportResult>
}

const escapeFormulaValue = (value: string) => value.replace(/'/g, "\\'")

const exactFormula = (fieldName: string, value: string) =>
  `{${fieldName}} = '${escapeFormulaValue(value)}'`

const firstMatch = async (
  client: AirtableProviderImportClient,
  tableName: string,
  matchers: Array<{ fieldName: string; value: string }>,
) => {
  for (const matcher of matchers) {
    if (!matcher.value) {
      continue
    }

    const records = await client.listRecords(
      tableName,
      exactFormula(matcher.fieldName, matcher.value),
    )

    if (records[0]) {
      return records[0]
    }
  }

  return null
}

const normalizeSecurityRelevance = (value: string) => {
  const normalized = value.trim().toLowerCase()

  if (!normalized) {
    return ""
  }

  return normalized
    .split(/[\s_-]+/)
    .map((word) => `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`)
    .join(" ")
}

const categoryCodeCandidates = (lookup: ProviderLookupResult) =>
  Array.from(
    new Set([
      lookup.provider.category,
      lookup.provider.category.replace(/_/g, "-"),
      lookup.provider.categoryName,
    ].filter(Boolean)),
  )

const categoryMatches = (
  record: AirtableRecord,
  lookup: ProviderLookupResult,
) => {
  const code = String(record.fields.Code ?? "")
  const name = String(record.fields.Name ?? "")
  const candidates = categoryCodeCandidates(lookup)

  return candidates.some(
    (candidate) =>
      code === candidate ||
      code.toLowerCase() === candidate.toLowerCase() ||
      name.toLowerCase() === candidate.toLowerCase(),
  )
}

export class AirtableProviderImportClient {
  constructor(
    private readonly baseId: string,
    private readonly apiKey: string,
  ) {}

  async listRecords(tableName: string, filterByFormula?: string) {
    try {
      return await listAirtableRecords({
        apiKey: this.apiKey,
        baseId: this.baseId,
        errorCode: "PROVIDER_IMPORT_AIRTABLE_READ_FAILED",
        filterByFormula,
        tableName,
      })
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      throw new ApiError(
        "PROVIDER_IMPORT_AIRTABLE_READ_FAILED",
        "Unable to read provider import records from Airtable.",
        502,
      )
    }
  }

  async createRecord(tableName: string, fields: Record<string, unknown>) {
    return createAirtableRecord({
      apiKey: this.apiKey,
      baseId: this.baseId,
      errorCode: "PROVIDER_IMPORT_AIRTABLE_WRITE_FAILED",
      fields,
      tableName,
    })
  }

  async updateRecord(
    tableName: string,
    recordId: string,
    fields: Record<string, unknown>,
  ) {
    return updateAirtableRecord({
      apiKey: this.apiKey,
      baseId: this.baseId,
      errorCode: "PROVIDER_IMPORT_AIRTABLE_WRITE_FAILED",
      fields,
      recordId,
      tableName,
    })
  }
}

export class AirtableProviderImportService implements ProviderImportService {
  constructor(
    private readonly lookupService: ProviderLookupService,
    private readonly airtableClient: AirtableProviderImportClient,
  ) {}

  async importProvider(inputUrl: string): Promise<ProviderImportResult> {
    const lookup = await this.lookupService.lookup(inputUrl)
    const category = await this.findCategory(lookup)
    const organization = await this.upsertOrganization(lookup)
    const provider = await this.upsertProvider(lookup, organization.record.id, category.id)
    const result = {
      organizationRecordId: organization.record.id,
      providerRecordId: provider.record.id,
      organizationAction: organization.action,
      providerAction: provider.action,
      lookup,
    }

    return providerImportResultSchema.parse(result)
  }

  private async findCategory(lookup: ProviderLookupResult) {
    const categories = await this.airtableClient.listRecords(
      PROVIDER_CATEGORIES_TABLE,
    )
    const category = categories.find((record) => categoryMatches(record, lookup))

    if (category) {
      return category
    }

    return this.airtableClient.createRecord(PROVIDER_CATEGORIES_TABLE, {
      Code: lookup.provider.category,
      Name: lookup.provider.categoryName || lookup.provider.category,
    })
  }

  private async upsertOrganization(lookup: ProviderLookupResult): Promise<{
    action: ImportAction
    record: AirtableRecord
  }> {
    const fields = {
      Id: lookup.organization.id,
      Name: lookup.organization.name,
      "Legal Name": lookup.organization.legalName,
      "Country of Registration": lookup.organization.countryOfRegistration,
      Website: lookup.organization.website,
    }
    const existing = await firstMatch(this.airtableClient, PROVIDER_ORGANIZATIONS_TABLE, [
      { fieldName: "Id", value: lookup.organization.id },
      { fieldName: "Website", value: lookup.organization.website },
      { fieldName: "Name", value: lookup.organization.name },
    ])

    if (existing) {
      return {
        action: "updated",
        record: await this.airtableClient.updateRecord(
          PROVIDER_ORGANIZATIONS_TABLE,
          existing.id,
          fields,
        ),
      }
    }

    return {
      action: "created",
      record: await this.airtableClient.createRecord(
        PROVIDER_ORGANIZATIONS_TABLE,
        fields,
      ),
    }
  }

  private async upsertProvider(
    lookup: ProviderLookupResult,
    organizationRecordId: string,
    categoryRecordId: string,
  ): Promise<{
    action: ImportAction
    record: AirtableRecord
  }> {
    const fields = {
      Id: lookup.provider.id,
      Name: lookup.provider.name,
      Url: lookup.provider.url,
      Purpose: lookup.provider.purpose,
      "System Type": lookup.provider.systemType,
      "Security Relevance": normalizeSecurityRelevance(
        lookup.provider.securityCriticality,
      ),
      "Handles Customer Data": lookup.provider.handlesCustomerData,
      Organizatzion: [organizationRecordId],
      "Provider Categories": [categoryRecordId],
    }
    const existing = await firstMatch(this.airtableClient, PROVIDERS_TABLE, [
      { fieldName: "Id", value: lookup.provider.id },
      { fieldName: "Url", value: lookup.provider.url },
    ])

    if (existing) {
      return {
        action: "updated",
        record: await this.airtableClient.updateRecord(
          PROVIDERS_TABLE,
          existing.id,
          fields,
        ),
      }
    }

    return {
      action: "created",
      record: await this.airtableClient.createRecord(PROVIDERS_TABLE, fields),
    }
  }
}
