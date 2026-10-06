import { afterEach, describe, expect, it, vi } from "vitest";

import { apiConfig, readOrganizationLookupStrategy } from "../src/config.js";
import {
  createDefaultOrganizationLookupService,
  FirecrawlOrganizationLookupService,
  LlmOrganizationLookupService,
  StaticOrganizationLookupCodeSource,
} from "../src/features/organization-lookup/service.js";
import { extractWebsiteLinks } from "../src/features/organization-lookup/links.js";
import { ApiError } from "../src/infrastructure/errors.js";
import { FirecrawlWebsiteScraper, type WebsiteScraper } from "../src/infrastructure/firecrawl-client.js";
import { type LlmJsonClient } from "../src/infrastructure/llm-client.js";
import { type PromptClient } from "../src/infrastructure/prompt-client.js";

const codeSource = new StaticOrganizationLookupCodeSource({ industries: ["technology_saas"], regions: ["us", "eu", "global"] });
const website = "https://acme.example/";
const privacy = `${website}privacy`;
const security = "https://trust.acme.example/security";

const setup = (responses: unknown[], scrape: WebsiteScraper["scrape"] = async (url) => ({
  url,
  markdown: url === website ? `[Privacy](/privacy)\n[Security](${security})` : `Content from ${url}`,
  links: [],
})) => {
  const compilePrompt = vi.fn<PromptClient["compilePrompt"]>(async (name, variables) => ({
    content: `${name} prompt`,
    inputVariables: variables,
    metadata: { name, version: 1, isFallback: false },
  }));
  const generateJson = vi.fn<LlmJsonClient["generateJson"]>(async () => responses.shift());
  const scraper = { scrape: vi.fn(scrape) };
  const promptClient = { compilePrompt };
  const llmClient = { generateJson };
  const service = new FirecrawlOrganizationLookupService(codeSource, promptClient, llmClient, scraper, "test-model");
  return { service, scraper, promptClient, llmClient };
};

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("Firecrawl organization lookup", () => {
  it("extracts and normalizes links from markdown and the links format", () => {
    const links = extractWebsiteLinks(`
[Privacy](/privacy#rights)
[Security](//trust.acme.example/security)
[Terms][terms]
[terms]: /terms "Terms"
<https://acme.example/cookies>
[DPA](/legal/dpa(v2))
[Email](mailto:privacy@acme.example)
[Anchor](#privacy)
![Image](/logo.png)
`, [privacy, "/privacy", "javascript:alert(1)", "https://user:pass@acme.example/private"], website);
    expect(links).toEqual([privacy, security, `${website}legal/dpa(v2)`, `${website}terms`, `${website}cookies`]);
  });

  it("scrapes selected pages and merges evidence before mapping defaults", async () => {
    const landing = {
      legalEntityName: "Acme",
      handlesSensitiveData: true,
      handlesPersonalData: true,
      industries: ["technology_saas"],
      regions: ["us"],
      contactEmail: "hello@acme.example",
      primaryService: {
        name: "Acme Platform",
        description: "Customer collaboration software.",
        activities: [{ name: "Account management", purpose: "" }],
        dataCaptured: [{ name: "Account data", description: null }],
      },
    };
    const policy = {
      legalEntityName: "Acme, Inc.",
      registeredCountry: "US",
      regions: ["eu"],
      contactEmail: null,
      privacyEmail: "privacy@acme.example",
      privacyPolicyUrl: privacy,
      handlesSensitiveData: false,
      primaryService: {
        name: "Website",
        description: null,
        activities: [{ name: "account management", purpose: "Operate customer accounts." }],
        dataCaptured: [{ name: "Account data", description: "Identity and account details." }, { name: "Contact data" }],
      },
    };
    const { service, scraper, promptClient, llmClient } = setup([
      [privacy, "/privacy#rights", security, website, "https://invented.example/privacy", "mailto:test@acme.example"],
      landing, policy, { securityEmail: "security@acme.example", handlesPersonalData: false },
    ]);
    const result = await service.lookupWebsite({ website });

    expect(scraper.scrape.mock.calls).toEqual([[website, true], [privacy], [security]]);
    expect(promptClient.compilePrompt.mock.calls.map(([name]) => name)).toEqual(["link_extractor", "website_parser", "website_parser", "website_parser"]);
    expect(promptClient.compilePrompt.mock.calls[0]).toEqual(["link_extractor", { primaryDomain: "acme.example", links: `${privacy}\n${security}` }]);
    expect(promptClient.compilePrompt.mock.calls[2]?.[1]).toMatchObject({ websiteUrl: privacy, text: `Content from ${privacy}` });
    expect(llmClient.generateJson.mock.calls.every(([request]) => request.tools === undefined)).toBe(true);
    expect(llmClient.generateJson.mock.calls[2]?.[0].prompt.content).toContain(`Content from ${privacy}`);
    expect(result.company).toMatchObject({
      legalEntityName: "Acme, Inc.", country: "US", contactEmail: "hello@acme.example",
      privacyContactEmail: "privacy@acme.example", securityContactEmail: "security@acme.example",
      handlesSensitiveData: true, handlesPersonalData: true, regions: ["us", "eu"],
    });
    expect(result.primaryService).toMatchObject({ serviceName: "Acme Platform", serviceDescription: "Customer collaboration software." });
    expect(result.activities).toHaveLength(1);
    expect(result.activities[0]).toMatchObject({ name: "Account management", purpose: "Operate customer accounts." });
    expect(result.dataTypes).toHaveLength(2);
    expect(result.dataTypes[0]?.description).toBe("Identity and account details.");
    expect(result.privacyPolicyUrl).toBe(privacy);
  });

  it("uses landing-page results when no relevant links are selected", async () => {
    const { service, scraper, llmClient } = setup([[], { legalEntityName: "Acme" }]);
    expect((await service.lookupWebsite({ website })).company.legalEntityName).toBe("Acme");
    expect(scraper.scrape).toHaveBeenCalledTimes(1);
    expect(llmClient.generateJson).toHaveBeenCalledTimes(2);
  });

  it("keeps successful results and reports secondary scrape and parse failures", async () => {
    const { service, llmClient } = setup([[privacy, security], { legalEntityName: "Acme" }, { registeredCountry: "invalid" }], async (url) => {
      if (url === privacy) throw new ApiError("ORGANIZATION_WEBSITE_SCRAPE_FAILED", "Unavailable", 502);
      return { url, markdown: url === website ? `[Privacy](${privacy})\n[Security](${security})` : "Security text", links: [] };
    });
    const result = await service.lookupWebsite({ website });
    expect(result.company.legalEntityName).toBe("Acme");
    expect(result.warnings).toEqual([`Unable to scrape a related page: ${privacy}`, `Unable to parse a related page: ${security}`]);
    expect(llmClient.generateJson).toHaveBeenCalledTimes(3);
  });

  it("keeps landing-page results when link extraction is invalid", async () => {
    const { service } = setup([{ links: [privacy] }, { legalEntityName: "Acme" }]);
    const result = await service.lookupWebsite({ website });
    expect(result.company.legalEntityName).toBe("Acme");
    expect(result.warnings).toEqual(["Unable to select privacy and security pages. Results use the landing page only."]);
  });

  it("fails when the landing page cannot be scraped or parsed", async () => {
    const { service } = setup([], async () => { throw new ApiError("ORGANIZATION_WEBSITE_SCRAPE_FAILED", "Unavailable", 502); });
    await expect(service.lookupWebsite({ website })).rejects.toMatchObject({ code: "ORGANIZATION_WEBSITE_SCRAPE_FAILED" });
    await expect(setup([[], { registeredCountry: "invalid" }]).service.lookupWebsite({ website })).rejects.toMatchObject({ code: "ORGANIZATION_WEBSITE_LOOKUP_INVALID_RESPONSE" });
  });

  it("supplies scraped privacy-policy text without browsing tools", async () => {
    const { service, promptClient, llmClient } = setup([{ responseTimelineDays: 30 }]);
    const result = await service.lookupPrivacyPolicy({ privacyPolicyUrl: privacy });
    expect(promptClient.compilePrompt.mock.calls[0]).toEqual(["privacy_policy_parser", expect.objectContaining({ privacyPolicyUrl: privacy, text: `Content from ${privacy}` })]);
    expect(llmClient.generateJson.mock.calls[0]?.[0].tools).toBeUndefined();
    expect(result.responseTimelineDays).toBe(30);
  });

  it("does not swallow unexpected secondary errors", async () => {
    const { service } = setup([[privacy]], async (url) => {
      if (url === privacy) throw new Error("Unexpected failure");
      return { url, markdown: `[Privacy](${privacy})`, links: [] };
    });
    await expect(service.lookupWebsite({ website })).rejects.toThrow("Unexpected failure");
  });

  it("selects strategies through configuration and requires a key only for Firecrawl", async () => {
    expect(readOrganizationLookupStrategy({})).toBe("firecrawl");
    expect(readOrganizationLookupStrategy({ ORGANIZATION_LOOKUP_STRATEGY: "agent" })).toBe("agent");
    expect(() => readOrganizationLookupStrategy({ ORGANIZATION_LOOKUP_STRATEGY: "unknown" })).toThrow("ORGANIZATION_LOOKUP_STRATEGY");
    const { promptClient, llmClient, scraper } = setup([]);
    const deps = { codeSource, promptClient, llmClient };
    expect(createDefaultOrganizationLookupService({ ...deps, scraper, strategy: "firecrawl" })).toBeInstanceOf(FirecrawlOrganizationLookupService);
    const previousKey = apiConfig.firecrawlApiKey;
    const previousStrategy = apiConfig.organizationLookupStrategy;
    apiConfig.firecrawlApiKey = undefined;
    apiConfig.organizationLookupStrategy = "firecrawl";
    try {
      expect(createDefaultOrganizationLookupService({ ...deps, scraper })).toBeInstanceOf(FirecrawlOrganizationLookupService);
      expect(createDefaultOrganizationLookupService({ ...deps, strategy: "agent" })).toBeInstanceOf(LlmOrganizationLookupService);
      const fallback = await createDefaultOrganizationLookupService({ ...deps, strategy: "firecrawl" }).lookupWebsite({ website });
      expect(fallback.warnings[0]).toContain("Missing FIRECRAWL_API_KEY");
    } finally {
      apiConfig.firecrawlApiKey = previousKey;
      apiConfig.organizationLookupStrategy = previousStrategy;
    }
  });
});

describe("Firecrawl scraper adapter", () => {
  it("requests markdown and links for landing pages, including footer content", async () => {
    const fetchMock = vi.fn(async () => Response.json({ success: true, data: { markdown: "Page text", links: [privacy], metadata: { url: website, statusCode: 200 } } }));
    vi.stubGlobal("fetch", fetchMock);
    const scraper = new FirecrawlWebsiteScraper("test-key");
    expect(await scraper.scrape(website, true)).toEqual({ url: website, markdown: "Page text", links: [privacy] });
    await scraper.scrape(privacy);
    const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
    expect(calls[0]?.[0]).toBe("https://api.firecrawl.dev/v2/scrape");
    expect(JSON.parse(calls[0]?.[1].body as string)).toMatchObject({ url: website, formats: ["markdown", "links"], onlyMainContent: false });
    expect(JSON.parse(calls[1]?.[1].body as string).formats).toEqual(["markdown"]);
  });

  it.each([
    { success: false, error: "Internal details" },
    { success: true, data: { markdown: " " } },
    { success: true, data: { markdown: "Error page", metadata: { statusCode: 404 } } },
    { success: true, data: { markdown: "Error page", metadata: { error: "Internal details" } } },
  ])("rejects unsuccessful or unusable scrape payloads", async (payload) => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json(payload)));
    await expect(new FirecrawlWebsiteScraper("test-key").scrape(website)).rejects.toMatchObject({ code: "ORGANIZATION_WEBSITE_SCRAPE_INVALID_RESPONSE", statusCode: 502 });
  });

  it("sanitizes HTTP, network, timeout, and invalid JSON failures", async () => {
    const scraper = new FirecrawlWebsiteScraper("test-key");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("secret upstream details", { status: 401 })));
    await expect(scraper.scrape(website)).rejects.toMatchObject({ code: "ORGANIZATION_WEBSITE_SCRAPE_FAILED", details: { upstreamStatus: 401 } });
    for (const error of [new Error("secret request details"), new DOMException("timeout", "TimeoutError")]) {
      vi.stubGlobal("fetch", vi.fn(async () => { throw error; }));
      await expect(scraper.scrape(website)).rejects.toMatchObject({ message: "Unable to scrape website content.", details: undefined });
    }
    vi.stubGlobal("fetch", vi.fn(async () => new Response("not json")));
    await expect(scraper.scrape(website)).rejects.toMatchObject({ code: "ORGANIZATION_WEBSITE_SCRAPE_FAILED" });
  });
});
