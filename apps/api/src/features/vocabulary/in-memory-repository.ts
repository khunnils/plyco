import {
  vocabularyCodeInputSchema,
  type Country,
  type Vocabulary,
  type VocabularyCode,
  type VocabularyCodeSet,
  type VocabularyCodeInput,
} from "@plyco/shared";

import { countries } from "./reference-data.js";
import { type VocabularyRepository } from "./repository.js";

export class InMemoryVocabularyRepository implements VocabularyRepository {
  private readonly systemCodeSets: Map<string, VocabularyCodeSet>;

  constructor(
    private readonly initialCodeSets: VocabularyCodeSet[] = [],
  ) {
    this.systemCodeSets = new Map(
      initialCodeSets
        .filter((codeSet) => codeSet.isSystem)
        .map((codeSet) => [codeSet.codeSetId, codeSet]),
    );
  }

  private readonly countriesByCode = new Map(
    countries.map((country) => [country.code, country]),
  );
  private readonly organizationCodeSets = new Map<
    string,
    VocabularyCodeSet[]
  >();
  private readonly deletedOrganizationCodes = new Set<string>();

  async listCountries(): Promise<Country[]> {
    return Array.from(this.countriesByCode.values());
  }

  async listVocabulary(organizationId: string): Promise<Vocabulary> {
    await this.cloneOrganizationVocabulary(organizationId);

    return {
      codeSets: [
        ...Array.from(this.systemCodeSets.values()),
        ...(this.organizationCodeSets.get(organizationId) ?? []).map(
          (codeSet) => ({
            ...codeSet,
            codes: codeSet.codes.filter(
              (code) =>
                !this.deletedOrganizationCodes.has(
                  this.organizationCodeKey(
                    organizationId,
                    codeSet.codeSetId,
                    code.codeId,
                  ),
                ),
            ),
          }),
        ),
      ],
    };
  }

  async cloneOrganizationVocabulary(organizationId: string): Promise<void> {
    if (this.organizationCodeSets.has(organizationId)) {
      return;
    }

    this.organizationCodeSets.set(
      organizationId,
      this.initialCodeSets
        .filter((codeSet) => !codeSet.isSystem)
        .map((codeSet) => ({
          ...codeSet,
          id: `${organizationId}:${codeSet.codeSetId}`,
          isSystem: false,
          codes: codeSet.codes.map((code) => ({
            ...code,
            id: `${organizationId}:${codeSet.codeSetId}:${code.codeId}`,
            isSystem: false,
          })),
        })),
    );
  }

  async createOrganizationCode(
    organizationId: string,
    codeSetId: string,
    input: VocabularyCodeInput,
  ): Promise<VocabularyCode | null> {
    const parsed = vocabularyCodeInputSchema.parse(input);
    const codeSet = await this.organizationCodeSet(organizationId, codeSetId);

    if (
      !codeSet ||
      codeSet.codes.some((code) => code.codeId === parsed.codeId)
    ) {
      return null;
    }

    const code: VocabularyCode = {
      id: `${organizationId}:${codeSetId}:${parsed.codeId}`,
      codeId: parsed.codeId,
      name: parsed.name,
      description: parsed.description,
      sortOrder: codeSet.codes.length,
      active: parsed.active,
      isSystem: false,
    };

    codeSet.codes.push(code);
    return code;
  }

  async updateOrganizationCode(
    organizationId: string,
    codeSetId: string,
    codeId: string,
    input: VocabularyCodeInput,
  ): Promise<VocabularyCode | null> {
    const parsed = vocabularyCodeInputSchema.parse(input);
    const codeSet = await this.organizationCodeSet(organizationId, codeSetId);
    const code = codeSet?.codes.find(
      (current) =>
        current.codeId === codeId &&
        !this.deletedOrganizationCodes.has(
          this.organizationCodeKey(organizationId, codeSetId, current.codeId),
        ),
    );

    if (!codeSet || !code) {
      return null;
    }

    if (
      parsed.codeId !== codeId &&
      codeSet.codes.some((current) => current.codeId === parsed.codeId)
    ) {
      return null;
    }

    code.codeId = parsed.codeId;
    code.name = parsed.name;
    code.description = parsed.description;
    code.active = parsed.active;
    return code;
  }

  async deleteOrganizationCode(
    organizationId: string,
    codeSetId: string,
    codeId: string,
  ): Promise<boolean> {
    const codeSet = await this.organizationCodeSet(organizationId, codeSetId);

    if (!codeSet) {
      return false;
    }

    const code = codeSet.codes.find(
      (current) =>
        current.codeId === codeId &&
        !this.deletedOrganizationCodes.has(
          this.organizationCodeKey(organizationId, codeSetId, current.codeId),
        ),
    );

    if (!code) {
      return false;
    }

    this.deletedOrganizationCodes.add(
      this.organizationCodeKey(organizationId, codeSetId, code.codeId),
    );
    return true;
  }

  async codeExists(
    organizationId: string,
    codeSetId: string,
    codeId: string,
  ): Promise<boolean> {
    if (codeId === "none") {
      return true;
    }

    const vocabulary = await this.listVocabulary(organizationId);
    return (
      vocabulary.codeSets
        .find((codeSet) => codeSet.codeSetId === codeSetId)
        ?.codes.some((code) => code.codeId === codeId && code.active) ?? false
    );
  }

  async countryExists(code: string): Promise<boolean> {
    return this.countriesByCode.has(code);
  }

  private async organizationCodeSet(organizationId: string, codeSetId: string) {
    await this.cloneOrganizationVocabulary(organizationId);
    return this.organizationCodeSets
      .get(organizationId)
      ?.find((codeSet) => codeSet.codeSetId === codeSetId);
  }

  private organizationCodeKey(
    organizationId: string,
    codeSetId: string,
    codeId: string,
  ) {
    return `${organizationId}:${codeSetId}:${codeId}`;
  }
}
