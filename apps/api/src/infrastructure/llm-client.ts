import {
  GoogleGenAI,
  Type,
  type GenerateContentResponseUsageMetadata,
  type SchemaUnion,
} from "@google/genai"
import { startObservation } from "@langfuse/tracing"

import { ApiError } from "./errors.js"
import { flushInstrumentation } from "./instrumentation.js"
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

export type ProviderLookupResponseSchemaOptions = {
  categories: string[]
}

export type OrganizationLookupCodeSetId =
  | "industries"
  | "regions"
  | "compliance_goals"
  | "service_user_types"
  | "service_customer_types"
  | "cookie_tracking_categories"
  | "privacy_cookie_consent_mechanisms"
  | "subject_types"
  | "collection_methods"
  | "activity_role"
  | "legal_basis"
  | "activity_retention_policies"

export type OrganizationLookupResponseSchemaOptions = Record<
  OrganizationLookupCodeSetId,
  string[]
>

const nullableStringSchema = { type: Type.STRING, nullable: true } as const
const nullableBooleanSchema = { type: Type.BOOLEAN, nullable: true } as const
const nullableIntegerSchema = { type: Type.INTEGER, nullable: true } as const
const codeIdArraySchema = (codes: string[]) => ({
  type: Type.ARRAY,
  items: { type: Type.STRING, enum: codes },
  nullable: true,
}) as const

const nullableCodeIdSchema = (codes: string[]) => ({
  type: Type.STRING,
  enum: codes,
  nullable: true,
}) as const

const servicePrivacyResponseSchema = (
  codeSets: OrganizationLookupResponseSchemaOptions,
) => ({
  type: Type.OBJECT,
  properties: {
    usesCookiesOrTrackingTechnologies: nullableBooleanSchema,
    cookieTrackingCategories: codeIdArraySchema(
      codeSets.cookie_tracking_categories,
    ),
    cookieConsentMechanism: nullableCodeIdSchema(
      codeSets.privacy_cookie_consent_mechanisms,
    ),
    doNotTrackResponse: nullableBooleanSchema,
    globalPrivacyControlSupported: nullableBooleanSchema,
    primaryHostingRegion: nullableCodeIdSchema(codeSets.regions),
  },
  required: [
    "usesCookiesOrTrackingTechnologies",
    "cookieTrackingCategories",
    "cookieConsentMechanism",
    "doNotTrackResponse",
    "globalPrivacyControlSupported",
    "primaryHostingRegion",
  ],
}) satisfies SchemaUnion

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

const llmErrorDetails = (error: unknown) => {
  if (!(error instanceof Error)) {
    return undefined
  }

  return {
    cause: error.name,
    message: error.message.slice(0, 1000),
    statusCode:
      "status" in error && typeof error.status === "number"
        ? error.status
        : "statusCode" in error && typeof error.statusCode === "number"
          ? error.statusCode
          : undefined,
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
    const operationName = prompt.metadata.name
    const generation = startObservation(
      operationName,
      {
        input: prompt.inputVariables,
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
          "LLM generation returned an empty response.",
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
      const details = llmErrorDetails(error)
      generation.update({
        level: "ERROR",
        statusMessage:
          error instanceof Error ? error.message : "LLM generation failed.",
        output: details,
      })

      if (error instanceof ApiError) {
        throw error
      }

      if (error instanceof SyntaxError) {
        throw new ApiError(
          "LLM_INVALID_JSON",
          "LLM generation returned invalid JSON.",
          502,
        )
      }

      throw new ApiError(
        "LLM_GENERATION_FAILED",
        "LLM generation failed.",
        502,
        details,
      )
    } finally {
      generation.end()
      await flushInstrumentation()
    }
  }
}

export const providerLookupResponseSchema = ({
  categories,
}: ProviderLookupResponseSchemaOptions) => ({
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
        category: { type: Type.STRING, enum: categories },
        purpose: { type: Type.STRING },
        url: { type: Type.STRING },
        securityCriticality: { type: Type.STRING },
        handlesCustomerData: { type: Type.BOOLEAN },
      },
      required: [
        "id",
        "name",
        "organization",
        "category",
        "purpose",
        "url",
        "securityCriticality",
        "handlesCustomerData",
      ],
    },
  },
  required: ["organization", "provider"],
}) satisfies SchemaUnion

export const organizationLookupResponseSchema = (
  codeSets: OrganizationLookupResponseSchemaOptions,
) =>
  ({
    type: Type.OBJECT,
    properties: {
      company: {
        type: Type.OBJECT,
        properties: {
          companyName: { type: Type.STRING },
          legalEntityName: nullableStringSchema,
          website: nullableStringSchema,
          contactEmail: nullableStringSchema,
          securityContactEmail: nullableStringSchema,
          privacyContactEmail: nullableStringSchema,
          country: nullableStringSchema,
          address: nullableStringSchema,
          employeeCount: nullableIntegerSchema,
          industries: codeIdArraySchema(codeSets.industries),
          regions: codeIdArraySchema(codeSets.regions),
          handlesPii: nullableBooleanSchema,
          handlesSensitiveData: nullableBooleanSchema,
          storesPii: nullableBooleanSchema,
          storesHealthcareData: nullableBooleanSchema,
          complianceGoals: codeIdArraySchema(codeSets.compliance_goals),
        },
        required: [
          "companyName",
          "legalEntityName",
          "website",
          "contactEmail",
          "securityContactEmail",
          "privacyContactEmail",
          "country",
          "address",
          "employeeCount",
          "industries",
          "regions",
          "handlesPii",
          "handlesSensitiveData",
          "storesPii",
          "storesHealthcareData",
          "complianceGoals",
        ],
      },
      primaryService: {
        type: Type.OBJECT,
        properties: {
          serviceName: nullableStringSchema,
          serviceDescription: nullableStringSchema,
          serviceUrl: nullableStringSchema,
          businessActivityIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          userTypes: codeIdArraySchema(codeSets.service_user_types),
          customerTypes: codeIdArraySchema(codeSets.service_customer_types),
          availabilityRegions: codeIdArraySchema(codeSets.regions),
          childrenDirected: nullableBooleanSchema,
          minimumUserAge: nullableIntegerSchema,
          privacy: servicePrivacyResponseSchema(codeSets),
        },
        required: [
          "serviceName",
          "serviceDescription",
          "serviceUrl",
          "businessActivityIds",
          "userTypes",
          "customerTypes",
          "availabilityRegions",
          "childrenDirected",
          "minimumUserAge",
          "privacy",
        ],
      },
      primaryDataType: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: nullableStringSchema,
          subjectTypes: codeIdArraySchema(codeSets.subject_types),
          collectionMethods: codeIdArraySchema(codeSets.collection_methods),
          isSensitive: nullableBooleanSchema,
          isRequired: nullableBooleanSchema,
        },
        required: [
          "name",
          "description",
          "subjectTypes",
          "collectionMethods",
          "isSensitive",
          "isRequired",
        ],
      },
      primaryActivity: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          purpose: { type: Type.STRING },
          role: nullableCodeIdSchema(codeSets.activity_role),
          legalBasis: {
            type: Type.ARRAY,
            items: { type: Type.STRING, enum: codeSets.legal_basis },
          },
          retentionPolicy: nullableCodeIdSchema(
            codeSets.activity_retention_policies,
          ),
          retentionDays: { type: Type.INTEGER },
        },
        required: [
          "name",
          "purpose",
          "role",
          "legalBasis",
          "retentionPolicy",
          "retentionDays",
        ],
      },
      suggestedProviders: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            url: { type: Type.STRING },
            purpose: { type: Type.STRING },
          },
          required: ["name"],
        },
      },
      policyLinks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: {
              type: Type.STRING,
              enum: [
                "privacy_policy",
                "data_security",
                "subprocessors",
                "terms",
                "other",
              ],
            },
            title: { type: Type.STRING },
            url: { type: Type.STRING },
          },
          required: ["type", "title", "url"],
        },
      },
      warnings: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
    required: [
      "company",
      "primaryService",
      "primaryDataType",
      "primaryActivity",
      "suggestedProviders",
      "policyLinks",
      "warnings",
    ],
  }) satisfies SchemaUnion
