import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Loader2,
  LogOut,
  Sparkles,
  X,
} from "lucide-react"
import {
  emptyAccessProfile,
  emptyCompanyProfile,
  emptyInfrastructureProfile,
  emptyPrivacyProfile,
  emptyServiceProfile,
  organizationLookupInputSchema,
  type AuthUser,
  type BusinessActivityInput,
  type CompanyProfile,
  type OrganizationLookupResult,
  type Provider,
  type ServiceProfileInput,
  type StoredDataType,
} from "@plyco/shared"
import { useMemo, useState, type FormEvent, type ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ProviderSelector } from "@/features/vendors/components/provider-selector"
import { useProviders } from "@/features/vendors/hooks/use-vendors"
import { useLookupOrganization } from "@/features/organizations/hooks/use-organizations"
import { useCurrentOrganizationStore } from "@/features/organizations/stores/current-organization-store"
import {
  useCountries,
  useVocabulary,
} from "@/features/vocabulary/hooks/use-vocabulary"
import {
  codeOptions,
  countryOptions,
} from "@/features/vocabulary/lib/vocabulary"
import {
  createBusinessActivity,
  createOrganization,
  createOrganizationProvider,
  saveSecurityProfile,
} from "@/lib/api"
import { authStateQueryKey, securityProfileQueryKey } from "@/lib/query-keys"
import { organizationProviderInputFromProvider } from "@/features/company/lib/profile"
import { type ProfileDraft } from "@/features/company/types/company"

type WizardStep =
  | "start"
  | "lookup"
  | "organization"
  | "service"
  | "data"
  | "activity"
  | "providers"

type WizardDraft = {
  company: CompanyProfile
  primaryService: ServiceProfileInput
  primaryDataType: StoredDataType
  primaryActivity: BusinessActivityInput
  suggestedProviderNames: string[]
  warnings: string[]
}

const stepOrder: WizardStep[] = [
  "organization",
  "service",
  "data",
  "activity",
  "providers",
]

const defaultDataType = (name: string): StoredDataType => ({
  name: "Customer account data",
  description: `Basic account and usage data handled by ${name}.`,
  subjectTypes: null,
  collectionMethods: null,
  isSensitive: null,
  isRequired: true,
})

const defaultActivity: BusinessActivityInput = {
  name: "Provide the primary service",
  purpose: "Operate the product, support users, and manage customer accounts.",
  role: "",
  legalBasis: [],
  retentionPolicy: null,
  retentionDays: 0,
}

const fallbackDraft = ({
  name,
  website,
  warnings = [],
}: {
  name: string
  website: string
  warnings?: string[]
}): WizardDraft => ({
  company: {
    ...emptyCompanyProfile,
    companyName: name,
    legalEntityName: name,
    website,
  },
  primaryService: {
    ...emptyServiceProfile,
    serviceName: name,
    serviceDescription: "",
    serviceUrl: website,
  },
  primaryDataType: defaultDataType(name),
  primaryActivity: defaultActivity,
  suggestedProviderNames: [],
  warnings,
})

const draftFromLookup = (
  input: { name: string; website: string },
  result: OrganizationLookupResult
): WizardDraft => ({
  company: {
    ...emptyCompanyProfile,
    ...result.company,
    companyName: result.company.companyName || input.name,
    legalEntityName: result.company.legalEntityName || input.name,
    website: result.company.website || input.website,
  },
  primaryService: {
    ...emptyServiceProfile,
    ...result.primaryService,
    serviceName: result.primaryService.serviceName || input.name,
    serviceUrl: result.primaryService.serviceUrl || input.website,
  },
  primaryDataType: result.primaryDataType.name
    ? result.primaryDataType
    : defaultDataType(input.name),
  primaryActivity: result.primaryActivity.name
    ? result.primaryActivity
    : defaultActivity,
  suggestedProviderNames: result.suggestedProviders.map(
    (provider) => provider.name
  ),
  warnings: result.warnings,
})

const toProfileDraft = (
  draft: WizardDraft,
  businessActivityId: string
): ProfileDraft => ({
  company: draft.company,
  services: [
    {
      ...draft.primaryService,
      businessActivityIds: [businessActivityId],
    },
  ],
  privacy: emptyPrivacyProfile,
  infrastructure: emptyInfrastructureProfile,
  dataHandling: {
    dataTypesStored: [draft.primaryDataType],
  },
  access: emptyAccessProfile,
})

const normalizeUrl = (value: string) => {
  const trimmed = value.trim()

  if (!trimmed) {
    return trimmed
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

const stepNumber = (step: WizardStep) => {
  const index = stepOrder.indexOf(step)

  return index >= 0 ? index + 1 : 0
}

const CreateShell = ({
  actions,
  children,
  eyebrow,
  step,
  title,
}: {
  actions: ReactNode
  children: ReactNode
  eyebrow: string
  step: WizardStep
  title: string
}) => (
  <main className="grid min-h-svh bg-slate-50 text-slate-900 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
    <section className="flex min-h-svh flex-col px-4 py-6 sm:px-8 lg:px-10">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-md bg-blue-50 text-blue-700">
            <Building2 className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-700">plyco</p>
            <p className="text-xs text-slate-500">Organization setup</p>
          </div>
        </div>
        {actions}
      </header>
      <div className="flex flex-1 items-center py-10">
        <section className="w-full max-w-2xl">
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-500">
              {stepNumber(step) > 0 ? `${stepNumber(step)}/5 · ` : ""}
              {eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {title}
            </h1>
          </div>
          {children}
        </section>
      </div>
    </section>
    <aside className="relative hidden min-h-svh overflow-hidden border-l border-slate-200 bg-slate-950 lg:block">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(37,99,235,0.35),transparent_34%),radial-gradient(circle_at_78%_70%,rgba(15,118,110,0.28),transparent_30%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.10)_1px,transparent_1px)] bg-[length:34px_34px] opacity-20" />
      <div className="relative flex h-full items-end p-12">
        <div className="max-w-md text-white">
          <p className="text-sm font-medium text-blue-200">
            Compliance readiness starts with context.
          </p>
          <p className="mt-3 text-3xl font-semibold leading-tight">
            We use your public website to prefill what we can, then leave every
            answer editable.
          </p>
        </div>
      </div>
    </aside>
  </main>
)

const TextInput = ({
  label,
  value,
  helperText,
  placeholder,
  required = false,
  type = "text",
  onChange,
}: {
  label: string
  value: string
  helperText?: string
  placeholder?: string
  required?: boolean
  type?: string
  onChange: (value: string) => void
}) => (
  <label className="grid gap-2 text-sm font-medium text-slate-800">
    <span>{label}</span>
    {helperText ? (
      <span className="-mt-1 text-xs font-normal leading-5 text-slate-500">
        {helperText}
      </span>
    ) : null}
    <input
      className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
      placeholder={placeholder}
      required={required}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
)

const TextAreaInput = ({
  label,
  value,
  helperText,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  helperText?: string
  placeholder?: string
  onChange: (value: string) => void
}) => (
  <label className="grid gap-2 text-sm font-medium text-slate-800">
    <span>{label}</span>
    {helperText ? (
      <span className="-mt-1 text-xs font-normal leading-5 text-slate-500">
        {helperText}
      </span>
    ) : null}
    <textarea
      className="min-h-24 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
)

const SelectInput = ({
  label,
  value,
  options,
  placeholder = "Not set",
  onChange,
}: {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  placeholder?: string
  onChange: (value: string) => void
}) => (
  <label className="grid gap-2 text-sm font-medium text-slate-800">
    <span>{label}</span>
    <select
      className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
)

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
  const [step, setStep] = useState<WizardStep>("start")
  const [name, setName] = useState("")
  const [website, setWebsite] = useState("")
  const [draft, setDraft] = useState<WizardDraft | null>(null)
  const [selectedProviders, setSelectedProviders] = useState<Provider[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const lookupOrganization = useLookupOrganization()
  const providers = useProviders()
  const countries = useCountries()
  const vocabulary = useVocabulary(Boolean(draft))
  const queryClient = useQueryClient()
  const countrySelectOptions = countryOptions(countries.data ?? [])
  const regionOptions = codeOptions(vocabulary.data, "regions")
  const regionSelectOptions =
    regionOptions.length > 0
      ? regionOptions
      : [
          { value: "us", label: "United States" },
          { value: "eu", label: "European Union" },
          { value: "uk", label: "United Kingdom" },
          { value: "apac", label: "Asia-Pacific" },
        ]
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
  const suggestedProviderText = useMemo(
    () =>
      draft?.suggestedProviderNames.length
        ? `Suggested from lookup: ${draft.suggestedProviderNames.join(", ")}`
        : null,
    [draft]
  )

  const updateDraft = (updater: (current: WizardDraft) => WizardDraft) => {
    setDraft((current) => (current ? updater(current) : current))
  }

  const goNext = () => {
    const index = stepOrder.indexOf(step)

    if (index >= 0 && index < stepOrder.length - 1) {
      setStep(stepOrder[index + 1])
    }
  }

  const goBack = () => {
    const index = stepOrder.indexOf(step)

    if (index > 0) {
      setStep(stepOrder[index - 1])
    } else {
      setStep("start")
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
        setStep("organization")
      },
      onError: (error) => {
        setDraft(
          fallbackDraft({
            ...parsed.data,
            warnings: [
              error.message ||
                "Could not pull details from the website. Continue manually.",
            ],
          })
        )
        setStep("organization")
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

      await Promise.all(
        selectedProviders.map((provider) =>
          createOrganizationProvider(
            organization.id,
            organizationProviderInputFromProvider(provider)
          )
        )
      )

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
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex size-11 items-center justify-center rounded-md bg-blue-50 text-blue-700">
              <Loader2 className="size-5 animate-spin" />
            </div>
            <div>
              <p className="font-medium text-slate-950">
                Reading public pages and policy links.
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                We are looking for company details, a primary service, common
                data categories, policy links, and providers. You can edit every
                field before anything is saved.
              </p>
            </div>
          </div>
        </div>
      </CreateShell>
    )
  }

  if (step === "start" || !draft) {
    return (
      <CreateShell
        actions={actions}
        eyebrow="Start"
        step={step}
        title="Create an organization"
      >
        <form
          className="grid gap-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
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
            label="Website URL"
            helperText="We use this to prefill setup from public pages and policy links."
            placeholder="https://acme.example"
            required
            type="url"
            value={website}
            onChange={setWebsite}
          />
          {submitError ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
              {submitError}
            </p>
          ) : null}
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-5">
            <p className="text-sm text-slate-500">Signed in as {user.email}</p>
            <Button disabled={lookupOrganization.isPending} type="submit">
              {lookupOrganization.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Sparkles />
              )}
              Pull details
            </Button>
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
      {step === "providers" ? (
        <Button disabled={isSubmitting} type="button" onClick={finishSetup}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Check />}
          Finish setup
        </Button>
      ) : (
        <Button type="button" onClick={goNext}>
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
        step === "organization"
          ? "Organization profile"
          : step === "service"
            ? "Primary service"
            : step === "data"
              ? "Primary data"
              : step === "activity"
                ? "Primary activity"
                : "Provider selector"
      }
      step={step}
      title={
        step === "organization"
          ? "Confirm the organization profile"
          : step === "service"
            ? "Describe the primary service"
            : step === "data"
              ? "Start with one primary data type"
              : step === "activity"
                ? "Define the primary activity"
                : "Add key providers"
      }
    >
      <section className="grid gap-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {draft.warnings.length > 0 ? (
          <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {draft.warnings[0]}
          </div>
        ) : null}

        {step === "organization" ? (
          <div className="grid gap-4 md:grid-cols-2">
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
            <SelectInput
              label="Country"
              options={countrySelectOptions}
              value={draft.company.country ?? ""}
              onChange={(value) =>
                updateDraft((current) => ({
                  ...current,
                  company: { ...current.company, country: value || null },
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
            <TextInput
              label="Address"
              value={draft.company.address ?? ""}
              onChange={(value) =>
                updateDraft((current) => ({
                  ...current,
                  company: { ...current.company, address: value },
                }))
              }
            />
          </div>
        ) : null}

        {step === "service" ? (
          <div className="grid gap-4">
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
            <TextAreaInput
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
            <SelectInput
              label="Primary hosting region"
              options={regionSelectOptions}
              value={draft.primaryService.privacy.primaryHostingRegion ?? ""}
              onChange={(value) =>
                updateDraft((current) => ({
                  ...current,
                  primaryService: {
                    ...current.primaryService,
                    privacy: {
                      ...current.primaryService.privacy,
                      primaryHostingRegion: value || null,
                    },
                  },
                }))
              }
            />
          </div>
        ) : null}

        {step === "data" ? (
          <div className="grid gap-4">
            <p className="text-sm leading-6 text-slate-500">
              Add the primary data type now. You can add more detailed data
              categories later from the data handling workspace.
            </p>
            <TextInput
              label="Data type name"
              required
              value={draft.primaryDataType.name}
              onChange={(value) =>
                updateDraft((current) => ({
                  ...current,
                  primaryDataType: {
                    ...current.primaryDataType,
                    name: value,
                  },
                }))
              }
            />
            <TextAreaInput
              label="Description"
              value={draft.primaryDataType.description ?? ""}
              onChange={(value) =>
                updateDraft((current) => ({
                  ...current,
                  primaryDataType: {
                    ...current.primaryDataType,
                    description: value,
                  },
                }))
              }
            />
          </div>
        ) : null}

        {step === "activity" ? (
          <div className="grid gap-4">
            <TextInput
              label="Activity name"
              required
              value={draft.primaryActivity.name}
              onChange={(value) =>
                updateDraft((current) => ({
                  ...current,
                  primaryActivity: {
                    ...current.primaryActivity,
                    name: value,
                  },
                }))
              }
            />
            <TextAreaInput
              label="Purpose"
              value={draft.primaryActivity.purpose}
              onChange={(value) =>
                updateDraft((current) => ({
                  ...current,
                  primaryActivity: {
                    ...current.primaryActivity,
                    purpose: value,
                  },
                }))
              }
            />
          </div>
        ) : null}

        {step === "providers" ? (
          <div className="grid gap-4">
            {suggestedProviderText ? (
              <p className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">
                {suggestedProviderText}
              </p>
            ) : null}
            {selectedProviders.length > 0 ? (
              <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
                {selectedProviders.length} provider
                {selectedProviders.length === 1 ? "" : "s"} selected.
              </p>
            ) : null}
            <ProviderSelector
              error={providers.error?.message ?? null}
              isLoading={providers.isLoading}
              providers={providers.data ?? []}
              submitDisabled={isSubmitting}
              onCancel={goBack}
              onChooseOther={() =>
                toast.info("Custom providers can be added after setup.")
              }
              onChooseProviders={setSelectedProviders}
            />
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
