import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useOnboardingStore } from "../stores/onboarding-store"
import { CreateShell } from "../../components/create-shell"
import { OptionPicker } from "../../components/option-picker"
import { useVocabulary } from "@/features/vocabulary/hooks/use-vocabulary"
import { codeOptions } from "@/features/vocabulary/lib/vocabulary"
import {
  fallbackRegionOptions,
  complianceGoalsForRegions,
} from "../../components/types"

const ENRICHED_REGIONS: Record<string, { description: string; icon: string }> =
  {
    global: {
      description: "Cross-border operations spanning multiple continents.",
      icon: "globe",
    },
    us: {
      description: "North American domestic market and regulatory compliance.",
      icon: "us",
    },
    eu: {
      description: "EMEA focus with GDPR and regional policy adherence.",
      icon: "eu",
    },
    uk: {
      description: "UK market presence and UK GDPR alignment.",
      icon: "uk",
    },
    apac: {
      description: "APAC fast-growing markets and local compliance needs.",
      icon: "apac",
    },
    latam: {
      description: "LATAM presence and emerging data protection frameworks.",
      icon: "latam",
    },
    mea: {
      description: "MEA operations and localized compliance standards.",
      icon: "mea",
    },
  }

export const MarketsStep = () => {
  const navigate = useNavigate()
  const { draft, updateDraft, submitError, setSubmitError } =
    useOnboardingStore()

  const vocabulary = useVocabulary(Boolean(draft))
  const allowedRegionValues = ["global", "us", "eu"]
  const vocabularyRegionOptions = codeOptions(vocabulary.data, "regions")
  const regionOptions = (
    vocabularyRegionOptions.length > 0
      ? vocabularyRegionOptions
      : fallbackRegionOptions
  )
    .filter((option) => allowedRegionValues.includes(option.value))
    .map((option) => ({
      ...option,
      ...ENRICHED_REGIONS[option.value],
    }))

  useEffect(() => {
    if (!draft) {
      navigate("../identity", { replace: true })
    }
  }, [draft, navigate])

  if (!draft) {
    return null
  }

  const handleNext = () => {
    if (!draft.company.regions || draft.company.regions.length === 0) {
      setSubmitError("Select at least one primary region.")
      return
    }
    setSubmitError(null)
    navigate("../compliance")
  }

  const handleBack = () => {
    navigate("../identity")
  }

  const footer = (
    <div className="flex items-center justify-between border-t border-slate-200 pt-5">
      <Button type="button" variant="outline" onClick={handleBack}>
        <ArrowLeft />
        Back
      </Button>
      <Button
        className="bg-slate-900 text-white hover:bg-slate-800 focus-visible:border-slate-950 focus-visible:ring-slate-100"
        type="button"
        onClick={handleNext}
      >
        Next
        <ArrowRight />
      </Button>
    </div>
  )

  return (
    <CreateShell
      onBack={handleBack}
      step="markets"
      titleAbove
      description="Select the core regions where your organization operates to tailor your compliance and data reporting experience."
      title="Primary Markets"
    >
      <section className="grid gap-6">
        {draft.warnings.length > 0 ? (
          <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {draft.warnings[0]}
          </div>
        ) : null}

        <OptionPicker
          hideHeader
          label="Primary regions"
          options={regionOptions}
          value={draft.company.regions}
          onChange={(value) =>
            updateDraft((current) => ({
              ...current,
              company: {
                ...current.company,
                regions: value,
                complianceGoals: complianceGoalsForRegions(value),
              },
            }))
          }
        />

        {submitError ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {submitError}
          </p>
        ) : null}
        {footer}
      </section>
    </CreateShell>
  )
}
