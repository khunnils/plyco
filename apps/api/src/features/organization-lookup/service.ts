import Firecrawl, { type Document } from "@mendable/firecrawl-js"
import {
  emptyAccessProfile,
  emptyCompanyProfile,
  emptyDataHandlingProfile,
  emptyInfrastructureProfile,
  emptyPrivacyProfile,
  emptyServiceProfile,
  organizationLookupResultSchema,
  type BusinessActivityInput,
  type OrganizationLookupInput,
  type OrganizationLookupPolicyLink,
  type OrganizationLookupResult,
  type StoredDataType,
} from "@plyco/shared"

import { apiConfig } from "../../config.js"
import { ApiError } from "../../infrastructure/errors.js"
import {
  GeminiJsonClient,
  type OrganizationLookupCodeSetId,
  type OrganizationLookupResponseSchemaOptions,
  organizationLookupResponseSchema,
  type LlmJsonClient,
} from "../../infrastructure/llm-client.js"
import {
  LangfusePromptClient,
  type PromptClient,
} from "../../infrastructure/prompt-client.js"
import { defaultVocabularyCodeSets } from "../vocabulary/reference-data.js"

export interface OrganizationLookupService {
  lookup(input: OrganizationLookupInput): Promise<OrganizationLookupResult>
}

type CrawledPage = {
  url: string
  title: string
  markdown: string
}

type CrawledWebsite = {
  pages: CrawledPage[]
  policyLinks: OrganizationLookupPolicyLink[]
}

type WebsiteCrawler = {
  crawl(input: OrganizationLookupInput): Promise<CrawledWebsite>
}

const PROMPT_NAME = "website_parser"
const organizationLookupCodeSetIds = [
  "industries",
  "regions",
  "compliance_goals",
  "service_user_types",
  "service_customer_types",
  "cookie_tracking_categories",
  "privacy_cookie_consent_mechanisms",
  "subject_types",
  "collection_methods",
  "activity_role",
  "legal_basis",
  "activity_retention_policies",
] as const satisfies readonly OrganizationLookupCodeSetId[]

const organizationLookupCodeSets = Object.fromEntries(
  organizationLookupCodeSetIds.map((codeSetId) => {
    const codeSet = defaultVocabularyCodeSets.find(
      (candidate) => candidate.codeSetId === codeSetId,
    )

    return [
      codeSetId,
      codeSet?.codes
        .filter((code) => code.active)
        .map((code) => ({ codeId: code.codeId, label: code.name })) ?? [],
    ]
  }),
) as Record<
  OrganizationLookupCodeSetId,
  Array<{ codeId: string; label: string }>
>

const organizationLookupResponseCodeSets =
  Object.fromEntries(
    organizationLookupCodeSetIds.map((codeSetId) => [
      codeSetId,
      organizationLookupCodeSets[codeSetId].map((code) => code.codeId),
    ]),
  ) as OrganizationLookupResponseSchemaOptions

const lookupWarning = (message: string) => message.slice(0, 300)

const defaultDataType = (name: string): StoredDataType => ({
  name: "Customer account data",
  description: `Basic account and usage data handled by ${name}.`,
  subjectTypes: null,
  collectionMethods: null,
  isSensitive: null,
  isRequired: true,
})

const defaultActivity = (): BusinessActivityInput => ({
  name: "Provide the primary service",
  purpose: "Operate the product, support users, and manage customer accounts.",
  role: "",
  legalBasis: [],
  retentionPolicy: null,
  retentionDays: 0,
})

const defaultLookupResult = (
  input: OrganizationLookupInput,
  warnings: string[] = [],
): OrganizationLookupResult =>
  organizationLookupResultSchema.parse({
    company: {
      ...emptyCompanyProfile,
      companyName: input.name,
      legalEntityName: input.name,
      website: input.website,
    },
    primaryService: {
      ...emptyServiceProfile,
      serviceName: input.name,
      serviceDescription: "",
      serviceUrl: input.website,
    },
    primaryDataType: defaultDataType(input.name),
    primaryActivity: defaultActivity(),
    suggestedProviders: [],
    policyLinks: [],
    warnings,
  })

const truncate = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength)}\n[truncated]` : value

const pageTitle = (document: Document, fallbackUrl: string) => {
  const title = document.metadata?.title

  return typeof title === "string" && title.trim() ? title.trim() : fallbackUrl
}

const pageUrl = (document: Document, fallbackUrl: string) => {
  const sourceUrl = document.metadata?.sourceURL
  const url = document.metadata?.url

  return typeof sourceUrl === "string" && sourceUrl.trim()
    ? sourceUrl
    : typeof url === "string" && url.trim()
      ? url
      : fallbackUrl
}

const policyType = (
  url: string,
  title = "",
): OrganizationLookupPolicyLink["type"] => {
  const haystack = `${url} ${title}`.toLowerCase()

  if (haystack.includes("subprocessor") || haystack.includes("sub-processor")) {
    return "subprocessors"
  }

  if (
    haystack.includes("security") ||
    haystack.includes("trust") ||
    haystack.includes("soc")
  ) {
    return "data_security"
  }

  if (haystack.includes("terms")) {
    return "terms"
  }

  if (haystack.includes("privacy")) {
    return "privacy_policy"
  }

  return "other"
}

const isRelevantPolicyUrl = (url: string) => {
  const lower = url.toLowerCase()

  return [
    "privacy",
    "security",
    "trust",
    "subprocessor",
    "sub-processor",
    "dpa",
    "terms",
  ].some((token) => lower.includes(token))
}

const policyTitle = (url: string) => {
  const path = new URL(url).pathname
  const lastSegment = path.split("/").filter(Boolean).at(-1) ?? "Policy"
  return lastSegment
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

const asUniquePolicyLinks = (urls: string[]): OrganizationLookupPolicyLink[] => {
  const seen = new Set<string>()

  return urls
    .filter((url) => {
      if (!isRelevantPolicyUrl(url) || seen.has(url)) {
        return false
      }

      seen.add(url)
      return true
    })
    .slice(0, 8)
    .map((url) => ({
      type: policyType(url),
      title: policyTitle(url),
      url,
    }))
}

const stringLinks = (links: unknown[]) =>
  links.flatMap((link) =>
    typeof link === "string"
      ? [link]
      : typeof link === "object" &&
          link &&
          "url" in link &&
          typeof link.url === "string"
        ? [link.url]
        : [],
  )

export class FirecrawlWebsiteCrawler {
  constructor(private readonly client: Firecrawl) {}

  async crawl(input: OrganizationLookupInput): Promise<CrawledWebsite> {
    const root = await this.client.scrape(input.website, {
      formats: ["markdown", "links"],
      onlyMainContent: true,
      timeout: 30000,
    })
    const mapped = await this.client.map(input.website, {
      limit: 20,
      timeout: 30000,
    })
    const mappedLinks = stringLinks(Array.isArray(mapped.links) ? mapped.links : [])
    const rootLinks = stringLinks(Array.isArray(root.links) ? root.links : [])
    const policyLinks = asUniquePolicyLinks([...rootLinks, ...mappedLinks])
    const crawl = await this.client.crawl(input.website, {
      limit: 6,
      maxDiscoveryDepth: 1,
      scrapeOptions: {
        formats: ["markdown"],
        onlyMainContent: true,
        timeout: 30000,
      },
      timeout: 60,
    })

    if (crawl.status === "failed" || crawl.status === "cancelled") {
      throw new ApiError(
        "ORGANIZATION_LOOKUP_CRAWL_FAILED",
        "Website lookup crawl failed.",
        502,
        { status: crawl.status },
      )
    }

    const crawlPages = (crawl.data ?? []).flatMap((document) =>
      document.markdown
        ? [
            {
              url: pageUrl(document, input.website),
              title: pageTitle(document, input.website),
              markdown: document.markdown,
            },
          ]
        : [],
    )
    const rootPage = root.markdown
      ? [
          {
            url: pageUrl(root, input.website),
            title: pageTitle(root, input.website),
            markdown: root.markdown,
          },
        ]
      : []

    return {
      pages: [...rootPage, ...crawlPages].slice(0, 8),
      policyLinks,
    }
  }
}

export class LlmOrganizationLookupService implements OrganizationLookupService {
  constructor(
    private readonly crawler: WebsiteCrawler,
    private readonly promptClient: PromptClient,
    private readonly llmClient: LlmJsonClient,
    private readonly model = apiConfig.organizationLookupModel,
  ) {}

  async lookup(input: OrganizationLookupInput): Promise<OrganizationLookupResult> {
    let crawled: CrawledWebsite

    try {
      crawled = await this.crawler.crawl(input)
    } catch (error) {
      throw new ApiError(
        "ORGANIZATION_LOOKUP_CRAWL_FAILED",
        "Could not read the organization website.",
        502,
        upstreamDetails(error),
      )
    }

    const generated = await this.runAgent(input, crawled)

    return organizationLookupResultSchema.parse({
      ...generated,
      company: {
        ...emptyCompanyProfile,
        ...generated.company,
        companyName: generated.company.companyName || input.name,
        legalEntityName: generated.company.legalEntityName || input.name,
        website: generated.company.website || input.website,
      },
      primaryService: {
        ...emptyServiceProfile,
        ...generated.primaryService,
        serviceName: generated.primaryService.serviceName || input.name,
        serviceUrl: generated.primaryService.serviceUrl || input.website,
      },
      primaryDataType: generated.primaryDataType.name
        ? generated.primaryDataType
        : defaultDataType(input.name),
      primaryActivity: generated.primaryActivity.name
        ? generated.primaryActivity
        : defaultActivity(),
      policyLinks: mergePolicyLinks(
        crawled.policyLinks,
        generated.policyLinks ?? [],
      ),
      warnings: generated.warnings ?? [],
    })
  }

  private async runAgent(
    input: OrganizationLookupInput,
    crawled: CrawledWebsite,
  ): Promise<OrganizationLookupResult> {
    const prompt = await this.promptClient.compilePrompt(PROMPT_NAME, {
      input: organizationLookupPromptInput(input, crawled),
    })
    const generated = await this.llmClient.generateJson({
      model: this.model,
      prompt,
      responseSchema: organizationLookupResponseSchema(
        organizationLookupResponseCodeSets,
      ),
    })
    const parsed = organizationLookupResultSchema.safeParse(
      normalizeLookupGeneratedOutput(generated),
    )

    if (!parsed.success) {
      throw new ApiError(
        "ORGANIZATION_LOOKUP_INVALID_RESPONSE",
        "Organization lookup returned an invalid profile.",
        502,
        parsed.error.flatten(),
      )
    }

    return parsed.data
  }
}

export const createDefaultOrganizationLookupService = ({
  promptClient,
  llmClient,
}: {
  promptClient?: PromptClient
  llmClient?: LlmJsonClient
} = {}) => {
  const missing = [
    apiConfig.firecrawlApiKey ? null : "FIRECRAWL_API_KEY",
    apiConfig.geminiApiKey || llmClient ? null : "GEMINI_API_KEY",
    promptClient || apiConfig.langfusePublicKey ? null : "LANGFUSE_PUBLIC_KEY",
    promptClient || apiConfig.langfuseSecretKey ? null : "LANGFUSE_SECRET_KEY",
  ].filter((name): name is string => Boolean(name))

  if (missing.length > 0) {
    return {
      async lookup(input: OrganizationLookupInput) {
        return defaultLookupResult(input, [
          lookupWarning(
            `Website lookup is not configured. Missing ${missing.join(", ")}.`,
          ),
        ])
      },
    } satisfies OrganizationLookupService
  }

  return new LlmOrganizationLookupService(
    new FirecrawlWebsiteCrawler(
      new Firecrawl({ apiKey: apiConfig.firecrawlApiKey }),
    ),
    promptClient ??
      LangfusePromptClient.fromConfig({
        publicKey: apiConfig.langfusePublicKey,
        secretKey: apiConfig.langfuseSecretKey,
        baseUrl: apiConfig.langfuseBaseUrl,
      }),
    llmClient ?? new GeminiJsonClient(apiConfig.geminiApiKey ?? ""),
  )
}

const mergePolicyLinks = (
  first: OrganizationLookupPolicyLink[],
  second: OrganizationLookupPolicyLink[],
) => {
  const byUrl = new Map<string, OrganizationLookupPolicyLink>()

  for (const link of [...first, ...second]) {
    byUrl.set(link.url, link)
  }

  return Array.from(byUrl.values()).slice(0, 12)
}

const upstreamDetails = (error: unknown) =>
  error instanceof Error
    ? { cause: error.name, message: error.message.slice(0, 500) }
    : undefined

const normalizeLookupGeneratedOutput = (generated: unknown) => {
  if (
    typeof generated !== "object" ||
    !generated ||
    !("primaryActivity" in generated) ||
    typeof generated.primaryActivity !== "object" ||
    !generated.primaryActivity
  ) {
    return generated
  }

  const primaryActivity = generated.primaryActivity as Record<string, unknown>

  return {
    ...generated,
    primaryActivity: {
      ...primaryActivity,
      role: primaryActivity.role ?? "",
    },
  }
}

const organizationLookupInstruction = (
  input: OrganizationLookupInput,
  crawled: CrawledWebsite,
) => `You map public website content into Plyco's onboarding schema.

Return only valid JSON matching the output schema. Do not wrap it in Markdown.
Use these rules:
- Default legalEntityName to "${input.name}" unless a legal entity is explicit.
- Use ISO alpha-2 country codes only. Use null if uncertain.
- Use region code IDs such as "us", "eu", "uk", "apac", or null for primaryHostingRegion.
- Use only code IDs from input.codeSets for all code-backed fields. Never return code labels such as "GDPR" or "Controller".
- Do not invent policy links, providers, addresses, emails, or sensitive data.
- Keep one primary service, one primary data type, and one primary activity.
- suggestedProviders should only include named third-party providers evident in the crawl or policy pages.

Discovered policy links:
${JSON.stringify(crawled.policyLinks)}`;

const organizationLookupPromptInput = (
  input: OrganizationLookupInput,
  crawled: CrawledWebsite,
) => ({
  organizationName: input.name,
  website: input.website,
  pages: crawled.pages.map((page) => ({
    url: page.url,
    title: page.title,
    markdown: truncate(page.markdown, 7000),
  })),
  emptyProfiles: {
    access: emptyAccessProfile,
    dataHandling: emptyDataHandlingProfile,
    infrastructure: emptyInfrastructureProfile,
    privacy: emptyPrivacyProfile,
  },
  codeSets: organizationLookupCodeSets,
  instructions: organizationLookupInstruction(input, crawled),
})
