import { type StoredDataType } from "@plyco/shared"

export const emptyDataTypeDraft = (): StoredDataType => ({
  name: "",
  description: "",
  subjectTypes: [],
  collectionMethods: [],
  retentionDays: 0,
  isSensitive: false,
  isRequired: false,
})

export const normalizeDataType = (
  value: Partial<StoredDataType> | undefined,
): StoredDataType => ({
  ...emptyDataTypeDraft(),
  ...value,
  subjectTypes: Array.isArray(value?.subjectTypes) ? value.subjectTypes : [],
  collectionMethods: Array.isArray(value?.collectionMethods)
    ? value.collectionMethods
    : [],
  retentionDays:
    typeof value?.retentionDays === "number" &&
    Number.isFinite(value.retentionDays)
      ? value.retentionDays
      : 0,
})
