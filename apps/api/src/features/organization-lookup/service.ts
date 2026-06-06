import { Type, type SchemaUnion, type Tool } from "@google/genai";
import {
  emptyCompanyProfile,
  emptyPrivacyProfile,
  emptyServiceProfile,
  codeIdSchema,
  countryCodeSchema,
  organizationLookupResultSchema,
  privacyProfileSchema,
  type BusinessActivityInput,
  type OrganizationLookupPolicyLink,
  type OrganizationLookupResult,
  type OrganizationPrivacyPolicyLookupInput,
  type OrganizationWebsiteLookupInput,
  type PrivacyProfile,
  type StoredDataType,
} from "@plyco/shared";
import { z } from "zod";

import { apiConfig } from "../../config.js";
import {
  linkedRecordIds,
  listAirtableRecords,
  numberField,
  stringField,
} from "../../infrastructure/airtable.js";
import { ApiError } from "../../infrastructure/errors.js";
import {
  GeminiJsonClient,
  type LlmJsonClient,
} from "../../infrastructure/llm-client.js";
import {
  LangfusePromptClient,
  type PromptClient,
} from "../../infrastructure/prompt-client.js";

export interface OrganizationLookupService {
  lookupWebsite(
    input: OrganizationWebsiteLookupInput,
  ): Promise<OrganizationLookupResult>;
  lookupPrivacyPolicy(
    input: OrganizationPrivacyPolicyLookupInput,
  ): Promise<PrivacyProfile>;
}

export interface OrganizationLookupCodeSource {
  listCodeSets(codeSetIds: readonly CodeSetId[]): Promise<CodeSetMap>;
}

type CodeSetId =
  | "industries"
  | "regions"
  | "subject_types"
  | "collection_methods"
  | "activity_role"
  | "legal_basis"
  | "activity_retention_policies"
  | "privacy_supported_rights"
  | "privacy_request_methods"
  | "defined_statuses"
  | "privacy_transfer_mechanisms"
  | "privacy_dpo_statuses"
  | "privacy_eu_representative_statuses";

const WEBSITE_PROMPT_NAME = "website_parser";
const PRIVACY_PROMPT_NAME = "privacy_policy_parser";
const CODE_SETS_TABLE_NAME = "Code Sets";
const CODES_TABLE_NAME = "Codes";
const GEMINI_URL_TOOLS: Tool[] = [{ googleSearch: {} }, { urlContext: {} }];

const websiteCodeSetIds = [
  "industries",
  "regions",
  "subject_types",
  "collection_methods",
  "activity_role",
  "legal_basis",
  "activity_retention_policies",
] as const satisfies readonly CodeSetId[];

const privacyCodeSetIds = [
  "privacy_supported_rights",
  "privacy_request_methods",
  "defined_statuses",
  "privacy_transfer_mechanisms",
  "privacy_dpo_statuses",
  "privacy_eu_representative_statuses",
] as const satisfies readonly CodeSetId[];

const nullableStringSchema = { type: Type.STRING, nullable: true } as const;
const nullableBooleanSchema = { type: Type.BOOLEAN, nullable: true } as const;
const nullableIntegerSchema = { type: Type.INTEGER, nullable: true } as const;

type CodeSetMap = Partial<Record<CodeSetId, string[]>>;

const activeField = (fields: Record<string, unknown>) =>
  fields.Active !== false && fields["Is Active"] !== false;

const emptyCodeSetMap = (codeSetIds: readonly CodeSetId[]) =>
  Object.fromEntries(
    codeSetIds.map((codeSetId) => [codeSetId, []]),
  ) as CodeSetMap;

export class AirtableOrganizationLookupCodeSource implements OrganizationLookupCodeSource {
  constructor(
    private readonly baseId: string,
    private readonly apiKey: string,
  ) {}

  async listCodeSets(codeSetIds: readonly CodeSetId[]): Promise<CodeSetMap> {
    const requested = new Set<string>(codeSetIds);
    let codeSetRecords;
    let codeRecords;

    try {
      const records = await Promise.all([
        listAirtableRecords({
          apiKey: this.apiKey,
          baseId: this.baseId,
          tableName: CODE_SETS_TABLE_NAME,
        }),
        listAirtableRecords({
          apiKey: this.apiKey,
          baseId: this.baseId,
          tableName: CODES_TABLE_NAME,
        }),
      ]);
      codeSetRecords = records[0];
      codeRecords = records[1];
    } catch (error) {
      if (error instanceof ApiError && error.code === "AIRTABLE_LOAD_FAILED") {
        throw new ApiError(
          "ORGANIZATION_LOOKUP_CODES_LOAD_FAILED",
          "Unable to load organization lookup codes from Airtable.",
          502,
          error.details,
        );
      }

      throw error;
    }

    const codeSetRecordsByAirtableId = new Map(
      codeSetRecords.map((record) => [record.id, record]),
    );
    const result = emptyCodeSetMap(codeSetIds);
    const sortedCodeRecords = codeRecords
      .map((record, index) => ({
        fields: record.fields,
        sortOrder:
          numberField(
            record.fields,
            "Sequence",
            "Sort Order",
            "Sort",
            "Order",
          ) ?? index,
      }))
      .sort((first, second) => first.sortOrder - second.sortOrder);

    for (const record of sortedCodeRecords) {
      const linkedCodeSetId = linkedRecordIds(
        record.fields,
        "Code Set",
        "Code Sets",
        "Code set",
        "code_set",
      )[0];
      const linkedCodeSet = linkedCodeSetId
        ? codeSetRecordsByAirtableId.get(linkedCodeSetId)
        : undefined;
      const codeSetId = linkedCodeSet
        ? stringField(linkedCodeSet.fields, "Id", "Key")
        : "";
      const codeId = stringField(record.fields, "Id", "Key");

      if (
        !codeSetId ||
        !codeId ||
        !requested.has(codeSetId) ||
        !activeField(record.fields)
      ) {
        continue;
      }

      result[codeSetId as CodeSetId]?.push(codeId);
    }

    return result;
  }
}

export class StaticOrganizationLookupCodeSource implements OrganizationLookupCodeSource {
  constructor(private readonly codeSets: CodeSetMap) {}

  async listCodeSets(codeSetIds: readonly CodeSetId[]): Promise<CodeSetMap> {
    return Object.fromEntries(
      codeSetIds.map((codeSetId) => [
        codeSetId,
        this.codeSets[codeSetId] ?? [],
      ]),
    ) as CodeSetMap;
  }
}

const codesFor = (codeSets: CodeSetMap, codeSetId: CodeSetId) =>
  codeSets[codeSetId] ?? [];

const activeCodeSets = (
  codeSetIds: readonly CodeSetId[],
  codeSets: CodeSetMap,
) =>
  codeSetIds.map((codeSetId) => {
    const codes =
      codeSetId === "regions"
        ? codesFor(codeSets, codeSetId).filter((codeId) =>
            ["us", "eu", "global"].includes(codeId),
          )
        : codesFor(codeSets, codeSetId);

    return { codeSetId, codes };
  });

const codeSetsText = (codeSetIds: readonly CodeSetId[], codeSets: CodeSetMap) =>
  activeCodeSets(codeSetIds, codeSets)
    .map(
      ({ codeSetId, codes }) =>
        `${codeSetId}\n${codes.map((code) => ` - ${code}`).join("\n")}`,
    )
    .join("\n\n");

const codeArraySchema = (codes: string[]) =>
  ({
    type: Type.ARRAY,
    items: { type: Type.STRING, enum: codes },
    nullable: true,
  }) as const;

const nullableCodeSchema = (codes: string[]) =>
  ({
    type: Type.STRING,
    enum: codes,
    nullable: true,
  }) as const;

const stringArraySchema = (maxItems: number) =>
  ({
    type: Type.ARRAY,
    items: { type: Type.STRING },
    maxItems,
  }) as const;

const websiteLookupGeneratedSchema = z.object({
  legalEntityName: z.string().trim().nullable().default(null),
  registeredCountry: countryCodeSchema.nullable().default(null),
  address: z.string().trim().nullable().default(null),
  industries: z.array(codeIdSchema).nullable().default(null),
  regions: z.array(codeIdSchema).nullable().default(null),
  handlesPii: z.boolean().nullable().default(null),
  handlesSensitiveData: z.boolean().nullable().default(null),
  handlesHealthData: z.boolean().nullable().default(null),
  handlesPersonalData: z.boolean().nullable().default(null),
  primaryService: z
    .object({
      name: z.string().trim().nullable().default(null),
      description: z.string().trim().nullable().default(null),
      activities: z
        .array(
          z.object({
            name: z.string().trim(),
            purpose: z.string().trim().default(""),
          }),
        )
        .max(5)
        .default([]),
      dataCaptured: z
        .array(
          z.object({
            name: z.string().trim(),
            description: z.string().trim().nullable().default(null),
          }),
        )
        .max(5)
        .default([]),
    })
    .default({
      name: null,
      description: null,
      activities: [],
      dataCaptured: [],
    }),
  contactEmail: z.string().trim().nullable().default(null),
  securityEmail: z.string().trim().nullable().default(null),
  privacyEmail: z.string().trim().nullable().default(null),
  privacyPolicyUrl: z.string().trim().nullable().default(null),
  warnings: z.array(z.string().trim()).max(8).default([]),
});

type WebsiteLookupGenerated = z.infer<typeof websiteLookupGeneratedSchema>;

const websiteLookupResponseSchema = (codeSets: CodeSetMap) =>
  ({
    type: Type.OBJECT,
    properties: {
      legalEntityName: nullableStringSchema,
      registeredCountry: nullableStringSchema,
      address: nullableStringSchema,
      industries: codeArraySchema(codesFor(codeSets, "industries")),
      regions: codeArraySchema(["us", "eu", "global"]),
      handlesPii: nullableBooleanSchema,
      handlesSensitiveData: nullableBooleanSchema,
      handlesHealthData: nullableBooleanSchema,
      handlesPersonalData: nullableBooleanSchema,
      primaryService: {
        type: Type.OBJECT,
        properties: {
          name: nullableStringSchema,
          description: nullableStringSchema,
          activities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description: "Name of the business activity.",
                },
                purpose: {
                  type: Type.STRING,
                  description: "Detailed purpose for this activity.",
                },
              },
              required: ["name", "purpose"],
            },
          },
          dataCaptured: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description: "Name of the data category or type.",
                },
                description: {
                  type: Type.STRING,
                  nullable: true,
                  description: "Contextual description of this data type.",
                },
              },
              required: ["name", "description"],
            },
          },
        },
        required: ["name", "description", "activities", "dataCaptured"],
      },
      contactEmail: nullableStringSchema,
      securityEmail: nullableStringSchema,
      privacyEmail: nullableStringSchema,
      privacyPolicyUrl: nullableStringSchema,
      warnings: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
    required: [
      "legalEntityName",
      "registeredCountry",
      "address",
      "industries",
      "regions",
      "handlesPii",
      "handlesSensitiveData",
      "handlesHealthData",
      "handlesPersonalData",
      "primaryService",
      "contactEmail",
      "securityEmail",
      "privacyEmail",
      "privacyPolicyUrl",
      "warnings",
    ],
  }) satisfies SchemaUnion;

const privacyPolicyResponseSchema = (codeSets: CodeSetMap) =>
  ({
    type: Type.OBJECT,
    properties: {
      supportedRights: codeArraySchema(
        codesFor(codeSets, "privacy_supported_rights"),
      ),
      requestMethods: codeArraySchema(
        codesFor(codeSets, "privacy_request_methods"),
      ),
      responseTimelineDaysStatus: nullableCodeSchema(
        codesFor(codeSets, "defined_statuses"),
      ),
      responseTimelineDays: nullableIntegerSchema,
      identityVerificationRequired: nullableBooleanSchema,
      authorizedAgentSupported: nullableBooleanSchema,
      appealProcessExists: nullableBooleanSchema,
      sendsMarketingEmails: nullableBooleanSchema,
      transactionalEmailsSent: nullableBooleanSchema,
      crossBorderTransfers: nullableBooleanSchema,
      transferMechanisms: codeArraySchema(
        codesFor(codeSets, "privacy_transfer_mechanisms"),
      ),
      sellsOrSharesData: nullableBooleanSchema,
      usesAutomatedDecisionMaking: nullableBooleanSchema,
      productionDataInDevelopment: nullableBooleanSchema,
      retentionPolicyExists: nullableBooleanSchema,
      dpoStatus: nullableCodeSchema(codesFor(codeSets, "privacy_dpo_statuses")),
      dpoName: nullableStringSchema,
      dpoEmail: nullableStringSchema,
      euRepresentativeStatus: nullableCodeSchema(
        codesFor(codeSets, "privacy_eu_representative_statuses"),
      ),
      euRepresentativeName: nullableStringSchema,
      euRepresentativeAddress: nullableStringSchema,
    },
    required: [
      "supportedRights",
      "requestMethods",
      "responseTimelineDaysStatus",
      "responseTimelineDays",
      "identityVerificationRequired",
      "authorizedAgentSupported",
      "appealProcessExists",
      "sendsMarketingEmails",
      "transactionalEmailsSent",
      "crossBorderTransfers",
      "transferMechanisms",
      "sellsOrSharesData",
      "usesAutomatedDecisionMaking",
      "productionDataInDevelopment",
      "retentionPolicyExists",
      "dpoStatus",
      "dpoName",
      "dpoEmail",
      "euRepresentativeStatus",
      "euRepresentativeName",
      "euRepresentativeAddress",
    ],
  }) satisfies SchemaUnion;

const lookupWarning = (message: string) => message.slice(0, 300);

const hostnameFromUrl = (url: string) =>
  new URL(url).hostname.replace(/^www\./, "");

const defaultDataType = (name: string): StoredDataType => ({
  name: "Customer account data",
  description: `Basic account and usage data handled by ${name}.`,
  subjectTypes: null,
  collectionMethods: null,
  isSensitive: null,
  isRequired: true,
});

const defaultActivity = (): BusinessActivityInput => ({
  name: "Provide the primary service",
  purpose: "Operate the product, support users, and manage customer accounts.",
  role: "",
  legalBasis: [],
  dataTypeIds: [],
  retentionPolicy: null,
  retentionDays: 0,
});

const policyTitle = (url: string) => {
  const path = new URL(url).pathname;
  const lastSegment =
    path.split("/").filter(Boolean).at(-1) ?? "Privacy Policy";

  return lastSegment
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const privacyPolicyLink = (
  url: string | null,
): OrganizationLookupPolicyLink[] => {
  if (!url) {
    return [];
  }

  const parsedUrl = z.string().url().safeParse(url);

  return parsedUrl.success
    ? [{ type: "privacy_policy", title: policyTitle(parsedUrl.data), url }]
    : [];
};

const nonEmpty = (value: string | null | undefined) =>
  value && value.trim() ? value.trim() : null;

const uniqueBy = <T>(values: T[], key: (item: T) => string) =>
  Array.from(
    new Map(
      values
        .filter((value) => key(value).trim())
        .map((value) => [key(value).trim().toLocaleLowerCase(), value]),
    ).values(),
  );

const defaultLookupResult = (
  input: OrganizationWebsiteLookupInput,
  warnings: string[] = [],
): OrganizationLookupResult => {
  const fallbackName = hostnameFromUrl(input.website);

  return organizationLookupResultSchema.parse({
    company: {
      ...emptyCompanyProfile,
      companyName: fallbackName,
      legalEntityName: fallbackName,
      website: input.website,
    },
    primaryService: {
      ...emptyServiceProfile,
      serviceName: fallbackName,
      serviceDescription: "",
      serviceUrl: input.website,
    },
    dataTypes: [defaultDataType(fallbackName)],
    activities: [defaultActivity()],
    suggestedProviders: [],
    policyLinks: [],
    privacyPolicyUrl: null,
    warnings,
  });
};

const mapWebsiteLookupResult = (
  input: OrganizationWebsiteLookupInput,
  generated: WebsiteLookupGenerated,
) => {
  const fallbackName = hostnameFromUrl(input.website);
  const serviceName =
    nonEmpty(generated.primaryService.name) ??
    nonEmpty(generated.legalEntityName) ??
    fallbackName;
  const dataCaptured = uniqueBy(
    generated.primaryService.dataCaptured,
    (d) => d.name,
  );
  const activities = uniqueBy(
    generated.primaryService.activities,
    (a) => a.name,
  );
  const policyLinks = privacyPolicyLink(generated.privacyPolicyUrl);
  const serviceDescription = generated.primaryService.description ?? "";

  return organizationLookupResultSchema.parse({
    company: {
      ...emptyCompanyProfile,
      companyName: nonEmpty(generated.legalEntityName) ?? fallbackName,
      legalEntityName: generated.legalEntityName,
      website: input.website,
      contactEmail: generated.contactEmail,
      securityContactEmail: generated.securityEmail,
      privacyContactEmail: generated.privacyEmail,
      country: generated.registeredCountry,
      address: generated.address,
      industries: generated.industries,
      regions: generated.regions,
      handlesPii: generated.handlesPii,
      handlesSensitiveData: generated.handlesSensitiveData,
      storesPii: generated.handlesPersonalData,
      storesHealthcareData: generated.handlesHealthData,
    },
    primaryService: {
      ...emptyServiceProfile,
      serviceName,
      serviceDescription,
      serviceUrl: input.website,
      availabilityRegions: generated.regions,
    },
    dataTypes:
      dataCaptured.length > 0
        ? dataCaptured.map((d) => ({
            name: d.name,
            description: d.description,
            subjectTypes: null,
            collectionMethods: null,
            isSensitive: generated.handlesSensitiveData,
            isRequired: true,
          }))
        : [defaultDataType(serviceName)],
    activities:
      activities.length > 0
        ? activities.map((a) => ({
            name: a.name,
            purpose: a.purpose,
            role: "",
            legalBasis: [],
            dataTypeIds: [],
            retentionPolicy: null,
            retentionDays: 0,
          }))
        : [defaultActivity()],
    suggestedProviders: [],
    policyLinks,
    privacyPolicyUrl: policyLinks[0]?.url ?? null,
    warnings: generated.warnings,
  });
};

export class LlmOrganizationLookupService implements OrganizationLookupService {
  constructor(
    private readonly codeSource: OrganizationLookupCodeSource,
    private readonly promptClient: PromptClient,
    private readonly llmClient: LlmJsonClient,
    private readonly model = apiConfig.organizationLookupModel,
  ) {}

  async lookupWebsite(
    input: OrganizationWebsiteLookupInput,
  ): Promise<OrganizationLookupResult> {
    const codeSets = await this.codeSource.listCodeSets(websiteCodeSetIds);
    const prompt = await this.promptClient.compilePrompt(WEBSITE_PROMPT_NAME, {
      websiteUrl: input.website,
      codeSets: codeSetsText(websiteCodeSetIds, codeSets),
    });
    const generated = await this.llmClient.generateJson({
      model: this.model,
      prompt,
      responseSchema: websiteLookupResponseSchema(codeSets),
      tools: GEMINI_URL_TOOLS,
    });
    const parsed = websiteLookupGeneratedSchema.safeParse(generated);

    if (!parsed.success) {
      throw new ApiError(
        "ORGANIZATION_WEBSITE_LOOKUP_INVALID_RESPONSE",
        "Website lookup returned an invalid profile.",
        502,
        parsed.error.flatten(),
      );
    }

    return mapWebsiteLookupResult(input, parsed.data);
  }

  async lookupPrivacyPolicy(
    input: OrganizationPrivacyPolicyLookupInput,
  ): Promise<PrivacyProfile> {
    const codeSets = await this.codeSource.listCodeSets(privacyCodeSetIds);
    const prompt = await this.promptClient.compilePrompt(PRIVACY_PROMPT_NAME, {
      privacyPolicyUrl: input.privacyPolicyUrl,
      codeSets: codeSetsText(privacyCodeSetIds, codeSets),
    });
    const generated = await this.llmClient.generateJson({
      model: this.model,
      prompt,
      responseSchema: privacyPolicyResponseSchema(codeSets),
      tools: GEMINI_URL_TOOLS,
    });
    const parsed = privacyProfileSchema.safeParse({
      ...emptyPrivacyProfile,
      ...(typeof generated === "object" && generated ? generated : {}),
    });

    if (!parsed.success) {
      throw new ApiError(
        "ORGANIZATION_PRIVACY_POLICY_LOOKUP_INVALID_RESPONSE",
        "Privacy policy lookup returned an invalid profile.",
        502,
        parsed.error.flatten(),
      );
    }

    return parsed.data;
  }
}

export const createDefaultOrganizationLookupService = ({
  promptClient,
  llmClient,
  codeSource,
}: {
  promptClient?: PromptClient;
  llmClient?: LlmJsonClient;
  codeSource?: OrganizationLookupCodeSource;
} = {}) => {
  const missing = [
    codeSource || apiConfig.airtableBase ? null : "AIRTABLE_BASE",
    codeSource || apiConfig.airtableApiKey ? null : "AIRTABLE_API_KEY",
    apiConfig.geminiApiKey || llmClient ? null : "GEMINI_API_KEY",
    promptClient || apiConfig.langfusePublicKey ? null : "LANGFUSE_PUBLIC_KEY",
    promptClient || apiConfig.langfuseSecretKey ? null : "LANGFUSE_SECRET_KEY",
  ].filter((name): name is string => Boolean(name));

  if (missing.length > 0) {
    return {
      async lookupWebsite(input: OrganizationWebsiteLookupInput) {
        return defaultLookupResult(input, [
          lookupWarning(
            `Website lookup is not configured. Missing ${missing.join(", ")}.`,
          ),
        ]);
      },
      async lookupPrivacyPolicy() {
        return privacyProfileSchema.parse(emptyPrivacyProfile);
      },
    } satisfies OrganizationLookupService;
  }

  return new LlmOrganizationLookupService(
    codeSource ??
      new AirtableOrganizationLookupCodeSource(
        apiConfig.airtableBase ?? "",
        apiConfig.airtableApiKey ?? "",
      ),
    promptClient ??
      LangfusePromptClient.fromConfig({
        publicKey: apiConfig.langfusePublicKey,
        secretKey: apiConfig.langfuseSecretKey,
        baseUrl: apiConfig.langfuseBaseUrl,
      }),
    llmClient ?? new GeminiJsonClient(apiConfig.geminiApiKey ?? ""),
  );
};
