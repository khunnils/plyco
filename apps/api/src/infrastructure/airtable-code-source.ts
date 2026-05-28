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
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      const aName = stringField(a.fields, "Name") || stringField(a.fields, "Id", "Key") || "";
      const bName = stringField(b.fields, "Name") || stringField(b.fields, "Id", "Key") || "";
      return aName.localeCompare(bName, undefined, { sensitivity: "base" });
    })
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
      ])
      codeSetRecords = records[0]
      codeRecords = records[1]
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
        0,
    }))

    return {
      categories: codesForSet(
        sortedCodeRecords,
        codeSetRecordsByAirtableId,
        "vendor_category",
      ),
      systemTypes: codesForSet(
        sortedCodeRecords,
        codeSetRecordsByAirtableId,
        "provider_system_types",
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
