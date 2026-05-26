import { describe, expect, it } from "vitest"

import {
  collectionSnippet,
  isCursorInsideCollectionLoop,
  itemFieldPlaceholderSnippet,
  itemFieldSnippet,
  variableSnippet,
} from "./template-snippets"

describe("template snippets", () => {
  it("builds scalar variable snippets", () => {
    expect(
      variableSnippet({
        key: "organization.name",
        label: "Organization name",
        type: "string",
        category: "Organization",
      })
    ).toBe("{{ organization.name }}")
  })

  it("builds collection loop snippets from item fields", () => {
    expect(
      collectionSnippet({
        key: "vendors.dataProcessors",
        itemFields: [{ key: "name", label: "Name", type: "string" }],
      })
    ).toBe(`{% for vendor in vendors.dataProcessors -%}
{{ vendor.name }}
{% endfor %}`)
  })

  it("builds full loop snippets for collection item fields", () => {
    expect(
      itemFieldSnippet(
        {
          key: "services.all",
          itemFields: [{ key: "name", label: "Name", type: "string" }],
        },
        { key: "url", label: "URL", type: "string" }
      )
    ).toBe(`{% for service in services.all -%}
{{ service.url }}
{% endfor %}`)
  })

  it("builds item placeholders when the cursor is already inside a loop", () => {
    const variable = {
      key: "vendors.dataProcessors",
      itemFields: [{ key: "name", label: "Name", type: "string" }],
    }
    const content = "{% for vendor in vendors.dataProcessors -%}\n"

    expect(
      isCursorInsideCollectionLoop(content, content.length, variable)
    ).toBe(true)
    expect(
      itemFieldPlaceholderSnippet(variable, {
        key: "name",
        label: "Name",
        type: "string",
      })
    ).toBe("{{ vendor.name }}")
  })
})
