import { describe, expect, it } from "vitest"

import {
  readinessAreaDetails,
  readinessAreaOrder,
  readinessCoverageText,
  readinessScoreStatus,
} from "./readiness-scores"

describe("readiness scores", () => {
  it.each([
    [null, "Not enough data"],
    [0, "Significant gaps"],
    [39, "Significant gaps"],
    [40, "Needs attention"],
    [59, "Needs attention"],
    [60, "Progressing"],
    [79, "Progressing"],
    [80, "Strong foundation"],
    [100, "Strong foundation"],
  ] as const)("labels score %s as %s", (value, expected) => {
    expect(readinessScoreStatus(value).label).toBe(expected)
  })

  it("describes assessed coverage", () => {
    expect(
      readinessCoverageText({
        value: 75,
        assessedRuleCount: 3,
        applicableRuleCount: 5,
      })
    ).toBe("3 of 5 applicable checks assessed")
    expect(
      readinessCoverageText({
        value: null,
        assessedRuleCount: 0,
        applicableRuleCount: 0,
      })
    ).toBe("No applicable checks yet")
  })

  it("keeps every readiness area in the intended dashboard order", () => {
    expect(readinessAreaOrder).toEqual([
      "security",
      "privacy",
      "access",
      "infrastructure",
      "productAndData",
    ])
    expect(
      readinessAreaOrder.map((area) => readinessAreaDetails[area].href)
    ).toEqual([
      "/company/security",
      "/company/privacy",
      "/company/access",
      "/company/infrastructure",
      "/company/graph",
    ])
  })
})
