import { useOnboardingStore } from "../stores/onboarding-store"
import { TextInput } from "../../components/text-input"
import { ReviewRow } from "../../components/review-row"
import { optionLabels } from "../../components/types"

interface ReviewCompanyTabProps {
  regionOptions: Array<{ value: string; label: string }>
  goalOptions: Array<{ value: string; label: string }>
}

export const ReviewCompanyTab = ({
  regionOptions,
  goalOptions,
}: ReviewCompanyTabProps) => {
  const { draft, updateDraft } = useOnboardingStore()

  if (!draft) {
    return null
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 md:grid-cols-2">
        <TextInput
          label="Organization name"
          required
          value={draft.company.companyName}
          onChange={(value) =>
            updateDraft((current) => ({
              ...current,
              company: { ...current.company, companyName: value },
            }))
          }
        />
        <TextInput
          label="Website"
          value={draft.company.website ?? ""}
          onChange={(value) =>
            updateDraft((current) => ({
              ...current,
              company: { ...current.company, website: value },
            }))
          }
        />
        <TextInput
          label="Legal entity name"
          value={draft.company.legalEntityName ?? ""}
          onChange={(value) =>
            updateDraft((current) => ({
              ...current,
              company: { ...current.company, legalEntityName: value },
            }))
          }
        />
        <TextInput
          label="Contact email"
          type="email"
          value={draft.company.contactEmail ?? ""}
          onChange={(value) =>
            updateDraft((current) => ({
              ...current,
              company: { ...current.company, contactEmail: value },
            }))
          }
        />
      </div>
      <div className="grid gap-3 border-t border-slate-100 pt-5 md:grid-cols-2">
        <ReviewRow
          label="Primary regions"
          value={optionLabels(draft.company.regions, regionOptions)}
        />
        <ReviewRow
          label="Compliance goals"
          value={optionLabels(draft.company.complianceGoals, goalOptions)}
        />
        <ReviewRow
          label="Privacy policy"
          value={draft.privacyPolicyUrl ?? "Not detected"}
        />
        <ReviewRow
          label="Suggested providers"
          value={
            draft.suggestedProviderNames.length > 0
              ? draft.suggestedProviderNames.join(", ")
              : "None detected"
          }
        />
      </div>
    </div>
  )
}
