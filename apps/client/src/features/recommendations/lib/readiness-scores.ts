import { type ReadinessScore, type ReadinessScoreArea } from "@plyco/shared"

export const readinessAreaDetails: Record<
  ReadinessScoreArea,
  { label: string; href: string }
> = {
  security: { label: "Security", href: "/company/security" },
  privacy: { label: "Privacy", href: "/company/privacy" },
  access: { label: "Access", href: "/company/access" },
  infrastructure: {
    label: "Infrastructure",
    href: "/company/infrastructure",
  },
  productAndData: { label: "Product & Data", href: "/company/graph" },
}

export const readinessAreaOrder: ReadinessScoreArea[] = [
  "security",
  "privacy",
  "access",
  "infrastructure",
  "productAndData",
]

export const readinessScoreStatus = (value: number | null) => {
  if (value === null) {
    return {
      label: "Not enough data",
      badgeClass: "bg-slate-100 text-slate-700",
      barClass: "bg-slate-400",
      valueClass: "text-slate-500",
    }
  }

  if (value >= 80) {
    return {
      label: "Strong foundation",
      badgeClass: "bg-emerald-50 text-emerald-800",
      barClass: "bg-emerald-600",
      valueClass: "text-emerald-700",
    }
  }

  if (value >= 60) {
    return {
      label: "Progressing",
      badgeClass: "bg-slate-100 text-slate-800",
      barClass: "bg-slate-600",
      valueClass: "text-slate-700",
    }
  }

  if (value >= 40) {
    return {
      label: "Needs attention",
      badgeClass: "bg-amber-50 text-amber-800",
      barClass: "bg-amber-500",
      valueClass: "text-amber-700",
    }
  }

  return {
    label: "Significant gaps",
    badgeClass: "bg-orange-50 text-orange-800",
    barClass: "bg-orange-500",
    valueClass: "text-orange-700",
  }
}

export const readinessCoverageText = (score: ReadinessScore) =>
  score.applicableRuleCount === 0
    ? "No applicable checks yet"
    : `${score.assessedRuleCount} of ${score.applicableRuleCount} applicable checks assessed`
