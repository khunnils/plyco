import { describe, expect, it } from "vitest"

import {
  dashboardReadinessPresentation,
  failingRecommendationsForArea,
  isReadinessCoverageComplete,
  recommendationSummaryText,
  readinessScoreFromValue,
  readinessScoreStatus,
  readinessScoreStatusFromScore,
  readinessStatusWhenComplete,
} from "./readiness-scores"

const recommendation = (
  overrides: Partial<{
    id: string
    title: string
    category: "security" | "privacy" | "access" | "activities" | "vendors"
    severity: "critical" | "high" | "medium" | "low"
  }> = {}
) => ({
  id: overrides.id ?? "rule-1",
  title: overrides.title ?? "Example rule",
  category: overrides.category ?? "security",
  severity: overrides.severity ?? "medium",
  frameworks: [],
  message: "Example message",
  recommendation: "Example recommendation",
  relatedFields: [],
})

describe("readiness scores", () => {
  it.each([
    [null, "Not enough data"],
    [0, "Major gaps"],
    [39, "Major gaps"],
    [40, "Needs strengthening"],
    [59, "Needs strengthening"],
    [60, "Solid foundation"],
    [79, "Solid foundation"],
    [80, "Strong foundation"],
    [100, "Strong foundation"],
  ] as const)("labels score %s as %s", (value, expected) => {
    expect(readinessScoreStatus(value).label).toBe(expected)
  })

  it.each([
    [0, 1],
    [30, 4],
    [40, 5],
    [50, 6],
    [60, 7],
    [70, 8],
    [80, 9],
    [100, 10],
  ] as const)("converts internal score %s to %s/10", (value, expected) => {
    expect(readinessScoreFromValue(value)).toBe(expected)
  })

  it.each([
    [1, "Major gaps"],
    [4, "Major gaps"],
    [5, "Needs strengthening"],
    [6, "Needs strengthening"],
    [7, "Solid foundation"],
    [8, "Solid foundation"],
    [9, "Strong foundation"],
    [10, "Strong foundation"],
  ] as const)("labels %s/10 as %s", (score, expected) => {
    expect(readinessScoreStatusFromScore(score).label).toBe(expected)
  })

  it("keeps setup primary below 75% completion", () => {
    expect(
      dashboardReadinessPresentation(74, {
        value: 100,
        assessedRuleCount: 4,
        applicableRuleCount: 4,
      })
    ).toEqual({ kind: "setup" })
  })

  it("waits for 75% advisor coverage before showing readiness", () => {
    expect(
      dashboardReadinessPresentation(75, {
        value: 100,
        assessedRuleCount: 2,
        applicableRuleCount: 3,
      })
    ).toEqual({ kind: "assessment" })
    expect(
      dashboardReadinessPresentation(75, {
        value: null,
        assessedRuleCount: 0,
        applicableRuleCount: 0,
      })
    ).toEqual({ kind: "assessment" })
  })

  it("caps preliminary readiness at 8/10", () => {
    expect(
      dashboardReadinessPresentation(75, {
        value: 100,
        assessedRuleCount: 3,
        applicableRuleCount: 4,
      })
    ).toEqual({
      kind: "readiness",
      score: 8,
      label: "Solid foundation",
      badgeVariant: "secondary",
      preliminary: true,
    })
  })

  it("shows uncapped readiness at full coverage", () => {
    expect(
      dashboardReadinessPresentation(100, {
        value: 90,
        assessedRuleCount: 4,
        applicableRuleCount: 4,
      })
    ).toEqual({
      kind: "readiness",
      score: 10,
      label: "Strong foundation",
      badgeVariant: "success",
      preliminary: false,
    })
  })

  it("requires at least one fully assessed applicable check", () => {
    expect(
      isReadinessCoverageComplete({
        value: 100,
        assessedRuleCount: 1,
        applicableRuleCount: 2,
      })
    ).toBe(false)
    expect(
      isReadinessCoverageComplete({
        value: null,
        assessedRuleCount: 0,
        applicableRuleCount: 0,
      })
    ).toBe(false)
    expect(
      isReadinessCoverageComplete({
        value: 75,
        assessedRuleCount: 2,
        applicableRuleCount: 2,
      })
    ).toBe(true)
  })

  it("reveals qualitative readiness only after completion and full coverage", () => {
    const completeScore = {
      value: 80,
      assessedRuleCount: 4,
      applicableRuleCount: 4,
    }

    expect(readinessStatusWhenComplete(false, completeScore)).toBeNull()
    expect(
      readinessStatusWhenComplete(true, {
        ...completeScore,
        assessedRuleCount: 3,
      })
    ).toBeNull()
    expect(
      readinessStatusWhenComplete(true, {
        value: null,
        assessedRuleCount: 0,
        applicableRuleCount: 0,
      })
    ).toBeNull()
    expect(readinessStatusWhenComplete(true, completeScore)?.label).toBe(
      "Strong foundation"
    )
  })

  it.each([
    [0, "Major gaps"],
    [40, "Needs strengthening"],
    [60, "Solid foundation"],
    [80, "Strong foundation"],
  ] as const)("reveals %s as %s after the gates pass", (value, label) => {
    expect(
      readinessStatusWhenComplete(true, {
        value,
        assessedRuleCount: 3,
        applicableRuleCount: 3,
      })?.label
    ).toBe(label)
  })

  it("does not imply a clean assessment while setup or coverage is incomplete", () => {
    expect(
      recommendationSummaryText({
        assessmentComplete: false,
        isLoading: false,
        recommendationTotal: 0,
      })
    ).toBe("Complete setup for a fuller assessment")
    expect(
      recommendationSummaryText({
        assessmentComplete: true,
        isLoading: false,
        recommendationTotal: 0,
      })
    ).toBe("No recommendations right now")
  })

  it("keeps loading and finding counts ahead of assessment copy", () => {
    expect(
      recommendationSummaryText({
        assessmentComplete: false,
        isLoading: true,
        recommendationTotal: 0,
      })
    ).toBe("Checking recommendations")
    expect(
      recommendationSummaryText({
        assessmentComplete: false,
        isLoading: false,
        recommendationTotal: 2,
      })
    ).toBe("2 recommendations")
  })

  it("filters and severity-sorts failing recommendations for a readiness area", () => {
    expect(
      failingRecommendationsForArea(
        [
          recommendation({
            id: "privacy-low",
            category: "privacy",
            severity: "low",
            title: "Privacy low",
          }),
          recommendation({
            id: "security-medium",
            category: "security",
            severity: "medium",
            title: "Security medium",
          }),
          recommendation({
            id: "security-critical",
            category: "security",
            severity: "critical",
            title: "Security critical",
          }),
          recommendation({
            id: "vendor-high",
            category: "vendors",
            severity: "high",
            title: "Vendor high",
          }),
          recommendation({
            id: "activity-medium",
            category: "activities",
            severity: "medium",
            title: "Activity medium",
          }),
        ],
        "security"
      ).map((item) => item.id)
    ).toEqual(["security-critical", "security-medium"])

    expect(
      failingRecommendationsForArea(
        [
          recommendation({
            id: "vendor-high",
            category: "vendors",
            severity: "high",
            title: "Vendor high",
          }),
          recommendation({
            id: "activity-critical",
            category: "activities",
            severity: "critical",
            title: "Activity critical",
          }),
          recommendation({
            id: "security-low",
            category: "security",
            severity: "low",
            title: "Security low",
          }),
        ],
        "productAndData"
      ).map((item) => item.id)
    ).toEqual(["activity-critical", "vendor-high"])
  })
})
