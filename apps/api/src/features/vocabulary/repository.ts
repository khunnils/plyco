import {
  type Country,
  type Vocabulary,
  type VocabularyCode,
  type VocabularyCodeInput,
} from "@complyflow/shared"

export type CodeSetScope = "system" | "organization"

export interface VocabularyRepository {
  listCountries(): Promise<Country[]>
  listVocabulary(organizationId: string): Promise<Vocabulary>
  cloneOrganizationVocabulary(organizationId: string): Promise<void>
  createOrganizationCode(
    organizationId: string,
    codeSetId: string,
    input: VocabularyCodeInput,
  ): Promise<VocabularyCode | null>
  updateOrganizationCode(
    organizationId: string,
    codeSetId: string,
    codeId: string,
    input: VocabularyCodeInput,
  ): Promise<VocabularyCode | null>
  deleteOrganizationCode(
    organizationId: string,
    codeSetId: string,
    codeId: string,
  ): Promise<boolean>
  codeExists(
    organizationId: string,
    codeSetId: string,
    codeId: string,
  ): Promise<boolean>
  countryExists(code: string): Promise<boolean>
}
