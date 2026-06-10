import { type StoredDataType } from "@plyco/shared"

export const emptyDataTypeDraft = (): StoredDataType => ({
  sortOrder: 0,
  name: "",
  description: "",
  subjectTypes: [],
  collectionMethods: [],
  isSensitive: false,
  isRequired: false,
})

export const normalizeDataType = (
  value: Partial<StoredDataType> | undefined
): StoredDataType => ({
  ...emptyDataTypeDraft(),
  ...value,
  subjectTypes: Array.isArray(value?.subjectTypes) ? value.subjectTypes : [],
  collectionMethods: Array.isArray(value?.collectionMethods)
    ? value.collectionMethods
    : [],
})
