import { type Vocabulary } from "@plyco/shared"

import { codeLabel } from "@/features/vocabulary/lib/vocabulary"

export const activityRetentionLabel = (
  vocabulary: Vocabulary | undefined,
  retentionPolicy: string | null,
  retentionDays: number,
) => {
  if (retentionPolicy === "not_defined") {
    return "Not defined"
  }

  if (retentionPolicy === "fixed" && retentionDays > 0) {
    return `${retentionDays} days`
  }

  return retentionPolicy
    ? codeLabel(vocabulary, "activity_retention_policies", retentionPolicy)
    : "Not set"
}

export const codeValueList = (
  vocabulary: Vocabulary | undefined,
  codeSetId: string,
  values: string[],
) =>
  values.length > 0
    ? values.map((value) => codeLabel(vocabulary, codeSetId, value)).join(", ")
    : "Not set"
