import { randomUUID } from "node:crypto"

import { prisma, type PrismaClient } from "@plyco/db"

import {
  linkedRecordIds,
  listAirtableRecords,
  numberField,
  stringField,
} from "./airtable.js"
import { ApiError } from "./errors.js"
import { countries, requiredCodeSetIds } from "./features/vocabulary/reference-data.js"

const CODE_SETS_TABLE_NAME = "Code Sets"
const CODES_TABLE_NAME = "Codes"

export async function loadCodesFromAirtable({
  apiKey,
  baseId,
  client = prisma,
}: {
  apiKey: string
  baseId: string
  client?: PrismaClient
}) {
  const [codeSetRecords, codeRecords] = await Promise.all([
    listAirtableRecords({
      apiKey,
      baseId,
      errorCode: "AIRTABLE_CODE_LOAD_FAILED",
      tableName: CODE_SETS_TABLE_NAME,
    }),
    listAirtableRecords({
      apiKey,
      baseId,
      errorCode: "AIRTABLE_CODE_LOAD_FAILED",
      tableName: CODES_TABLE_NAME,
    }),
  ])
  const codeSetByAirtableRecordId = new Map(
    codeSetRecords.map((record) => [record.id, record]),
  )
  const codeSetIds = new Set(
    codeSetRecords.map((record) =>
      stringField(record.fields, "Id", "Key"),
    ),
  )
  const missingCodeSetIds = requiredCodeSetIds.filter(
    (codeSetId) => !codeSetIds.has(codeSetId),
  )

  if (missingCodeSetIds.length > 0) {
    console.error(`Missing required code sets: ${missingCodeSetIds.join(", ")}`)
    throw new ApiError(
      "AIRTABLE_CODE_SETS_MISSING",
      "Required Airtable code sets are missing.",
      400,
      { codeSetIds: missingCodeSetIds },
    )
  }

  await Promise.all(
    countries.map((country) =>
      client.country.upsert({
        where: { code: country.code },
        create: country,
        update: { name: country.name, active: country.active },
      }),
    ),
  )

  for (const record of codeSetRecords) {
    const id = stringField(record.fields, "Id", "Key")

    if (!id) {
      throw new ApiError(
        "AIRTABLE_CODE_SET_INVALID",
        "Airtable code set is missing Id (or Key) stable id.",
        400,
        { recordId: record.id },
      )
    }

    await client.systemCodeSet.upsert({
      where: { id },
      create: {
        id,
        airtableRecordId: record.id,
        name: stringField(record.fields, "Name") || id,
        description: stringField(record.fields, "Description"),
        isSystem: record.fields["Is System"] === true,
      },
      update: {
        airtableRecordId: record.id,
        name: stringField(record.fields, "Name") || id,
        description: stringField(record.fields, "Description"),
        isSystem: record.fields["Is System"] === true,
      },
    })
  }

  const activeAirtableCodeRecordIds = new Set<string>()

  for (const [recordIndex, record] of codeRecords.entries()) {
    const linkedCodeSetId = linkedRecordIds(
      record.fields,
      "Code Set",
      "Code Sets",
      "Code set",
      "code_set",
    )[0]
    const codeSet = linkedCodeSetId
      ? codeSetByAirtableRecordId.get(linkedCodeSetId)
      : undefined
    const codeSetId = codeSet
      ? stringField(codeSet.fields, "Id", "Key")
      : ""
    const codeId = stringField(record.fields, "Id", "Key")
    const sortOrder =
      numberField(record.fields, "Sequence", "Sort Order", "Sort", "Order") ??
      recordIndex

    if (!codeSetId || !codeId) {
      throw new ApiError(
        "AIRTABLE_CODE_INVALID",
        "Airtable code is missing Id or Code Set.",
        400,
        { recordId: record.id },
      )
    }

    activeAirtableCodeRecordIds.add(record.id)
    await client.systemCode.upsert({
      where: { airtableRecordId: record.id },
      create: {
        id: randomUUID(),
        airtableRecordId: record.id,
        codeSetId,
        codeId,
        name: stringField(record.fields, "Name") || codeId,
        sortOrder,
        active: true,
      },
      update: {
        codeSetId,
        codeId,
        name: stringField(record.fields, "Name") || codeId,
        sortOrder,
        active: true,
      },
    })
  }

  await client.systemCode.updateMany({
    where: { airtableRecordId: { notIn: Array.from(activeAirtableCodeRecordIds) } },
    data: { active: false },
  })

  return {
    codeSetCount: codeSetRecords.length,
    codeCount: codeRecords.length,
    countryCount: countries.length,
  }
}
