import { marked } from "marked"
import sanitizeHtml from "sanitize-html"

const allowedTags = [
  "h1",
  "h2",
  "h3",
  "h4",
  "p",
  "ul",
  "ol",
  "li",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "a",
  "em",
  "strong",
  "b",
  "i",
  "blockquote",
  "br",
  "hr",
  "code",
  "pre",
]

export function renderDocumentHtml(markdown: string) {
  const raw = marked.parse(markdown, { async: false, gfm: true })
  const html = typeof raw === "string" ? raw : ""

  return sanitizeHtml(html, {
    allowedTags,
    allowedAttributes: {
      a: ["href", "title"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  })
}

export function renderPublicDocumentPage(input: {
  title: string
  organizationName: string
  generatedAt: string
  bodyHtml: string
}) {
  const title = escapeHtml(input.title)
  const organizationName = escapeHtml(input.organizationName)
  const lastUpdated = escapeHtml(formatLastUpdated(input.generatedAt))

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — ${organizationName}</title>
  <style>
    :root { color-scheme: light; }
    body {
      margin: 0;
      background: #fff;
      color: #0f172a;
      font-family: Georgia, "Times New Roman", serif;
    }
    main {
      max-width: 42rem;
      margin: 0 auto;
      padding: 3rem 1.5rem 4rem;
    }
    header {
      margin-bottom: 2.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .org {
      margin: 0;
      color: #64748b;
      font-family: system-ui, sans-serif;
      font-size: 0.8rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    h1 {
      margin: 0.4rem 0 0.6rem;
      font-size: 2rem;
      line-height: 1.2;
    }
    .updated {
      margin: 0;
      color: #64748b;
      font-family: system-ui, sans-serif;
      font-size: 0.875rem;
    }
    .content { font-size: 1.05rem; line-height: 1.7; }
    .content h1, .content h2, .content h3, .content h4 {
      font-family: system-ui, sans-serif;
      line-height: 1.3;
    }
    .content table { border-collapse: collapse; width: 100%; }
    .content th, .content td {
      border: 1px solid #cbd5e1;
      padding: 0.4rem 0.6rem;
    }
    .content a { color: #0f172a; }
  </style>
</head>
<body>
  <main>
    <header>
      <p class="org">${organizationName}</p>
      <h1>${title}</h1>
      <p class="updated">Last updated ${lastUpdated}</p>
    </header>
    <div class="content">${input.bodyHtml}</div>
  </main>
</body>
</html>`
}

export function buildPublicDocumentUrl(
  baseUrl: string,
  orgSlug: string,
  templateSlug: string,
) {
  return `${baseUrl.replace(/\/$/, "")}/public/${orgSlug}/${templateSlug}`
}

function formatLastUpdated(generatedAt: string) {
  const date = new Date(generatedAt)

  if (Number.isNaN(date.getTime())) {
    return generatedAt
  }

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  })
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}
