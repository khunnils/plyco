import {
  providerLookupResultSchema,
  type ProviderLookupResult,
} from "@plyco/shared"

import { type ProviderLookupCodeSource } from "../../infrastructure/airtable-code-source.js"
import { ApiError } from "../../infrastructure/errors.js"
import {
  providerLookupResponseSchema,
  type LlmJsonClient,
} from "../../infrastructure/llm-client.js"
import { type PromptClient } from "../../infrastructure/prompt-client.js"

const PROMPT_NAME = "resolve_provider"

export interface ProviderLookupService {
  lookup(inputUrl: string): Promise<ProviderLookupResult>
}

const promptCodePayload = (codes: Array<{ code: string }>) =>
  JSON.stringify(codes.map(({ code }) => code))

const assertKnownCode = (
  field: string,
  value: string,
  allowedCodes: Set<string>,
  codeSetId: string,
) => {
  if (allowedCodes.has(value)) {
    return
  }

  throw new ApiError(
    "PROVIDER_LOOKUP_UNKNOWN_CODE",
    "Provider lookup returned a code that is not available in Airtable.",
    502,
    { codeSetId, field, value },
  )
}

export class LlmProviderLookupService implements ProviderLookupService {
  constructor(
    private readonly codeSource: ProviderLookupCodeSource,
    private readonly promptClient: PromptClient,
    private readonly llmClient: LlmJsonClient,
    private readonly model: string,
  ) {}

  async lookup(inputUrl: string): Promise<ProviderLookupResult> {
    const codes = await this.codeSource.listLookupCodes()
    const prompt = await this.promptClient.compilePrompt(PROMPT_NAME, {
      inputUrl,
      categories: promptCodePayload(codes.categories),
    })
    const generated = await this.llmClient.generateJson({
      model: this.model,
      prompt,
      responseSchema: providerLookupResponseSchema({
        categories: codes.categories.map((code) => code.code),
      }),
    })

    const generatedWithSystemType =
      typeof generated === "object" && generated && "provider" in generated
        ? {
            ...generated,
            provider:
              typeof generated.provider === "object" && generated.provider
                ? { ...generated.provider, systemType: null }
                : generated.provider,
          }
        : generated

    const parsed = providerLookupResultSchema.safeParse(generatedWithSystemType)

    if (!parsed.success) {
      throw new ApiError(
        "PROVIDER_LOOKUP_INVALID_RESPONSE",
        "Provider lookup returned an invalid response shape.",
        502,
        parsed.error.flatten(),
      )
    }

    assertKnownCode(
      "provider.category",
      parsed.data.provider.category,
      new Set(codes.categories.map((code) => code.code)),
      "provider_categories",
    )

    return parsed.data
  }
}
