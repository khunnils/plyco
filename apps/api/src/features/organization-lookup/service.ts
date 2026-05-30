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

export class AdkOrganizationLookupService implements OrganizationLookupService {
  constructor(
    private readonly crawler: FirecrawlWebsiteCrawler,
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
    if (apiConfig.geminiApiKey && !process.env.GOOGLE_API_KEY) {
      process.env.GOOGLE_API_KEY = apiConfig.geminiApiKey
    }

    try {
      const { InMemoryRunner, LlmAgent, isFinalResponse, stringifyContent } =
        await import("@google/adk")
      const privacyPolicyAgent = new LlmAgent({
        name: "policy_profile_extractor",
        model: this.model,
        description:
          "Extracts privacy, security, and subprocessor facts from policy pages.",
        instruction:
          "Review policy-page text and return concise facts relevant to company profile, data types, activities, providers, and policy links.",
        outputSchema: organizationLookupResultSchema,
      })
      const websiteProfileAgent = new LlmAgent({
        name: "website_profile_mapper",
        model: this.model,
        description:
          "Maps website and product pages into the Plyco organization schema.",
        instruction:
          "Map public website content to the supplied JSON schema. Prefer null or empty values over guessing.",
        outputSchema: organizationLookupResultSchema,
      })
      const rootAgent = new LlmAgent({
        name: "organization_lookup_coordinator",
        model: this.model,
        description:
          "Coordinates website and policy extraction for Plyco organization onboarding.",
        instruction: organizationLookupInstruction(input, crawled),
        outputSchema: organizationLookupResultSchema,
        subAgents: [websiteProfileAgent, privacyPolicyAgent],
      })
      const runner = new InMemoryRunner({
        agent: rootAgent,
        appName: "plyco-organization-lookup",
      })
      let finalText = ""

      for await (const event of runner.runEphemeral({
        userId: "organization-lookup",
        newMessage: {
          role: "user",
          parts: [{ text: organizationLookupPrompt(input, crawled) }],
        },
      })) {
        if (isFinalResponse(event)) {
          finalText = stringifyContent(event)
        }
      }

      const parsed = organizationLookupResultSchema.safeParse(
        JSON.parse(extractJson(finalText)),
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
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      throw new ApiError(
        "ORGANIZATION_LOOKUP_AGENT_FAILED",
        "Organization lookup agent failed.",
        502,
        upstreamDetails(error),
      )
    }
  }
}

export const createDefaultOrganizationLookupService = () => {
  const missing = [
    apiConfig.firecrawlApiKey ? null : "FIRECRAWL_API_KEY",
    apiConfig.geminiApiKey ? null : "GEMINI_API_KEY",
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

  return new AdkOrganizationLookupService(
    new FirecrawlWebsiteCrawler(
      new Firecrawl({ apiKey: apiConfig.firecrawlApiKey }),
    ),
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

const extractJson = (text: string) => {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/)

  if (fenced?.[1]) {
    return fenced[1]
  }

  const firstBrace = trimmed.indexOf("{")
  const lastBrace = trimmed.lastIndexOf("}")

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1)
  }

  return trimmed
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
- Do not invent policy links, providers, addresses, emails, or sensitive data.
- Keep one primary service, one primary data type, and one primary activity.
- suggestedProviders should only include named third-party providers evident in the crawl or policy pages.

Discovered policy links:
${JSON.stringify(crawled.policyLinks)}`;

const organizationLookupPrompt = (
  input: OrganizationLookupInput,
  crawled: CrawledWebsite,
) =>
  JSON.stringify({
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
  })
