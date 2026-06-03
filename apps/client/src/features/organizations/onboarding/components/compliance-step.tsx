import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, ArrowRight, LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useOnboardingStore } from "../stores/onboarding-store"
import { CreateShell } from "../../components/create-shell"
import { OptionPicker } from "../../components/option-picker"
import { useVocabulary } from "@/features/vocabulary/hooks/use-vocabulary"
import { codeOptions } from "@/features/vocabulary/lib/vocabulary"
import { fallbackComplianceGoalOptions } from "../../components/types"

const ENRICHED_COMPLIANCE: Record<string, { description: string; icon: string }> = {
  soc_2: {
    description: "Security, availability, and confidentiality trust standard.",
    icon: "shield",
  },
  gdpr: {
    description: "European standard for data protection and privacy rights.",
    icon: "gdpr",
  },
}

export const ComplianceStep = () => {
  const navigate = useNavigate()
  const {
    draft,
    updateDraft,
    submitError,
    setSubmitError,
    onCancel,
    onLogout,
  } = useOnboardingStore()

  const vocabulary = useVocabulary(Boolean(draft))
  const complianceGoalOptions = codeOptions(vocabulary.data, "compliance_goals")
  const goalOptions = (
    complianceGoalOptions.length > 0
      ? complianceGoalOptions
      : fallbackComplianceGoalOptions
  ).map((option) => {
    const enriched = ENRICHED_COMPLIANCE[option.value] || {
      description: "Compliance and security reporting framework standard.",
      icon: "shield",
    }
    return {
      ...option,
      ...enriched,
    }
  })

  useEffect(() => {
    if (!draft) {
      navigate("../identity", { replace: true })
    }
  }, [draft, navigate])

  if (!draft) {
    return null
  }

  const actions = onCancel ? (
    <Button type="button" variant="outline" onClick={onCancel}>
      Close
    </Button>
  ) : onLogout ? (
    <Button type="button" variant="outline" onClick={onLogout}>
      <LogOut />
      Logout
    </Button>
  ) : null

  const handleNext = () => {
    setSubmitError(null)
    navigate("../lookup")
  }

  const handleBack = () => {
    navigate("../markets")
  }

  const footer = (
    <div className="flex items-center justify-between border-t border-slate-200 pt-5">
      <Button
        type="button"
        variant="outline"
        onClick={handleBack}
      >
        <ArrowLeft />
        Back
      </Button>
      <Button
        className="bg-slate-900 hover:bg-slate-800 text-white focus-visible:border-slate-950 focus-visible:ring-slate-100"
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
      actions={actions}
      onBack={handleBack}
      step="compliance"
      titleAbove
      description="Pick the frameworks you are actively preparing for or already need to answer customer security reviews."
      title="Compliance Goals"
    >
      <section className="grid gap-6">
        {draft.warnings.length > 0 ? (
          <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {draft.warnings[0]}
          </div>
        ) : null}

        <OptionPicker
          hideHeader
          cols={2}
          isCompliance
          label="Compliance goals"
          options={goalOptions}
          value={draft.company.complianceGoals}
          onChange={(value) =>
            updateDraft((current) => ({
              ...current,
              company: { ...current.company, complianceGoals: value },
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
