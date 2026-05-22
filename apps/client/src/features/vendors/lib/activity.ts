import {
  type BusinessActivity,
  type BusinessActivityInput,
} from "@plyco/shared"

export const emptyActivityDraft: BusinessActivityInput = {
  name: "",
  purpose: "",
  role: "",
  legalBasis: [],
  retentionDays: 0,
}

export const toActivityInput = (
  activity: BusinessActivity | BusinessActivityInput,
): BusinessActivityInput => ({
  name: activity.name,
  purpose: activity.purpose,
  role: activity.role,
  legalBasis: activity.legalBasis,
  retentionDays: activity.retentionDays,
})
