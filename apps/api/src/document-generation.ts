import { createHash } from "node:crypto"

import nunjucks from "nunjucks"
import {
  type SecurityProgramSnapshot,
  type Template,
  type Vendor,
} from "@complyflow/shared"

export type NormalizedTemplateContext = {
  company: Record<string, unknown>
  infrastructure: Record<string, unknown>
  dataHandling: Record<string, unknown>
  access: Record<string, unknown>
  vendors: Array<Record<string, unknown>>
}

export class ReportContextBuilder {
  build(snapshot: SecurityProgramSnapshot): NormalizedTemplateContext {
    const organization = snapshot.organization

    return {
      company: organization
        ? {
            ...organization.company,
            name: organization.company.companyName,
          }
        : {},
      infrastructure: organization?.infrastructure ?? {},
      dataHandling: organization?.dataHandling ?? {},
      access: organization?.access ?? {},
      vendors: snapshot.vendors.map((vendor) => this.vendorContext(vendor)),
    }
  }

  private vendorContext(vendor: Vendor) {
    return {
      name: vendor.name,
      category: vendor.category,
      purpose: vendor.purpose,
      hasSubprocessors: vendor.hasSubprocessors,
      dataProcessingLevel: vendor.dataProcessingLevel,
      dataProcessed: vendor.dataProcessed,
      dpaStatus: vendor.dpaStatus,
      dataRegions: vendor.dataRegions,
      criticality: vendor.criticality,
      owner: vendor.owner,
      notes: vendor.notes,
    }
  }
}

export class Jinja2Renderer {
  render(template: Template, context: NormalizedTemplateContext): string {
    return nunjucks.renderString(template.content, context)
  }
}

export function templateSourceHash(
  template: Pick<Template, "content">,
  context: NormalizedTemplateContext,
) {
  return createHash("sha256")
    .update(stableStringify({ content: template.content, context }))
    .digest("hex")
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`
  }

  return JSON.stringify(value)
}
