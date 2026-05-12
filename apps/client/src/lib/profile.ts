import {
  emptyAccessProfile,
  emptyCompanyProfile,
  emptyDataHandlingProfile,
  emptyInfrastructureProfile,
  type OrganizationSecurityProfile,
  type Vendor,
  type VendorInput,
} from "@complyflow/shared"

import { type ProfileDraft } from "@/types/security-profile"

export const emptyProfileDraft: ProfileDraft = {
  company: emptyCompanyProfile,
  infrastructure: emptyInfrastructureProfile,
  dataHandling: emptyDataHandlingProfile,
  access: emptyAccessProfile,
}

export const emptyVendorDraft: VendorInput = {
  name: "",
  category: "",
  purpose: "",
  hasSubprocessors: false,
  dataProcessed: [],
  dpaStatus: "not_started",
  dataRegions: [],
  criticality: "medium",
  owner: "",
  notes: "",
}

export const profileFromOrganization = (
  organization: OrganizationSecurityProfile | null
): ProfileDraft => {
  if (!organization) {
    return emptyProfileDraft
  }

  return {
    company: organization.company,
    infrastructure: organization.infrastructure,
    dataHandling: organization.dataHandling,
    access: organization.access,
  }
}

export const toVendorInput = (vendor: Vendor | VendorInput): VendorInput => ({
  name: vendor.name,
  category: vendor.category,
  purpose: vendor.purpose,
  hasSubprocessors: vendor.hasSubprocessors,
  dataProcessed: vendor.dataProcessed,
  dpaStatus: vendor.dpaStatus,
  dataRegions: vendor.dataRegions,
  criticality: vendor.criticality,
  owner: vendor.owner,
  notes: vendor.notes,
})
