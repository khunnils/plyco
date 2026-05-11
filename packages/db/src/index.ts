import { PrismaClient } from "@prisma/client"
import {
  type AccessProfile,
  accessProfileSchema,
  type CompanyProfile,
  companyProfileSchema,
  type DataHandlingProfile,
  dataHandlingProfileSchema,
  type InfrastructureProfile,
  infrastructureProfileSchema,
  type OrganizationSecurityProfile,
  type Vendor,
  vendorSchema,
} from "@complyflow/shared"

export const prisma = new PrismaClient()

function toIsoString(value: Date) {
  return value.toISOString()
}

export function mapOrganizationRecord(record: {
  id: string
  company: unknown
  infrastructure: unknown
  dataHandling: unknown
  access: unknown
  createdAt: Date
  updatedAt: Date
}): OrganizationSecurityProfile {
  return {
    id: record.id,
    company: companyProfileSchema.parse(record.company) as CompanyProfile,
    infrastructure: infrastructureProfileSchema.parse(
      record.infrastructure
    ) as InfrastructureProfile,
    dataHandling: dataHandlingProfileSchema.parse(
      record.dataHandling
    ) as DataHandlingProfile,
    access: accessProfileSchema.parse(record.access) as AccessProfile,
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
  }
}

export function mapVendorRecord(record: {
  id: string
  name: string
  category: string
  purpose: string
  hasSubprocessors: boolean
  dataProcessed: string[]
  dpaStatus: string
  dataRegions: string[]
  criticality: string
  owner: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}): Vendor {
  return vendorSchema.parse({
    id: record.id,
    name: record.name,
    category: record.category,
    purpose: record.purpose,
    hasSubprocessors: record.hasSubprocessors,
    dataProcessed: record.dataProcessed,
    dpaStatus: record.dpaStatus,
    dataRegions: record.dataRegions,
    criticality: record.criticality,
    owner: record.owner ?? "",
    notes: record.notes ?? "",
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
  })
}

export type { PrismaClient }
