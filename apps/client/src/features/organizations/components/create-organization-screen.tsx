import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ClipboardList,
  Edit2,
  FileSearch,
  Info,
  Loader2,
  LogOut,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import {
  organizationLookupInputSchema,
  type AuthUser,
  type BusinessActivityInput,
  type StoredDataType,
} from "@plyco/shared"
import { useState, type FormEvent, type ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  useLookupOrganizationWebsite,
  useLookupPrivacyPolicy,
} from "@/features/organizations/hooks/use-organizations"
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
  fallbackDraft,
  mergeLookupDraft,
  toProfileDraft,
  normalizeUrl,
  optionLabels,
  complianceGoalsForRegions,
} from "./types"

const privacyLookupWarning =
  "Privacy policy details could not be enriched. You can continue manually."

const websiteLookupWarning =
  "Website details could not be enriched. You can continue manually."

const organizationDetailsDurationMs = 4000

type LookupPanelStatus = "pending" | "active" | "complete" | "skipped"

const wait = (durationMs: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, durationMs)
  })

const lookupPanelTone = (status: LookupPanelStatus) => {
  if (status === "complete") {
    return {
      panel:
        "border-slate-300 bg-white shadow-sm ring-1 ring-slate-100",
      icon: "bg-slate-900 text-white",
      bar: "bg-slate-900",
      status: "text-slate-700",
    }
  }

  if (status === "active") {
    return {
      panel:
        "border-slate-300 bg-white shadow-sm ring-2 ring-slate-200",
      icon: "bg-slate-100 text-slate-900",
      bar: "bg-slate-800",
      status: "text-slate-900",
    }
  }

  if (status === "skipped") {
    return {
      panel: "border-slate-200 bg-slate-50",
      icon: "bg-slate-200 text-slate-500",
      bar: "bg-slate-300",
      status: "text-slate-500",
    }
  }

  return {
    panel: "border-slate-200 bg-white",
    icon: "bg-slate-100 text-slate-400",
    bar: "bg-slate-200",
    status: "text-slate-400",
  }
}

const LookupStatusPanel = ({
  icon,
  label,
  status,
}: {
  icon: ReactNode
  label: string
  status: LookupPanelStatus
}) => {
  const tone = lookupPanelTone(status)
  const statusLabel =
    status === "complete"
      ? "Complete"
      : status === "skipped"
        ? "Skipped"
        : status === "active"
          ? "In progress"
          : "Waiting"

  return (
    <div
      className={`grid min-h-24 grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg border px-4 py-3 text-left transition ${tone.panel}`}
    >
      <div className={`flex size-12 items-center justify-center rounded-md ${tone.icon}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold tracking-wide text-slate-950">
          {label}
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-700 ${tone.bar}`}
            style={{
              width:
                status === "complete"
                  ? "100%"
                  : status === "active"
                    ? "72%"
                    : status === "skipped"
                      ? "100%"
                      : "0%",
            }}
          />
        </div>
      </div>
      <div className={`flex size-7 items-center justify-center rounded-full ${tone.status}`}>
        {status === "complete" ? (
          <Check className="size-4" />
        ) : status === "active" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : status === "skipped" ? (
          <span className="h-px w-3 rounded-full bg-current" />
        ) : (
          <span className="size-2 rounded-full bg-current" />
        )}
      </div>
      <span className="sr-only">{statusLabel}</span>
    </div>
  )
}

const LookupIllustration = () => (
  <div className="relative mx-auto size-44">
    <div className="absolute inset-4 rounded-full border border-slate-300" />
    <div className="absolute inset-8 rounded-full border border-slate-300" />
    <div className="absolute inset-12 rounded-full border border-slate-300" />
    <div className="absolute inset-[4.25rem] rounded-full border border-slate-200 bg-slate-50 onboarding-lookup-core" />
    <span className="onboarding-lookup-dot onboarding-lookup-dot-primary absolute right-6 top-2 size-3 rounded-full bg-slate-900 shadow-sm" />
    <span className="onboarding-lookup-dot onboarding-lookup-dot-secondary absolute bottom-9 left-4 size-2.5 rounded-full bg-slate-400 shadow-sm" />
    <span className="onboarding-lookup-dot onboarding-lookup-dot-tertiary absolute bottom-1 right-12 size-2 rounded-full bg-slate-500 shadow-sm" />
    <div className="absolute inset-0 flex items-center justify-center text-slate-900">
      <div className="relative size-12">
        <span className="absolute left-1/2 top-1/2 h-0.5 w-7 origin-left -translate-y-1/2 rotate-0 bg-slate-900" />
        <span className="absolute left-1/2 top-1/2 h-0.5 w-7 origin-left -translate-y-1/2 rotate-[60deg] bg-slate-900" />
        <span className="absolute left-1/2 top-1/2 h-0.5 w-7 origin-left -translate-y-1/2 rotate-[120deg] bg-slate-900" />
        <span className="absolute left-1/2 top-1/2 h-0.5 w-7 origin-left -translate-y-1/2 rotate-180 bg-slate-900" />
        <span className="absolute left-1/2 top-1/2 h-0.5 w-7 origin-left -translate-y-1/2 rotate-[240deg] bg-slate-900" />
        <span className="absolute left-1/2 top-1/2 h-0.5 w-7 origin-left -translate-y-1/2 rotate-[300deg] bg-slate-900" />
        <span className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-slate-900 bg-white" />
        <span className="absolute left-0 top-1/2 size-3 -translate-y-1/2 rounded-full border-4 border-slate-900 bg-white" />
        <span className="absolute right-0 top-1/2 size-3 -translate-y-1/2 rounded-full border-4 border-slate-900 bg-white" />
        <span className="absolute left-[0.55rem] top-1 size-3 rounded-full border-4 border-slate-900 bg-white" />
        <span className="absolute right-[0.55rem] top-1 size-3 rounded-full border-4 border-slate-900 bg-white" />
        <span className="absolute bottom-1 left-[0.55rem] size-3 rounded-full border-4 border-slate-900 bg-white" />
        <span className="absolute bottom-1 right-[0.55rem] size-3 rounded-full border-4 border-slate-900 bg-white" />
      </div>
    </div>
  </div>
)

const LookupLoadingView = ({
  organizationDetailsStatus,
  organizationLookupStatus,
  privacyLookupStatus,
}: {
  organizationDetailsStatus: LookupPanelStatus
  organizationLookupStatus: LookupPanelStatus
  privacyLookupStatus: LookupPanelStatus
}) => (
  <div className="mx-auto flex w-full max-w-2xl flex-col items-center text-center">
    <LookupIllustration />
    <h1 className="mt-8 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
      Building an understanding
    </h1>
    <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
      We are gathering intelligence about your organization's public footprint
      to streamline your governance setup.
    </p>
    <div className="mt-10 grid w-full gap-3">
      <LookupStatusPanel
        icon={<Building2 className="size-5" />}
        label="Resolving organization details"
        status={organizationDetailsStatus}
      />
      <LookupStatusPanel
        icon={<ClipboardList className="size-5" />}
        label="Building initial activities"
        status={organizationLookupStatus}
      />
      <LookupStatusPanel
        icon={<FileSearch className="size-5" />}
        label="Analyzing existing policies"
        status={privacyLookupStatus}
      />
    </div>
    <div className="mt-8 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-700">
      <span className="size-2 rounded-full bg-slate-900" />
      <span className="size-2 rounded-full bg-slate-700" />
      <span className="size-2 rounded-full bg-slate-500" />
      Active discovery in progress
    </div>
  </div>
)

const SetupTextArea = ({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
}) => (
  <label className="grid gap-2 text-sm font-medium text-slate-800 md:col-span-2">
    <span>{label}</span>
    <textarea
      className="min-h-24 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal leading-6 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
)

const ENRICHED_REGIONS: Record<string, { description: string; icon: string }> = {
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

const ENRICHED_COMPLIANCE: Record<string, { description: string; icon: string }> = {
  soc_2: {
    description: "Security, availability, and confidentiality trust standard.",
    icon: "soc_2",
  },
  gdpr: {
    description: "European standard for data protection and privacy rights.",
    icon: "gdpr",
  },
}

const emptyDataType = (index: number): StoredDataType => ({
  name: `Data type ${index + 1}`,
  description: "",
  subjectTypes: null,
  collectionMethods: null,
  isSensitive: null,
  isRequired: true,
})

const emptyActivity = (index: number): BusinessActivityInput => ({
  name: `Activity ${index + 1}`,
  purpose: "",
  role: "",
  legalBasis: [],
  retentionPolicy: null,
  retentionDays: 0,
})

type SetupTab = "company" | "service" | "data-types" | "activities"

const setupTabs: Array<{ value: SetupTab; label: string }> = [
  { value: "company", label: "Company" },
  { value: "service", label: "Primary Service" },
  { value: "data-types", label: "Data Types" },
  { value: "activities", label: "Activities" },
]

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
  const [setupTab, setSetupTab] = useState<SetupTab>("company")
  const [editingDataType, setEditingDataType] = useState<number | null>(null)
  const [editingActivity, setEditingActivity] = useState<number | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [organizationDetailsComplete, setOrganizationDetailsComplete] =
    useState(false)
  const [organizationLookupComplete, setOrganizationLookupComplete] =
    useState(false)
  const [privacyLookupStatus, setPrivacyLookupStatus] =
    useState<LookupPanelStatus>("pending")
  const lookupOrganizationWebsite = useLookupOrganizationWebsite()
  const lookupPrivacyPolicy = useLookupPrivacyPolicy()
  const vocabulary = useVocabulary(Boolean(draft))
  const queryClient = useQueryClient()
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

  const runLookups = async () => {
    if (!draft) {
      return
    }

    const lookupInput = {
      name: draft.company.companyName,
      website: draft.company.website ?? "",
    }
    let nextDraft = draft

    setSubmitError(null)
    setOrganizationDetailsComplete(false)
    setOrganizationLookupComplete(false)
    setPrivacyLookupStatus("pending")
    setStep("lookup-organization")
    const organizationDetailsPromise = wait(organizationDetailsDurationMs).then(
      () => {
        setOrganizationDetailsComplete(true)
      }
    )

    try {
      const result = await lookupOrganizationWebsite.mutateAsync({
        website: lookupInput.website,
      })
      nextDraft = mergeLookupDraft(nextDraft, lookupInput, result)
      setDraft(nextDraft)
      setOrganizationLookupComplete(true)

      if (result.privacyPolicyUrl) {
        setPrivacyLookupStatus("active")
        setStep("lookup-privacy")

        try {
          const privacy = await lookupPrivacyPolicy.mutateAsync({
            privacyPolicyUrl: result.privacyPolicyUrl,
          })
          nextDraft = { ...nextDraft, privacy }
          setDraft(nextDraft)
          setPrivacyLookupStatus("complete")
        } catch {
          nextDraft = {
            ...nextDraft,
            warnings: [...nextDraft.warnings, privacyLookupWarning],
          }
          setDraft(nextDraft)
          setPrivacyLookupStatus("complete")
        }
      } else {
        setPrivacyLookupStatus("skipped")
      }
    } catch {
      nextDraft = {
        ...nextDraft,
        warnings: [...nextDraft.warnings, websiteLookupWarning],
      }
      setDraft(nextDraft)
      setOrganizationLookupComplete(true)
      setPrivacyLookupStatus("skipped")
    } finally {
      await organizationDetailsPromise
      setStep("setup-review")
    }
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

    if (step === "compliance") {
      void runLookups()
      return
    }

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

  const startOnboarding = (event: FormEvent<HTMLFormElement>) => {
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
    setName(parsed.data.name)
    setWebsite(normalizedWebsite)
    setDraft(fallbackDraft(parsed.data))
    setStep("markets")
  }

  const finishSetup = async () => {
    if (!draft) {
      return
    }

    if (!draft.primaryService.serviceName?.trim()) {
      setSubmitError("Service name is required.")
      return
    }

    if (
      draft.dataTypes.length === 0 ||
      draft.dataTypes.some((dataType) => !dataType.name.trim())
    ) {
      setSubmitError("Add at least one data type with a name.")
      return
    }

    if (
      draft.activities.length === 0 ||
      draft.activities.some((activity) => !activity.name.trim())
    ) {
      setSubmitError("Add at least one activity with a name.")
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

      const activities = await Promise.all(
        draft.activities.map((activity) =>
          createBusinessActivity(organization.id, activity)
        )
      )
      const profile = toProfileDraft(
        draft,
        activities.map((activity) => activity.id)
      )
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

  if (step === "lookup-organization" || step === "lookup-privacy") {
    return (
      <CreateShell
        actions={actions}
        step={step}
        title=""
      >
        <LookupLoadingView
          organizationDetailsStatus={
            organizationDetailsComplete ? "complete" : "active"
          }
          organizationLookupStatus={
            organizationLookupComplete ? "complete" : "active"
          }
          privacyLookupStatus={privacyLookupStatus}
        />
      </CreateShell>
    )
  }

  if (step === "identity" || !draft) {
    return (
      <CreateShell
        actions={actions}
        step={step}
        title="Let's build your workspace"
      >
        <form
          className="mx-auto grid max-w-2xl gap-6"
          onSubmit={startOnboarding}
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
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-200 text-slate-700">
              <Info className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary-900">
                Workspace identity
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Add the basics first. We will ask for regions and goals before
                reading public pages for editable defaults.
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
              type="submit"
            >
              <Sparkles />
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
      {step === "setup-review" ? (
        <Button
          className="bg-slate-900 hover:bg-slate-800 text-white focus-visible:border-slate-950 focus-visible:ring-slate-100"
          disabled={isSubmitting}
          type="button"
          onClick={finishSetup}
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Check />}
          Create organization
        </Button>
      ) : (
        <Button
          className="bg-slate-900 hover:bg-slate-800 text-white focus-visible:border-slate-950 focus-visible:ring-slate-100"
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
      onBack={goBack}
      step={step}
      titleAbove={
        step === "markets" || step === "compliance" || step === "setup-review"
      }
      description={
        step === "markets"
          ? "Select the core regions where your organization operates to tailor your compliance and data reporting experience."
          : step === "compliance"
            ? "Pick the frameworks you are actively preparing for or already need to answer customer security reviews."
            : step === "setup-review"
              ? "Review and adjust the details Plyco found before creating your workspace."
              : undefined
      }
      title={
        step === "markets"
          ? "Primary Markets"
          : step === "compliance"
            ? "Compliance Goals"
            : "Review workspace setup"
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
        ) : null}

        {step === "compliance" ? (
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
        ) : null}

        {step === "setup-review" ? (
          <Tabs
            className="gap-6"
            value={setupTab}
            onValueChange={(value) => setSetupTab(value as SetupTab)}
          >
            <TabsList variant="line">
              {setupTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent className="mt-0 border-0 p-0 shadow-none" value="company">
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
            </TabsContent>

            <TabsContent className="mt-0 border-0 p-0 shadow-none" value="service">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <p className="text-sm font-semibold text-slate-950">
                      Primary Service
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Edit the primary product or service saved during setup.
                    </p>
                  </div>
                  <TextInput
                    label="Service name"
                    required
                    value={draft.primaryService.serviceName ?? ""}
                    onChange={(value) =>
                      updateDraft((current) => ({
                        ...current,
                        primaryService: {
                          ...current.primaryService,
                          serviceName: value,
                        },
                      }))
                    }
                  />
                  <TextInput
                    label="Service URL"
                    value={draft.primaryService.serviceUrl ?? ""}
                    onChange={(value) =>
                      updateDraft((current) => ({
                        ...current,
                        primaryService: {
                          ...current.primaryService,
                          serviceUrl: value,
                        },
                      }))
                    }
                  />
                  <SetupTextArea
                    label="Description"
                    value={draft.primaryService.serviceDescription ?? ""}
                    onChange={(value) =>
                      updateDraft((current) => ({
                        ...current,
                        primaryService: {
                          ...current.primaryService,
                          serviceDescription: value,
                        },
                      }))
                    }
                  />
                  <label className="grid gap-2 text-sm font-medium text-slate-800 md:col-span-2">
                    <span>Hosting region</span>
                    <select
                      className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
                      value={
                        draft.primaryService.privacy.primaryHostingRegion ?? ""
                      }
                      onChange={(event) =>
                        updateDraft((current) => ({
                          ...current,
                          primaryService: {
                            ...current.primaryService,
                            privacy: {
                              ...current.primaryService.privacy,
                              primaryHostingRegion:
                                event.target.value || null,
                            },
                          },
                        }))
                      }
                    >
                      <option value="">Not set</option>
                      {regionOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
            </TabsContent>

            <TabsContent className="mt-0 border-0 p-0 shadow-none" value="data-types">
                <div className="grid gap-3">
                  <div className="mb-2">
                    <p className="text-sm font-semibold text-slate-950">
                      Data Types
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Review and edit the data categories that will be saved.
                    </p>
                  </div>
                  <div className="grid gap-3">
                    {draft.dataTypes.map((dataType, index) => (
                      <div
                        className="group relative rounded-md border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
                        key={`${dataType.name}-${index}`}
                      >
                        {editingDataType === index ? (
                          <div className="grid gap-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-slate-950">
                                Edit Data Type
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingDataType(null)}
                              >
                                <Check className="size-4" />
                                Done
                              </Button>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <TextInput
                                label="Name"
                                required
                                value={dataType.name}
                                onChange={(value) =>
                                  updateDraft((current) => ({
                                    ...current,
                                    dataTypes: current.dataTypes.map(
                                      (item, currentIndex) =>
                                        currentIndex === index
                                          ? { ...item, name: value }
                                          : item
                                    ),
                                  }))
                                }
                              />
                              <SetupTextArea
                                label="Description"
                                value={dataType.description ?? ""}
                                onChange={(value) =>
                                  updateDraft((current) => ({
                                    ...current,
                                    dataTypes: current.dataTypes.map(
                                      (item, currentIndex) =>
                                        currentIndex === index
                                          ? { ...item, description: value || null }
                                          : item
                                    ),
                                  }))
                                }
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-950">
                                {dataType.name}
                              </p>
                              {dataType.description ? (
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                  {dataType.description}
                                </p>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingDataType(index)}
                              >
                                <Edit2 className="size-4 text-slate-500" />
                              </Button>
                              <Button
                                disabled={draft.dataTypes.length === 1}
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  updateDraft((current) => ({
                                    ...current,
                                    dataTypes: current.dataTypes.filter(
                                      (_, currentIndex) => currentIndex !== index
                                    ),
                                  }))
                                }
                              >
                                <Trash2 className="size-4 text-slate-400 hover:text-red-600" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <Button
                      className="mt-2 justify-self-start"
                      type="button"
                      variant="outline"
                      onClick={() => {
                        updateDraft((current) => {
                          const next = [
                            ...current.dataTypes,
                            emptyDataType(current.dataTypes.length),
                          ]
                          setEditingDataType(next.length - 1)
                          return {
                            ...current,
                            dataTypes: next,
                          }
                        })
                      }}
                    >
                      <Plus className="size-4" />
                      Add data type
                    </Button>
                  </div>
                </div>
            </TabsContent>

            <TabsContent className="mt-0 border-0 p-0 shadow-none" value="activities">
                <div className="grid gap-3">
                  <div className="mb-2">
                    <p className="text-sm font-semibold text-slate-950">
                      Activities
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Review and edit the business activities.
                    </p>
                  </div>
                  <div className="grid gap-3">
                    {draft.activities.map((activity, index) => (
                      <div
                        className="group relative rounded-md border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
                        key={`${activity.name}-${index}`}
                      >
                        {editingActivity === index ? (
                          <div className="grid gap-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-slate-950">
                                Edit Activity
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingActivity(null)}
                              >
                                <Check className="size-4" />
                                Done
                              </Button>
                            </div>
                            <div className="grid gap-3 md:grid-cols-2">
                              <TextInput
                                label="Name"
                                required
                                value={activity.name}
                                onChange={(value) =>
                                  updateDraft((current) => ({
                                    ...current,
                                    activities: current.activities.map(
                                      (item, currentIndex) =>
                                        currentIndex === index
                                          ? { ...item, name: value }
                                          : item
                                    ),
                                  }))
                                }
                              />
                              <SetupTextArea
                                label="Purpose"
                                value={activity.purpose}
                                onChange={(value) =>
                                  updateDraft((current) => ({
                                    ...current,
                                    activities: current.activities.map(
                                      (item, currentIndex) =>
                                        currentIndex === index
                                          ? { ...item, purpose: value }
                                          : item
                                    ),
                                  }))
                                }
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-950">
                                {activity.name}
                              </p>
                              {activity.purpose ? (
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                  {activity.purpose}
                                </p>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingActivity(index)}
                              >
                                <Edit2 className="size-4 text-slate-500" />
                              </Button>
                              <Button
                                disabled={draft.activities.length === 1}
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  updateDraft((current) => ({
                                    ...current,
                                    activities: current.activities.filter(
                                      (_, currentIndex) => currentIndex !== index
                                    ),
                                  }))
                                }
                              >
                                <Trash2 className="size-4 text-slate-400 hover:text-red-600" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    <Button
                      className="mt-2 justify-self-start"
                      type="button"
                      variant="outline"
                      onClick={() => {
                        updateDraft((current) => {
                          const next = [
                            ...current.activities,
                            emptyActivity(current.activities.length),
                          ]
                          setEditingActivity(next.length - 1)
                          return {
                            ...current,
                            activities: next,
                          }
                        })
                      }}
                    >
                      <Plus className="size-4" />
                      Add activity
                    </Button>
                  </div>
                </div>
            </TabsContent>
          </Tabs>
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
