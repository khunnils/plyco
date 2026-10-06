import { z } from "zod";

import { ApiError } from "./errors.js";

export type ScrapedWebsitePage = {
  url: string;
  markdown: string;
  links: string[];
};

export interface WebsiteScraper {
  scrape(url: string, includeLinks?: boolean): Promise<ScrapedWebsitePage>;
}

const scrapeResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    markdown: z.string().trim().min(1),
    links: z.array(z.string()).default([]),
    metadata: z.object({
      url: z.string().url().optional(),
      statusCode: z.number().optional(),
      error: z.string().optional(),
    }).optional(),
  }),
});

export class FirecrawlWebsiteScraper implements WebsiteScraper {
  constructor(private readonly apiKey: string) {}

  async scrape(url: string, includeLinks = false): Promise<ScrapedWebsitePage> {
    let response: Response;
    let payload: unknown;

    try {
      response = await fetch("https://api.firecrawl.dev/v2/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          formats: includeLinks ? ["markdown", "links"] : ["markdown"],
          // Policy links and contact details often live in the footer.
          onlyMainContent: false,
          timeout: 60000,
        }),
        signal: AbortSignal.timeout(65000),
      });

      if (!response.ok) {
        throw new ApiError(
          "ORGANIZATION_WEBSITE_SCRAPE_FAILED",
          "Unable to scrape website content.",
          502,
          { upstreamStatus: response.status },
        );
      }

      payload = await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;

      throw new ApiError(
        "ORGANIZATION_WEBSITE_SCRAPE_FAILED",
        "Unable to scrape website content.",
        502,
      );
    }

    const parsed = scrapeResponseSchema.safeParse(payload);
    if (
      !parsed.success ||
      parsed.data.data.metadata?.error ||
      (parsed.data.data.metadata?.statusCode ?? 200) >= 400
    ) {
      throw new ApiError(
        "ORGANIZATION_WEBSITE_SCRAPE_INVALID_RESPONSE",
        "Website scrape returned no usable content.",
        502,
      );
    }

    return {
      url: parsed.data.data.metadata?.url ?? url,
      markdown: parsed.data.data.markdown,
      links: parsed.data.data.links,
    };
  }
}
