import { describe, expect, it } from "vitest"

import { type Recommendation } from "@plyco/shared"

import { groupRecommendationsBySeverity } from "./recommendations"

const recommendation = (
  id: string,
  severity: Recommendation["severity"]
): Recommendation => ({
  id,
  severity,
  title: id,
  category: "privacy",
  frameworks: [],
  message: `${id} finding`,
  recommendation: `${id} action`,
  relatedFields: [],
})

describe("groupRecommendationsBySeverity", () => {
  it("groups recommendations from critical to low and omits empty groups", () => {
    const groups = groupRecommendationsBySeverity([
      recommendation("low", "low"),
      recommendation("critical", "critical"),
      recommendation("high", "high"),
    ])

    expect(groups.map(({ severity }) => severity)).toEqual([
      "critical",
      "high",
      "low",
    ])
    expect(groups[0]?.recommendations.map(({ id }) => id)).toEqual(["critical"])
  })
})
