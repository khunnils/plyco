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

const CODE_SETS_WITH_NONE = new Set([
  "privacy_supported_rights",
  "privacy_request_methods",
  "privacy_cookie_consent_mechanisms",
  "privacy_marketing_opt_out_methods",
  "privacy_transfer_mechanisms",
  "security_cadences",
  "security_key_management_providers",
  "security_customer_notification_processes",
  "security_notification_timelines",
  "security_monitoring_owners",
])

export const codeOptions = (
  vocabulary: Vocabulary | undefined,
  codeSetId: string,
): Option[] => {
  const options =
    vocabulary?.codeSets
      .find((codeSet) => codeSet.codeSetId === codeSetId)
      ?.codes.filter((code) => code.active)
      .sort(sortCodesBySequenceThenName)
      .map((code) => ({ value: code.codeId, label: code.name })) ?? []

  if (CODE_SETS_WITH_NONE.has(codeSetId) && !options.some((opt) => opt.value === "none")) {
    options.push({ value: "none", label: "None" })
  }

  return options
}

export const countryOptions = (countries: Country[] | undefined): Option[] =>
  countries?.map((country) => ({
    value: country.code,
    label: country.name,
  })) ?? []

export const codeLabel = (
  vocabulary: Vocabulary | undefined,
  codeSetId: string,
  codeId: string,
) => {
  if (codeId === "none") {
    return "None"
  }
  return (
    vocabulary?.codeSets
      .find((codeSet) => codeSet.codeSetId === codeSetId)
      ?.codes.find((code) => code.codeId === codeId)?.name ?? codeId
  )
}

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
