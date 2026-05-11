import {
  Activity,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Database,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react"
import { useEffect, useState, type ReactNode } from "react"

import {
  emptyAccessProfile,
  emptyCompanyProfile,
  emptyDataHandlingProfile,
  emptyInfrastructureProfile,
  type AccessProfile,
  type CompanyProfile,
  type DataHandlingProfile,
  type InfrastructureProfile,
  type OrganizationSecurityProfile,
  type SecurityProgramSnapshot,
  type Vendor,
  type VendorInput,
} from "@complyflow/shared"

import { Button } from "@/components/ui/button"

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000"

type ProfileDraft = {
  company: CompanyProfile
  infrastructure: InfrastructureProfile
  dataHandling: DataHandlingProfile
  access: AccessProfile
}

type SaveState = "idle" | "loading" | "saved" | "error"

const emptyProfileDraft: ProfileDraft = {
  company: emptyCompanyProfile,
  infrastructure: emptyInfrastructureProfile,
  dataHandling: emptyDataHandlingProfile,
  access: emptyAccessProfile,
}

const emptyVendorDraft: VendorInput = {
  name: "",
  category: "",
  purpose: "",
  hasSubprocessors: false,
  dataProcessed: [],
  dpaStatus: "not_started",
  dataRegions: [],
  criticality: "medium",
  owner: "",
  notes: "",
}

const wizardSteps = [
  { label: "Company", icon: Building2 },
  { label: "Infrastructure", icon: Cloud },
  { label: "Data", icon: Database },
  { label: "Access", icon: KeyRound },
  { label: "Vendors", icon: Activity },
  { label: "Review", icon: ShieldCheck },
]

function profileFromOrganization(
  organization: OrganizationSecurityProfile | null
): ProfileDraft {
  if (!organization) {
    return emptyProfileDraft
  }

  return {
    company: organization.company,
    infrastructure: organization.infrastructure,
    dataHandling: organization.dataHandling,
    access: organization.access,
  }
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const message = body?.error?.message ?? "Request failed"
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string
  value: string | number
  onChange: (value: string) => void
  placeholder?: string
  type?: "text" | "number"
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-800">
      {label}
      <input
        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
        inputMode={type === "number" ? "numeric" : undefined}
        min={type === "number" ? 1 : undefined}
        placeholder={placeholder}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-800">
      {label}
      <textarea
        className="min-h-24 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function ListField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}) {
  return (
    <TextField
      label={label}
      placeholder={placeholder}
      value={value.join(", ")}
      onChange={(nextValue) => onChange(splitList(nextValue))}
    />
  )
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-4 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800">
      <span>{label}</span>
      <input
        className="size-4 accent-blue-600"
        checked={checked}
        type="checkbox"
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  )
}

function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (value: T) => void
  options: Array<{ value: T; label: string }>
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-800">
      {label}
      <select
        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  )
}

function CompanyFields({
  value,
  onChange,
}: {
  value: CompanyProfile
  onChange: (value: CompanyProfile) => void
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextField
        label="Company name"
        placeholder="Acme AI"
        value={value.companyName}
        onChange={(companyName) => onChange({ ...value, companyName })}
      />
      <TextField
        label="Employee count"
        type="number"
        value={value.employeeCount}
        onChange={(employeeCount) =>
          onChange({ ...value, employeeCount: Number(employeeCount) || 1 })
        }
      />
      <ListField
        label="Industries"
        placeholder="AI, SaaS, healthcare"
        value={value.industries}
        onChange={(industries) => onChange({ ...value, industries })}
      />
      <ListField
        label="Operating regions"
        placeholder="US, EU, UK"
        value={value.regions}
        onChange={(regions) => onChange({ ...value, regions })}
      />
      <ListField
        label="Compliance goals"
        placeholder="SOC 2, GDPR"
        value={value.complianceGoals}
        onChange={(complianceGoals) => onChange({ ...value, complianceGoals })}
      />
      <div className="grid gap-3">
        <ToggleField
          checked={value.handlesPii}
          label="Handles PII"
          onChange={(handlesPii) => onChange({ ...value, handlesPii })}
        />
        <ToggleField
          checked={value.handlesSensitiveData}
          label="Handles sensitive data"
          onChange={(handlesSensitiveData) =>
            onChange({ ...value, handlesSensitiveData })
          }
        />
      </div>
    </div>
  )
}

function InfrastructureFields({
  value,
  onChange,
}: {
  value: InfrastructureProfile
  onChange: (value: InfrastructureProfile) => void
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ListField
        label="Cloud providers"
        placeholder="AWS, GCP, Azure"
        value={value.cloudProviders}
        onChange={(cloudProviders) => onChange({ ...value, cloudProviders })}
      />
      <TextField
        label="Source control provider"
        placeholder="GitHub"
        value={value.sourceControlProvider ?? ""}
        onChange={(sourceControlProvider) =>
          onChange({ ...value, sourceControlProvider })
        }
      />
      <TextField
        label="Auth provider"
        placeholder="Google Workspace, Okta"
        value={value.authProvider ?? ""}
        onChange={(authProvider) => onChange({ ...value, authProvider })}
      />
      <TextField
        label="Password manager"
        placeholder="1Password"
        value={value.passwordManager ?? ""}
        onChange={(passwordManager) => onChange({ ...value, passwordManager })}
      />
      <ToggleField
        checked={value.mfaEnabled}
        label="MFA enabled"
        onChange={(mfaEnabled) => onChange({ ...value, mfaEnabled })}
      />
      <ToggleField
        checked={value.encryptedDevicesRequired}
        label="Encrypted devices required"
        onChange={(encryptedDevicesRequired) =>
          onChange({ ...value, encryptedDevicesRequired })
        }
      />
      <ToggleField
        checked={value.backupsEnabled}
        label="Backups enabled"
        onChange={(backupsEnabled) => onChange({ ...value, backupsEnabled })}
      />
      <ToggleField
        checked={value.centralizedLoggingEnabled}
        label="Centralized logging enabled"
        onChange={(centralizedLoggingEnabled) =>
          onChange({ ...value, centralizedLoggingEnabled })
        }
      />
    </div>
  )
}

function DataHandlingFields({
  value,
  onChange,
}: {
  value: DataHandlingProfile
  onChange: (value: DataHandlingProfile) => void
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ListField
        label="Data types stored"
        placeholder="customer emails, usage data"
        value={value.dataTypesStored}
        onChange={(dataTypesStored) => onChange({ ...value, dataTypesStored })}
      />
      <ToggleField
        checked={value.storesPii}
        label="Stores PII"
        onChange={(storesPii) => onChange({ ...value, storesPii })}
      />
      <ToggleField
        checked={value.storesHealthcareData}
        label="Stores healthcare data"
        onChange={(storesHealthcareData) =>
          onChange({ ...value, storesHealthcareData })
        }
      />
      <ToggleField
        checked={value.encryptionAtRest}
        label="Encryption at rest"
        onChange={(encryptionAtRest) =>
          onChange({ ...value, encryptionAtRest })
        }
      />
      <ToggleField
        checked={value.encryptionInTransit}
        label="Encryption in transit"
        onChange={(encryptionInTransit) =>
          onChange({ ...value, encryptionInTransit })
        }
      />
      <ToggleField
        checked={value.productionDataInDevelopment}
        label="Production data used in development"
        onChange={(productionDataInDevelopment) =>
          onChange({ ...value, productionDataInDevelopment })
        }
      />
      <ToggleField
        checked={value.retentionPolicyExists}
        label="Retention policy exists"
        onChange={(retentionPolicyExists) =>
          onChange({ ...value, retentionPolicyExists })
        }
      />
    </div>
  )
}

function AccessFields({
  value,
  onChange,
}: {
  value: AccessProfile
  onChange: (value: AccessProfile) => void
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ToggleField
        checked={value.mfaRequired}
        label="MFA required"
        onChange={(mfaRequired) => onChange({ ...value, mfaRequired })}
      />
      <ToggleField
        checked={value.ssoEnabled}
        label="SSO enabled"
        onChange={(ssoEnabled) => onChange({ ...value, ssoEnabled })}
      />
      <ToggleField
        checked={value.sharedAccountsExist}
        label="Shared accounts exist"
        onChange={(sharedAccountsExist) =>
          onChange({ ...value, sharedAccountsExist })
        }
      />
      <ToggleField
        checked={value.offboardingProcessExists}
        label="Offboarding process exists"
        onChange={(offboardingProcessExists) =>
          onChange({ ...value, offboardingProcessExists })
        }
      />
      <ToggleField
        checked={value.accessReviewsPerformed}
        label="Access reviews performed"
        onChange={(accessReviewsPerformed) =>
          onChange({ ...value, accessReviewsPerformed })
        }
      />
      <ToggleField
        checked={value.privilegedAccessRestricted}
        label="Privileged access restricted"
        onChange={(privilegedAccessRestricted) =>
          onChange({ ...value, privilegedAccessRestricted })
        }
      />
    </div>
  )
}

function VendorForm({
  value,
  onChange,
  onSubmit,
  submitLabel,
}: {
  value: VendorInput
  onChange: (value: VendorInput) => void
  onSubmit: () => void
  submitLabel: string
}) {
  return (
    <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Vendor name"
          placeholder="GitHub"
          value={value.name}
          onChange={(name) => onChange({ ...value, name })}
        />
        <TextField
          label="Category"
          placeholder="Source control"
          value={value.category}
          onChange={(category) => onChange({ ...value, category })}
        />
        <TextField
          label="Purpose"
          placeholder="Code hosting and reviews"
          value={value.purpose}
          onChange={(purpose) => onChange({ ...value, purpose })}
        />
        <TextField
          label="Owner"
          placeholder="Engineering"
          value={value.owner ?? ""}
          onChange={(owner) => onChange({ ...value, owner })}
        />
        <ListField
          label="Data processed"
          placeholder="source code, user emails"
          value={value.dataProcessed}
          onChange={(dataProcessed) => onChange({ ...value, dataProcessed })}
        />
        <ListField
          label="Data regions"
          placeholder="US, EU"
          value={value.dataRegions}
          onChange={(dataRegions) => onChange({ ...value, dataRegions })}
        />
        <SelectField
          label="DPA status"
          value={value.dpaStatus}
          options={[
            { value: "not_started", label: "Not started" },
            { value: "requested", label: "Requested" },
            { value: "in_review", label: "In review" },
            { value: "signed", label: "Signed" },
            { value: "not_required", label: "Not required" },
          ]}
          onChange={(dpaStatus) => onChange({ ...value, dpaStatus })}
        />
        <SelectField
          label="Criticality"
          value={value.criticality}
          options={[
            { value: "low", label: "Low" },
            { value: "medium", label: "Medium" },
            { value: "high", label: "High" },
          ]}
          onChange={(criticality) => onChange({ ...value, criticality })}
        />
      </div>
      <ToggleField
        checked={value.hasSubprocessors}
        label="Vendor uses subprocessors"
        onChange={(hasSubprocessors) =>
          onChange({ ...value, hasSubprocessors })
        }
      />
      <TextAreaField
        label="Notes"
        placeholder="Key contract, DPA, or review context"
        value={value.notes ?? ""}
        onChange={(notes) => onChange({ ...value, notes })}
      />
      <div>
        <Button type="button" onClick={onSubmit}>
          <Plus />
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}

function VendorList({
  vendors,
  onEdit,
  onDelete,
}: {
  vendors: Vendor[]
  onEdit: (vendor: Vendor) => void
  onDelete: (vendor: Vendor) => void
}) {
  if (vendors.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
        No vendors added yet.
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {vendors.map((vendor) => (
        <article
          className="rounded-lg border border-slate-200 bg-white p-4"
          key={vendor.id}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-slate-950">{vendor.name}</h3>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                  {vendor.criticality}
                </span>
                <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                  {vendor.dpaStatus.replaceAll("_", " ")}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{vendor.purpose}</p>
              <p className="mt-2 text-xs text-slate-500">
                {vendor.category} · {vendor.dataProcessed.join(", ") || "No data listed"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="icon-sm"
                type="button"
                variant="outline"
                onClick={() => onEdit(vendor)}
              >
                <Pencil />
              </Button>
              <Button
                size="icon-sm"
                type="button"
                variant="outline"
                onClick={() => onDelete(vendor)}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

function SummaryTiles({
  profile,
  vendors,
}: {
  profile: ProfileDraft
  vendors: Vendor[]
}) {
  const completeBasics = [
    profile.infrastructure.mfaEnabled,
    profile.infrastructure.encryptedDevicesRequired,
    profile.dataHandling.encryptionAtRest,
    profile.dataHandling.encryptionInTransit,
    profile.access.offboardingProcessExists,
    profile.access.privilegedAccessRestricted,
  ].filter(Boolean).length

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">Security basics</p>
        <p className="mt-2 text-2xl font-semibold text-slate-950">
          {completeBasics}/6
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">Vendors tracked</p>
        <p className="mt-2 text-2xl font-semibold text-slate-950">
          {vendors.length}
        </p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">Data handling</p>
        <p className="mt-2 text-2xl font-semibold text-slate-950">
          {profile.dataHandling.dataTypesStored.length}
        </p>
      </div>
    </div>
  )
}

function Onboarding({
  draft,
  vendors,
  saveState,
  error,
  onDraftChange,
  onVendorsChange,
  onSave,
}: {
  draft: ProfileDraft
  vendors: Vendor[]
  saveState: SaveState
  error: string | null
  onDraftChange: (draft: ProfileDraft) => void
  onVendorsChange: (vendors: Vendor[]) => void
  onSave: () => void
}) {
  const [step, setStep] = useState(0)
  const [vendorDraft, setVendorDraft] = useState<VendorInput>(emptyVendorDraft)

  const addLocalVendor = () => {
    if (!vendorDraft.name || !vendorDraft.category || !vendorDraft.purpose) {
      return
    }

    const timestamp = new Date().toISOString()
    onVendorsChange([
      ...vendors,
      {
        id: `local_${crypto.randomUUID()}`,
        ...vendorDraft,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ])
    setVendorDraft(emptyVendorDraft)
  }

  return (
    <main className="min-h-svh bg-slate-50 px-4 py-6 text-slate-900 md:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-5">
            <p className="text-sm font-semibold text-blue-700">ComplyFlow</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">
              Security snapshot
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Capture the basics once, then keep the profile current as your
              team grows.
            </p>
          </div>
          <nav className="grid gap-1">
            {wizardSteps.map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium ${
                    index === step
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                  key={item.label}
                  type="button"
                  onClick={() => setStep(index)}
                >
                  <Icon className="size-4" />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </aside>

        <div className="grid gap-5">
          {step === 0 && (
            <Section
              title="Company profile"
              description="Basic context for security reviews and future policy generation."
            >
              <CompanyFields
                value={draft.company}
                onChange={(company) => onDraftChange({ ...draft, company })}
              />
            </Section>
          )}
          {step === 1 && (
            <Section
              title="Infrastructure profile"
              description="The systems and operating practices that shape your baseline posture."
            >
              <InfrastructureFields
                value={draft.infrastructure}
                onChange={(infrastructure) =>
                  onDraftChange({ ...draft, infrastructure })
                }
              />
            </Section>
          )}
          {step === 2 && (
            <Section
              title="Data handling"
              description="A practical overview of the data you store and how it is protected."
            >
              <DataHandlingFields
                value={draft.dataHandling}
                onChange={(dataHandling) =>
                  onDraftChange({ ...draft, dataHandling })
                }
              />
            </Section>
          )}
          {step === 3 && (
            <Section
              title="Access controls"
              description="How people get access, keep access, and lose access."
            >
              <AccessFields
                value={draft.access}
                onChange={(access) => onDraftChange({ ...draft, access })}
              />
            </Section>
          )}
          {step === 4 && (
            <Section
              title="Vendor inventory"
              description="Track critical subprocessors before customers ask."
            >
              <VendorForm
                submitLabel="Add vendor"
                value={vendorDraft}
                onChange={setVendorDraft}
                onSubmit={addLocalVendor}
              />
              <VendorList
                vendors={vendors}
                onDelete={(vendor) =>
                  onVendorsChange(vendors.filter((item) => item.id !== vendor.id))
                }
                onEdit={(vendor) => {
                  setVendorDraft(vendor)
                  onVendorsChange(vendors.filter((item) => item.id !== vendor.id))
                }}
              />
            </Section>
          )}
          {step === 5 && (
            <Section
              title="Review and save"
              description="Save this as the source-of-truth security profile."
            >
              <SummaryTiles profile={draft} vendors={vendors} />
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-900">
                  {draft.company.companyName || "Unnamed company"}
                </p>
                <p className="mt-1">
                  {draft.company.employeeCount} employees ·{" "}
                  {draft.company.complianceGoals.join(", ") || "No goals listed"}
                </p>
              </div>
              {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </p>
              )}
              <Button
                className="w-fit"
                disabled={saveState === "loading"}
                type="button"
                onClick={onSave}
              >
                {saveState === "loading" ? <Loader2 /> : <Save />}
                Save profile
              </Button>
            </Section>
          )}

          <div className="flex items-center justify-between">
            <Button
              disabled={step === 0}
              type="button"
              variant="outline"
              onClick={() => setStep((currentStep) => currentStep - 1)}
            >
              <ChevronLeft />
              Back
            </Button>
            <Button
              disabled={step === wizardSteps.length - 1}
              type="button"
              onClick={() => setStep((currentStep) => currentStep + 1)}
            >
              Next
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}

function Workspace({
  draft,
  vendors,
  saveState,
  error,
  onDraftChange,
  onSaveProfile,
  onCreateVendor,
  onUpdateVendor,
  onDeleteVendor,
}: {
  draft: ProfileDraft
  vendors: Vendor[]
  saveState: SaveState
  error: string | null
  onDraftChange: (draft: ProfileDraft) => void
  onSaveProfile: () => void
  onCreateVendor: (vendor: VendorInput) => void
  onUpdateVendor: (id: string, vendor: VendorInput) => void
  onDeleteVendor: (vendor: Vendor) => void
}) {
  const [vendorDraft, setVendorDraft] = useState<VendorInput>(emptyVendorDraft)
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null)

  const submitVendor = () => {
    if (editingVendorId) {
      onUpdateVendor(editingVendorId, vendorDraft)
      setEditingVendorId(null)
    } else {
      onCreateVendor(vendorDraft)
    }
    setVendorDraft(emptyVendorDraft)
  }

  return (
    <main className="min-h-svh bg-slate-50 px-4 py-6 text-slate-900 md:px-8">
      <div className="mx-auto grid max-w-6xl gap-6">
        <header className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-blue-700">ComplyFlow</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">
              {draft.company.companyName || "Security program snapshot"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Single source-of-truth for basic posture, data handling, access,
              and vendors.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saveState === "saved" && (
              <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-sm font-medium text-green-800">
                <Check className="size-4" />
                Saved
              </span>
            )}
            <Button
              disabled={saveState === "loading"}
              type="button"
              onClick={onSaveProfile}
            >
              {saveState === "loading" ? <Loader2 /> : <Save />}
              Save changes
            </Button>
          </div>
        </header>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}

        <SummaryTiles profile={draft} vendors={vendors} />

        <div className="grid gap-5 xl:grid-cols-2">
          <Section
            title="Company profile"
            description="Operational context customers ask for early."
          >
            <CompanyFields
              value={draft.company}
              onChange={(company) => onDraftChange({ ...draft, company })}
            />
          </Section>
          <Section
            title="Infrastructure"
            description="The baseline systems behind the product."
          >
            <InfrastructureFields
              value={draft.infrastructure}
              onChange={(infrastructure) =>
                onDraftChange({ ...draft, infrastructure })
              }
            />
          </Section>
          <Section
            title="Data handling"
            description="Data categories and protection practices."
          >
            <DataHandlingFields
              value={draft.dataHandling}
              onChange={(dataHandling) =>
                onDraftChange({ ...draft, dataHandling })
              }
            />
          </Section>
          <Section title="Access" description="Access hygiene and account risk.">
            <AccessFields
              value={draft.access}
              onChange={(access) => onDraftChange({ ...draft, access })}
            />
          </Section>
        </div>

        <Section
          title="Vendor inventory"
          description="Subprocessors, DPA state, criticality, and ownership."
        >
          <VendorForm
            submitLabel={editingVendorId ? "Update vendor" : "Add vendor"}
            value={vendorDraft}
            onChange={setVendorDraft}
            onSubmit={submitVendor}
          />
          <VendorList
            vendors={vendors}
            onDelete={onDeleteVendor}
            onEdit={(vendor) => {
              setEditingVendorId(vendor.id)
              setVendorDraft(vendor)
            }}
          />
        </Section>
      </div>
    </main>
  )
}

export function App() {
  const [loading, setLoading] = useState(true)
  const [profileSaved, setProfileSaved] = useState(false)
  const [draft, setDraft] = useState<ProfileDraft>(emptyProfileDraft)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiRequest<SecurityProgramSnapshot>("/security-profile")
      .then((snapshot) => {
        setDraft(profileFromOrganization(snapshot.organization))
        setVendors(snapshot.vendors)
        setProfileSaved(Boolean(snapshot.organization))
      })
      .catch((requestError: Error) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [])

  const saveProfile = async () => {
    setSaveState("loading")
    setError(null)

    try {
      const snapshot = await apiRequest<SecurityProgramSnapshot>(
        "/security-profile",
        {
          method: "PUT",
          body: JSON.stringify(draft),
        }
      )

      const localVendorInputs = vendors
        .filter((vendor) => vendor.id.startsWith("local_"))
        .map((vendor) => ({
          name: vendor.name,
          category: vendor.category,
          purpose: vendor.purpose,
          hasSubprocessors: vendor.hasSubprocessors,
          dataProcessed: vendor.dataProcessed,
          dpaStatus: vendor.dpaStatus,
          dataRegions: vendor.dataRegions,
          criticality: vendor.criticality,
          owner: vendor.owner,
          notes: vendor.notes,
        }))

      const persistedVendors = await Promise.all(
        localVendorInputs.map((vendor) =>
            apiRequest<Vendor>("/vendors", {
              method: "POST",
              body: JSON.stringify(vendor),
            })
        )
      )

      setDraft(profileFromOrganization(snapshot.organization))
      setVendors([
        ...snapshot.vendors.filter((vendor) => !vendor.id.startsWith("local_")),
        ...persistedVendors,
      ])
      setProfileSaved(true)
      setSaveState("saved")
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save profile"
      )
      setSaveState("error")
    }
  }

  const createVendor = async (vendor: VendorInput) => {
    setSaveState("loading")
    setError(null)

    try {
      const createdVendor = await apiRequest<Vendor>("/vendors", {
        method: "POST",
        body: JSON.stringify(vendor),
      })
      setVendors((currentVendors) => [...currentVendors, createdVendor])
      setSaveState("saved")
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to add vendor"
      )
      setSaveState("error")
    }
  }

  const updateVendor = async (id: string, vendor: VendorInput) => {
    setSaveState("loading")
    setError(null)

    try {
      const updatedVendor = await apiRequest<Vendor>(`/vendors/${id}`, {
        method: "PUT",
        body: JSON.stringify(vendor),
      })
      setVendors((currentVendors) =>
        currentVendors.map((currentVendor) =>
          currentVendor.id === id ? updatedVendor : currentVendor
        )
      )
      setSaveState("saved")
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update vendor"
      )
      setSaveState("error")
    }
  }

  const deleteVendor = async (vendor: Vendor) => {
    setSaveState("loading")
    setError(null)

    if (vendor.id.startsWith("local_")) {
      setVendors((currentVendors) =>
        currentVendors.filter((currentVendor) => currentVendor.id !== vendor.id)
      )
      setSaveState("idle")
      return
    }

    try {
      await apiRequest<void>(`/vendors/${vendor.id}`, { method: "DELETE" })
      setVendors((currentVendors) =>
        currentVendors.filter((currentVendor) => currentVendor.id !== vendor.id)
      )
      setSaveState("saved")
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete vendor"
      )
      setSaveState("error")
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-slate-50 text-slate-600">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Loading security profile
        </div>
      </main>
    )
  }

  if (!profileSaved) {
    return (
      <Onboarding
        draft={draft}
        error={error}
        saveState={saveState}
        vendors={vendors}
        onDraftChange={setDraft}
        onSave={saveProfile}
        onVendorsChange={setVendors}
      />
    )
  }

  return (
    <Workspace
      draft={draft}
      error={error}
      saveState={saveState}
      vendors={vendors}
      onCreateVendor={createVendor}
      onDeleteVendor={deleteVendor}
      onDraftChange={setDraft}
      onSaveProfile={saveProfile}
      onUpdateVendor={updateVendor}
    />
  )
}

export default App
