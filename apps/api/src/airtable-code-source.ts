import { type CodeId } from "@plyco/shared"

import {
  linkedRecordIds,
  listAirtableRecords,
  numberField,
  stringField,
} from "./airtable.js"
import { ApiError } from "./errors.js"

const CODE_SETS_TABLE_NAME = "Code Sets"
const CODES_TABLE_NAME = "Codes"
const PROVIDER_CATEGORIES_TABLE_NAME = "Provider Categories"

export type ProviderLookupCode = {
  code: CodeId
  name: string
}

export type ProviderLookupCodes = {
  categories: ProviderLookupCode[]
  systemTypes: ProviderLookupCode[]
}

export interface ProviderLookupCodeSource {
  listLookupCodes(): Promise<ProviderLookupCodes>
}

const activeField = (fields: Record<string, unknown>) =>
  fields.Active !== false && fields["Is Active"] !== false

const codesForSet = (
  codeRecords: Array<{
    fields: Record<string, unknown>
    sortOrder: number
  }>,
  codeSetRecordsByAirtableId: Map<string, { fields: Record<string, unknown> }>,
  codeSetId: string,
): ProviderLookupCode[] =>
  codeRecords
    .filter(({ fields }) => {
      const linkedCodeSetId = linkedRecordIds(
        fields,
        "Code Set",
        "Code Sets",
        "Code set",
        "code_set",
      )[0]
      const linkedCodeSet = linkedCodeSetId
        ? codeSetRecordsByAirtableId.get(linkedCodeSetId)
        : undefined

      return (
        linkedCodeSet &&
        stringField(linkedCodeSet.fields, "Id", "Key") === codeSetId &&
        activeField(fields)
      )
    })
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ fields }) => {
      const code = stringField(fields, "Id", "Key")

      if (!code) {
        throw new ApiError(
          "AIRTABLE_CODE_INVALID",
          "Airtable code is missing Id or Key.",
          400,
        )
      }

      return {
        code,
        name: stringField(fields, "Name") || code,
      }
    })

export class AirtableProviderLookupCodeSource implements ProviderLookupCodeSource {
  constructor(
    private readonly baseId: string,
    private readonly apiKey: string,
  ) {}

  async listLookupCodes(): Promise<ProviderLookupCodes> {
    let codeSetRecords
    let codeRecords
    let providerCategoryRecords

    try {
      const records = await Promise.all([
        listAirtableRecords({
          apiKey: this.apiKey,
          baseId: this.baseId,
          tableName: CODE_SETS_TABLE_NAME,
        }),
        listAirtableRecords({
          apiKey: this.apiKey,
          baseId: this.baseId,
          tableName: CODES_TABLE_NAME,
        }),
        listAirtableRecords({
          apiKey: this.apiKey,
          baseId: this.baseId,
          tableName: PROVIDER_CATEGORIES_TABLE_NAME,
        }),
      ])
      codeSetRecords = records[0]
      codeRecords = records[1]
      providerCategoryRecords = records[2]
    } catch (error) {
      if (error instanceof ApiError && error.code === "AIRTABLE_LOAD_FAILED") {
        throw new ApiError(
          "PROVIDER_LOOKUP_CODES_LOAD_FAILED",
          "Unable to load provider lookup codes from Airtable.",
          502,
          error.details,
        )
      }

      throw error
    }

    const codeSetRecordsByAirtableId = new Map(
      codeSetRecords.map((record) => [record.id, record]),
    )
    const sortedCodeRecords = codeRecords.map((record, index) => ({
      fields: record.fields,
      sortOrder:
        numberField(record.fields, "Sequence", "Sort Order", "Sort", "Order") ??
        index,
    }))

    return {
      categories: providerCategoryRecords
        .filter((record) => activeField(record.fields))
        .map((record, index) => ({
          fields: record.fields,
          sortOrder:
            numberField(record.fields, "Sequence", "Sort Order", "Sort", "Order") ??
            index,
        }))
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(({ fields }) => {
          const code = stringField(fields, "Code")

          if (!code) {
            throw new ApiError(
              "AIRTABLE_CODE_INVALID",
              "Airtable provider category is missing Code.",
              400,
            )
          }

          return {
            code,
            name: stringField(fields, "Name") || code,
          }
        }),
      systemTypes: codesForSet(
        sortedCodeRecords,
        codeSetRecordsByAirtableId,
        "provider_system_type",
      ),
    }
  }
}

export class StaticProviderLookupCodeSource implements ProviderLookupCodeSource {
  constructor(private readonly codes: ProviderLookupCodes) {}

  async listLookupCodes(): Promise<ProviderLookupCodes> {
    return this.codes
  }
}
