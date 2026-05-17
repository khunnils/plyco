import { randomUUID } from "node:crypto"

import { prisma, type PrismaClient } from "@complyflow/db"
import { z } from "zod"

import { ApiError } from "./errors.js"
import { countries, requiredCodeSetIds } from "./features/vocabulary/reference-data.js"

const AIRTABLE_API_URL = "https://api.airtable.com/v0"
const CODE_SETS_TABLE_NAME = "Code Sets"
const CODES_TABLE_NAME = "Codes"

const airtableRecordSchema = z.object({
  id: z.string().min(1),
  fields: z.record(z.string(), z.unknown()),
})

const airtableResponseSchema = z.object({
  records: z.array(airtableRecordSchema),
  offset: z.string().optional(),
})

type AirtableRecord = z.infer<typeof airtableRecordSchema>

const stringField = (
  fields: Record<string, unknown>,
  ...names: string[]
): string => {
  for (const name of names) {
    const value = fields[name]

    if (typeof value === "string" && value.trim()) {
      return value.trim()
    }
  }

  return ""
}

const linkedRecordIds = (
  fields: Record<string, unknown>,
  ...names: string[]
): string[] => {
  for (const name of names) {
    const value = fields[name]

    if (Array.isArray(value)) {
      return value.filter(
        (item): item is string => typeof item === "string" && item.length > 0,
      )
    }
  }

  return []
}

async function listAirtableRecords({
  apiKey,
  baseId,
  tableName,
}: {
  apiKey: string
  baseId: string
  tableName: string
}): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = []
  let offset: string | undefined

  do {
    const url = new URL(
      `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableName)}`,
    )
    url.searchParams.set("pageSize", "100")

    if (offset) {
      url.searchParams.set("offset", offset)
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!response.ok) {
      throw new ApiError(
        "AIRTABLE_CODE_LOAD_FAILED",
        `Unable to load Airtable table ${tableName}.`,
        502,
        {
          status: response.status,
          statusText: response.statusText,
          body: (await response.text()).slice(0, 1000),
        },
      )
    }

    const body = airtableResponseSchema.parse(await response.json())
    records.push(...body.records)
    offset = body.offset
  } while (offset)

  return records
}

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
      tableName: CODE_SETS_TABLE_NAME,
    }),
    listAirtableRecords({
      apiKey,
      baseId,
      tableName: CODES_TABLE_NAME,
    }),
  ])
  const codeSetByAirtableRecordId = new Map(
    codeSetRecords.map((record) => [record.id, record]),
  )
  const codeSetIds = new Set(
    codeSetRecords.map((record) => stringField(record.fields, "Id")),
  )
  const missingCodeSetIds = requiredCodeSetIds.filter(
    (codeSetId) => !codeSetIds.has(codeSetId),
  )

  if (missingCodeSetIds.length > 0) {
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
    const id = stringField(record.fields, "Id")

    if (!id) {
      throw new ApiError(
        "AIRTABLE_CODE_SET_INVALID",
        "Airtable code set is missing Id.",
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
  let sortOrder = 0

  for (const record of codeRecords) {
    const linkedCodeSetId = linkedRecordIds(record.fields, "Code Set")[0]
    const codeSet = linkedCodeSetId
      ? codeSetByAirtableRecordId.get(linkedCodeSetId)
      : undefined
    const codeSetId = codeSet ? stringField(codeSet.fields, "Id") : ""
    const codeId = stringField(record.fields, "Id")

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
    sortOrder += 1
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
