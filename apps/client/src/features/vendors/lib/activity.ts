import {
  type BusinessActivity,
  type BusinessActivityInput,
} from "@plyco/shared"

export const emptyActivityDraft: BusinessActivityInput = {
  name: "",
  description: "",
  purposes: [],
  legalBasis: [],
}

export const toActivityInput = (
  activity: BusinessActivity | BusinessActivityInput,
): BusinessActivityInput => ({
  name: activity.name,
  description: activity.description,
  purposes: activity.purposes,
  legalBasis: activity.legalBasis,
})
