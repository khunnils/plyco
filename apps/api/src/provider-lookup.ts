import {
  providerLookupResultSchema,
  type ProviderLookupResult,
} from "@plyco/shared"

import { type ProviderLookupCodeSource } from "./airtable-code-source.js"
import { ApiError } from "./errors.js"
import {
  providerLookupResponseSchema,
  type LlmJsonClient,
} from "./llm-client.js"
import { type PromptClient } from "./prompt-client.js"

const PROMPT_NAME = "resolve_provider"

export interface ProviderLookupService {
  lookup(inputUrl: string): Promise<ProviderLookupResult>
}

const promptCodePayload = (
  codes: Array<{
    code: string
    name: string
  }>,
) => JSON.stringify(codes.map(({ code, name }) => ({ code, name })))

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
      systemTypes: promptCodePayload(codes.systemTypes),
    })
    const generated = await this.llmClient.generateJson({
      model: this.model,
      prompt,
      responseSchema: providerLookupResponseSchema({
        categories: codes.categories.map((code) => code.code),
        systemTypes: codes.systemTypes.map((code) => code.code),
      }),
    })
    const parsed = providerLookupResultSchema.safeParse(generated)

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
      "vendor_category",
    )
    assertKnownCode(
      "provider.systemType",
      parsed.data.provider.systemType,
      new Set(codes.systemTypes.map((code) => code.code)),
      "provider_system_type",
    )

    return parsed.data
  }
}
