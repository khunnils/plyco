import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useOnboardingStore } from "../stores/onboarding-store"
import { CreateShell } from "../../components/create-shell"
import { OptionPicker } from "../../components/option-picker"
import {
  complianceGoalsForRegions,
} from "../../components/types"

const regionOptions = [
  {
    value: "global",
    label: "US / Global",
    description: "US-based or broadly global operations.",
    icon: "globe",
  },
  {
    value: "eu",
    label: "Europe",
    description: "European operations and GDPR-focused privacy expectations.",
    icon: "eu",
  },
]

export const MarketsStep = () => {
  const navigate = useNavigate()
  const { draft, updateDraft, submitError, setSubmitError } =
    useOnboardingStore()

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
    navigate("../lookup")
  }

  const handleBack = () => {
    navigate("../identity")
  }

  const footer = (
    <div className="flex items-center justify-between border-t border-slate-200 pt-5">
      <Button size="lg" type="button" variant="outline" onClick={handleBack}>
        <ArrowLeft />
        Back
      </Button>
      <Button
        className="bg-slate-900 text-white hover:bg-slate-800 focus-visible:border-slate-950 focus-visible:ring-slate-100"
        disabled={!draft.company.regions?.length}
        type="button"
        size="lg"
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
          onChange={(value) => {
            updateDraft((current) => ({
              ...current,
              company: {
                ...current.company,
                regions: value,
                complianceGoals: complianceGoalsForRegions(value),
              },
            }))
          }}
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
