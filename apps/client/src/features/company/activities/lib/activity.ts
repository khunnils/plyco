import {
  type BusinessActivity,
  type BusinessActivityInput,
} from "@plyco/shared"

export const emptyActivityDraft: BusinessActivityInput = {
  name: "",
  purpose: "",
  role: "",
  legalBasis: [],
  dataTypeIds: [],
  retentionPolicy: null,
  retentionDays: 0,
}

export const toActivityInput = (
  activity: BusinessActivity | BusinessActivityInput
): BusinessActivityInput => ({
  name: activity.name,
  purpose: activity.purpose,
  role: activity.role,
  legalBasis: activity.legalBasis,
  dataTypeIds: activity.dataTypeIds,
  retentionPolicy: activity.retentionPolicy ?? null,
  retentionDays: activity.retentionDays,
})
