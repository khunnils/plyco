import { type Country, type Vocabulary } from "@complyflow/shared"

export type Option = { value: string; label: string }

export const codeOptions = (
  vocabulary: Vocabulary | undefined,
  codeSetId: string,
): Option[] =>
  vocabulary?.codeSets
    .find((codeSet) => codeSet.codeSetId === codeSetId)
    ?.codes.filter((code) => code.active)
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

export const countryLabel = (
  countries: Country[] | undefined,
  code: string,
) => countries?.find((country) => country.code === code)?.name ?? code
