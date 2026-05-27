import {
  GoogleGenAI,
  Type,
  type GenerateContentResponseUsageMetadata,
  type SchemaUnion,
} from "@google/genai"
import { startObservation } from "@langfuse/tracing"

import { ApiError } from "./errors.js"
import { type ResolvedPrompt } from "./prompt-client.js"

export interface LlmJsonClient {
  generateJson({
    model,
    prompt,
    responseSchema,
  }: {
    model: string
    prompt: ResolvedPrompt
    responseSchema: SchemaUnion
  }): Promise<unknown>
}

const usageDetails = (
  usageMetadata: GenerateContentResponseUsageMetadata | undefined,
) => {
  if (!usageMetadata) {
    return undefined
  }

  return {
    input: usageMetadata.promptTokenCount ?? 0,
    output: usageMetadata.candidatesTokenCount ?? 0,
    total: usageMetadata.totalTokenCount ?? 0,
  }
}

export class GeminiJsonClient implements LlmJsonClient {
  private readonly client: GoogleGenAI

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey })
  }

  async generateJson({
    model,
    prompt,
    responseSchema,
  }: {
    model: string
    prompt: ResolvedPrompt
    responseSchema: SchemaUnion
  }): Promise<unknown> {
    const generation = startObservation(
      "provider-lookup",
      {
        model,
        prompt: prompt.metadata,
      },
      { asType: "generation" },
    )

    try {
      const response = await this.client.models.generateContent({
        model,
        contents: prompt.content,
        config: {
          responseMimeType: "application/json",
          responseSchema,
        },
      })
      const text = response.text

      if (!text) {
        throw new ApiError(
          "LLM_EMPTY_RESPONSE",
          "Provider lookup returned an empty response.",
          502,
        )
      }

      const parsed = JSON.parse(text) as unknown
      generation.update({
        output: parsed,
        usageDetails: usageDetails(response.usageMetadata),
      })

      return parsed
    } catch (error) {
      generation.update({
        level: "ERROR",
        statusMessage:
          error instanceof Error ? error.message : "Provider lookup failed.",
      })

      if (error instanceof ApiError) {
        throw error
      }

      if (error instanceof SyntaxError) {
        throw new ApiError(
          "LLM_INVALID_JSON",
          "Provider lookup returned invalid JSON.",
          502,
        )
      }

      throw new ApiError(
        "LLM_PROVIDER_LOOKUP_FAILED",
        "Provider lookup generation failed.",
        502,
      )
    } finally {
      generation.end()
    }
  }
}

export const providerLookupResponseSchema = {
  type: Type.OBJECT,
  properties: {
    organization: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        name: { type: Type.STRING },
        legalName: { type: Type.STRING },
        countryOfRegistration: { type: Type.STRING },
        website: { type: Type.STRING },
      },
      required: [
        "id",
        "name",
        "legalName",
        "countryOfRegistration",
        "website",
      ],
    },
    provider: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        name: { type: Type.STRING },
        organization: { type: Type.STRING },
        category: { type: Type.STRING },
        purpose: { type: Type.STRING },
        categoryName: { type: Type.STRING },
        url: { type: Type.STRING },
        systemType: { type: Type.STRING },
        securityCriticality: { type: Type.STRING },
        handlesCustomerData: { type: Type.BOOLEAN },
      },
      required: [
        "id",
        "name",
        "organization",
        "category",
        "purpose",
        "categoryName",
        "url",
        "systemType",
        "securityCriticality",
        "handlesCustomerData",
      ],
    },
  },
  required: ["organization", "provider"],
} satisfies SchemaUnion
