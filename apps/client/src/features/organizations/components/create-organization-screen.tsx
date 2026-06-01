import {
  ArrowLeft,
  ArrowRight,
  Check,
  Info,
  Loader2,
  LogOut,
  Sparkles,
  X,
} from "lucide-react"
import {
  organizationLookupInputSchema,
  type AuthUser,
} from "@plyco/shared"
import { useState, type FormEvent } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useLookupOrganization } from "@/features/organizations/hooks/use-organizations"
import { useCurrentOrganizationStore } from "@/features/organizations/stores/current-organization-store"
import { useVocabulary } from "@/features/vocabulary/hooks/use-vocabulary"
import { codeOptions } from "@/features/vocabulary/lib/vocabulary"
import {
  createBusinessActivity,
  createOrganization,
  saveSecurityProfile,
} from "@/lib/api"
import { authStateQueryKey, securityProfileQueryKey } from "@/lib/query-keys"

import { CreateShell } from "./create-shell"
import { TextInput } from "./text-input"
import { OptionPicker } from "./option-picker"
import { ReviewRow } from "./review-row"
import {
  type WizardStep,
  type WizardDraft,
  stepOrder,
  fallbackComplianceGoalOptions,
  fallbackRegionOptions,
  draftFromLookup,
  toProfileDraft,
  normalizeUrl,
  optionLabels,
  complianceGoalsForRegions,
} from "./types"

export const CreateOrganizationScreen = ({
  user,
  onCancel,
  onComplete,
  onLogout,
}: {
  user: AuthUser
  onCancel?: () => void
  onComplete?: () => void
  onLogout: () => void
}) => {
  const [step, setStep] = useState<WizardStep>("identity")
  const [name, setName] = useState("")
  const [website, setWebsite] = useState("")
  const [draft, setDraft] = useState<WizardDraft | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const lookupOrganization = useLookupOrganization()
  const vocabulary = useVocabulary(Boolean(draft))
  const queryClient = useQueryClient()
  const complianceGoalOptions = codeOptions(vocabulary.data, "compliance_goals")
  const goalOptions =
    complianceGoalOptions.length > 0
      ? complianceGoalOptions
      : fallbackComplianceGoalOptions
  const vocabularyRegionOptions = codeOptions(vocabulary.data, "regions")
  const regionOptions =
    vocabularyRegionOptions.length > 0
      ? vocabularyRegionOptions
      : fallbackRegionOptions
  const actions = onCancel ? (
    <Button type="button" variant="outline" onClick={onCancel}>
      <X />
      Close
    </Button>
  ) : (
    <Button type="button" variant="outline" onClick={onLogout}>
      <LogOut />
      Logout
    </Button>
  )

  const updateDraft = (updater: (current: WizardDraft) => WizardDraft) => {
    setDraft((current) => (current ? updater(current) : current))
  }

  const goNext = () => {
    const index = stepOrder.indexOf(step)

    if (
      step === "markets" &&
      (!draft?.company.regions || draft.company.regions.length === 0)
    ) {
      setSubmitError("Select at least one primary region.")
      return
    }

    setSubmitError(null)

    if (index >= 0 && index < stepOrder.length - 1) {
      setStep(stepOrder[index + 1])
    }
  }

  const goBack = () => {
    const index = stepOrder.indexOf(step)

    if (index > 0) {
      setStep(stepOrder[index - 1])
    }
  }

  const startLookup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedWebsite = normalizeUrl(website)
    const parsed = organizationLookupInputSchema.safeParse({
      name,
      website: normalizedWebsite,
    })

    if (!parsed.success) {
      setSubmitError(parsed.error.issues[0]?.message ?? "Check the form.")
      return
    }

    setSubmitError(null)
    setWebsite(normalizedWebsite)
    setStep("lookup")
    lookupOrganization.mutate(parsed.data, {
      onSuccess: (result) => {
        setDraft(draftFromLookup(parsed.data, result))
        setStep("markets")
      },
      onError: (error) => {
        setSubmitError(error.message || "Could not map organization details.")
        setStep("identity")
      },
    })
  }

  const finishSetup = async () => {
    if (!draft) {
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const organization = await createOrganization({
        name: draft.company.companyName,
        website: draft.company.website || undefined,
      })
      const store = useCurrentOrganizationStore.getState()
      store.selectOrganization(organization.id)
      store.markOnboarding(organization.id)

      const activity = await createBusinessActivity(
        organization.id,
        draft.primaryActivity
      )
      const profile = toProfileDraft(draft, activity.id)
      const snapshot = await saveSecurityProfile(organization.id, profile)

      queryClient.setQueryData(securityProfileQueryKey(organization.id), snapshot)
      await queryClient.invalidateQueries({ queryKey: authStateQueryKey })
      await queryClient.invalidateQueries({
        queryKey: securityProfileQueryKey(organization.id),
      })
      store.completeOnboarding(organization.id)
      onComplete?.()
      toast.success("Organization created")
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Could not create organization"
      )
      toast.error("Could not create organization")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (step === "lookup") {
    return (
      <CreateShell
        actions={actions}
        eyebrow="Website lookup"
        step={step}
        title="Pulling details from your website"
      >
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-md bg-blue-50 text-blue-700">
            <Loader2 className="size-5 animate-spin" />
          </div>
          <p className="mt-5 font-medium text-slate-950">
            Reading public pages and policy links.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            We are looking for organization details, a primary service, common
            data categories, policy links, and providers. You can review the
            lookup details before anything is saved.
          </p>
        </div>
      </CreateShell>
    )
  }

  if (step === "identity" || !draft) {
    return (
      <CreateShell
        actions={actions}
        eyebrow="Step 1 of 4"
        step={step}
        title="Let's build your workspace"
      >
        <form
          className="mx-auto grid max-w-2xl gap-6"
          onSubmit={startLookup}
        >
          <TextInput
            label="Organization name"
            placeholder="Acme AI"
            required
            value={name}
            onChange={setName}
          />
          <TextInput
            label="Website"
            helperText="We use this to prefill setup from public pages and policy links."
            placeholder="www.example.com"
            required
            type="text"
            value={website}
            onChange={setWebsite}
          />
          <div className="flex gap-4 rounded-lg border border-primary-100 bg-primary-50 p-4 text-left">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-blue-100 text-primary-700">
              <Info className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary-900">
                Workspace identity
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Providing your website helps us fetch public details for review
                while keeping the setup editable.
              </p>
            </div>
          </div>
          {submitError ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
              {submitError}
            </p>
          ) : null}
          <div className="grid gap-4 pt-2">
            <Button
              className="h-12"
              disabled={lookupOrganization.isPending}
              type="submit"
            >
              {lookupOrganization.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Sparkles />
              )}
              Continue
            </Button>
            <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
              Signed in as {user.email}
            </p>
          </div>
        </form>
      </CreateShell>
    )
  }

  const footer = (
    <div className="flex items-center justify-between border-t border-slate-200 pt-5">
      <Button
        disabled={isSubmitting}
        type="button"
        variant="outline"
        onClick={goBack}
      >
        <ArrowLeft />
        Back
      </Button>
      {step === "review" ? (
        <Button
          className="bg-blue-600 hover:bg-blue-700 focus-visible:border-blue-700 focus-visible:ring-blue-100"
          disabled={isSubmitting}
          type="button"
          onClick={finishSetup}
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Check />}
          Create organization
        </Button>
      ) : (
        <Button
          className="bg-blue-600 hover:bg-blue-700 focus-visible:border-blue-700 focus-visible:ring-blue-100"
          type="button"
          onClick={goNext}
        >
          Next
          <ArrowRight />
        </Button>
      )}
    </div>
  )

  return (
    <CreateShell
      actions={actions}
      eyebrow={
        step === "markets"
          ? "Step 2 of 4"
          : step === "compliance"
            ? "Step 3 of 4"
            : "Step 4 of 4"
      }
      onBack={goBack}
      step={step}
      title={
        step === "markets"
          ? "Select your primary regions"
          : step === "compliance"
            ? "Choose compliance goals"
            : "Review lookup details"
      }
    >
      <section className="grid gap-6">
        {draft.warnings.length > 0 ? (
          <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {draft.warnings[0]}
          </div>
        ) : null}

        {step === "markets" ? (
          <OptionPicker
            helperText="Use the shared regions codeset so the next step can start with relevant compliance defaults."
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
        ) : null}

        {step === "compliance" ? (
          <OptionPicker
            helperText="Pick the frameworks you are actively preparing for or already need to answer customer security reviews."
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
        ) : null}

        {step === "review" ? (
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
            <div className="grid gap-3 md:grid-cols-2">
              <ReviewRow
                label="Primary regions"
                value={optionLabels(draft.company.regions, regionOptions)}
              />
              <ReviewRow
                label="Compliance goals"
                value={optionLabels(draft.company.complianceGoals, goalOptions)}
              />
              <ReviewRow
                label="Primary service"
                value={draft.primaryService.serviceName || "Not detected"}
              />
              <ReviewRow
                label="Primary data type"
                value={draft.primaryDataType.name || "Not detected"}
              />
              <ReviewRow
                label="Hosting region"
                value={
                  draft.primaryService.privacy.primaryHostingRegion
                    ? optionLabels(
                        [draft.primaryService.privacy.primaryHostingRegion],
                        regionOptions
                      )
                    : "Not detected"
                }
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
        ) : null}

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
