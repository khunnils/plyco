import { describe, expect, it } from "vitest"

import { applyCodeSetChange, codeOptions } from "./vocabulary"

const vocabulary = {
  codeSets: [
    {
      id: "org-industries",
      codeSetId: "industries",
      name: "Industries",
      description: "",
      usesHints: true,
      isSystem: false,
      codes: [
        {
          id: "industry-ai",
          codeId: "ai",
          name: "Artificial Intelligence",
          description: "Products built around machine learning.",
          sortOrder: 1,
          active: true,
          isSystem: false,
        },
      ],
    },
  ],
}

describe("vocabulary options", () => {
  it("includes code-set hint and edit metadata", () => {
    expect(codeOptions(vocabulary, "industries")).toEqual([
      expect.objectContaining({
        value: "ai",
        description: "Products built around machine learning.",
        codeSetId: "industries",
        usesHints: true,
        editable: true,
      }),
    ])
  })

  it("remaps and removes selected values after quick edits", () => {
    expect(
      applyCodeSetChange(["ai", "saas"], {
        type: "update",
        previousCodeId: "ai",
        code: {
          ...vocabulary.codeSets[0].codes[0],
          codeId: "machine_learning",
        },
      })
    ).toEqual(["machine_learning", "saas"])

    expect(
      applyCodeSetChange(["ai", "saas"], { type: "delete", codeId: "ai" })
    ).toEqual(["saas"])
  })
})
