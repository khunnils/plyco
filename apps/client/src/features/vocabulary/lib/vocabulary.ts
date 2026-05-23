import {
  type Country,
  type Vocabulary,
  type VocabularyCode,
} from "@plyco/shared"

export type Option = { value: string; label: string }

const sortCodesBySequenceThenName = (
  first: VocabularyCode,
  second: VocabularyCode,
) =>
  first.sortOrder - second.sortOrder ||
  first.name.localeCompare(second.name, undefined, { sensitivity: "base" })

export const codeOptions = (
  vocabulary: Vocabulary | undefined,
  codeSetId: string,
): Option[] =>
  vocabulary?.codeSets
    .find((codeSet) => codeSet.codeSetId === codeSetId)
    ?.codes.filter((code) => code.active)
    .sort(sortCodesBySequenceThenName)
    .map((code) => ({ value: code.codeId, label: code.name })) ?? []

export const countryOptions = (countries: Country[] | undefined): Option[] =>
  countries?.map((country) => ({
    value: country.code,
    label: country.name,
  })) ?? []

export const codeLabel = (
  vocabulary: Vocabulary | undefined,
  codeSetId: string,
  codeId: string,
) =>
  vocabulary?.codeSets
    .find((codeSet) => codeSet.codeSetId === codeSetId)
    ?.codes.find((code) => code.codeId === codeId)?.name ?? codeId

export const codeValueList = (
  vocabulary: Vocabulary | undefined,
  codeSetId: string,
  values: string[] | null,
) =>
  values && values.length > 0
    ? values.map((value) => codeLabel(vocabulary, codeSetId, value)).join(", ")
    : "Not set"

export const countryLabel = (
  countries: Country[] | undefined,
  code: string | null,
) => countries?.find((country) => country.code === code)?.name ?? code
