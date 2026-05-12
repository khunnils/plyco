import {
  Activity,
  Building2,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Database,
  KeyRound,
  Loader2,
  Save,
  ShieldCheck,
} from "lucide-react"
import { type VendorInput } from "@complyflow/shared"

import { Button } from "@/components/ui/button"
import { emptyVendorDraft, toVendorInput } from "@/lib/profile"
import {
  ProfileAccessFields,
  ProfileCompanyFields,
  ProfileDataHandlingFields,
  ProfileForm,
  ProfileInfrastructureFields,
} from "@/components/security/profile-form"
import { Section } from "@/components/security/section"
import { SummaryTiles } from "@/components/security/summary-tiles"
import { VendorForm } from "@/components/security/vendor-form"
import { VendorList } from "@/components/security/vendor-list"
import { useSecurityUiStore } from "@/stores/security-ui-store"
import { type MutationState, type ProfileDraft } from "@/types/security-profile"

const wizardSteps = [
  { label: "Company", icon: Building2 },
  { label: "Infrastructure", icon: Cloud },
  { label: "Data", icon: Database },
  { label: "Access", icon: KeyRound },
  { label: "Vendors", icon: Activity },
  { label: "Review", icon: ShieldCheck },
]

export const Onboarding = ({
  defaultValues,
  error,
  saveState,
  onSave,
}: {
  defaultValues: ProfileDraft
  error: string | null
  saveState: MutationState
  onSave: (profile: ProfileDraft, vendors: VendorInput[]) => void
}) => {
  const {
    addOnboardingVendor,
    editingVendorId,
    onboardingStep,
    onboardingVendors,
    removeOnboardingVendor,
    setOnboardingStep,
    startEditingVendor,
    updateOnboardingVendor,
  } = useSecurityUiStore()
  const editingVendor = onboardingVendors.find(
    (vendor) => vendor.id === editingVendorId
  )

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
                    index === onboardingStep
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                  key={item.label}
                  type="button"
                  onClick={() => setOnboardingStep(index)}
                >
                  <Icon className="size-4" />
                  {item.label}
                </button>
              )
            })}
          </nav>
        </aside>

        <ProfileForm
          defaultValues={defaultValues}
          onSubmit={(profile) =>
            onSave(profile, onboardingVendors.map(toVendorInput))
          }
        >
          {(form) => (
            <>
              {onboardingStep === 0 && (
                <Section
                  description="Basic context for security reviews and future policy generation."
                  title="Company profile"
                >
                  <ProfileCompanyFields form={form} />
                </Section>
              )}
              {onboardingStep === 1 && (
                <Section
                  description="The systems and operating practices that shape your baseline posture."
                  title="Infrastructure profile"
                >
                  <ProfileInfrastructureFields form={form} />
                </Section>
              )}
              {onboardingStep === 2 && (
                <Section
                  description="A practical overview of the data you store and how it is protected."
                  title="Data handling"
                >
                  <ProfileDataHandlingFields form={form} />
                </Section>
              )}
              {onboardingStep === 3 && (
                <Section
                  description="How people get access, keep access, and lose access."
                  title="Access controls"
                >
                  <ProfileAccessFields form={form} />
                </Section>
              )}
              {onboardingStep === 4 && (
                <Section
                  description="Track critical subprocessors before customers ask."
                  title="Vendor inventory"
                >
                  <VendorForm
                    defaultValues={
                      editingVendor
                        ? toVendorInput(editingVendor)
                        : emptyVendorDraft
                    }
                    submitLabel={editingVendor ? "Update vendor" : "Add vendor"}
                    onSubmit={(vendor) => {
                      if (editingVendor) {
                        updateOnboardingVendor(editingVendor.id, vendor)
                      } else {
                        addOnboardingVendor(vendor)
                      }
                    }}
                  />
                  <VendorList
                    vendors={onboardingVendors}
                    onDelete={(vendor) => removeOnboardingVendor(vendor.id)}
                    onEdit={(vendor) => startEditingVendor(vendor.id)}
                  />
                </Section>
              )}
              {onboardingStep === 5 && (
                <Section
                  description="Save this as the source-of-truth security profile."
                  title="Review and save"
                >
                  <SummaryTiles
                    profile={form.watch()}
                    vendors={onboardingVendors}
                  />
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    <p className="font-medium text-slate-900">
                      {form.watch("company.companyName") || "Unnamed company"}
                    </p>
                    <p className="mt-1">
                      {form.watch("company.employeeCount")} employees ·{" "}
                      {form.watch("company.complianceGoals").join(", ") ||
                        "No goals listed"}
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
                    type="submit"
                  >
                    {saveState === "loading" ? <Loader2 /> : <Save />}
                    Save profile
                  </Button>
                </Section>
              )}

              <div className="flex items-center justify-between">
                <Button
                  disabled={onboardingStep === 0}
                  type="button"
                  variant="outline"
                  onClick={() => setOnboardingStep(onboardingStep - 1)}
                >
                  <ChevronLeft />
                  Back
                </Button>
                <Button
                  disabled={onboardingStep === wizardSteps.length - 1}
                  type="button"
                  onClick={() => setOnboardingStep(onboardingStep + 1)}
                >
                  Next
                  <ChevronRight />
                </Button>
              </div>
            </>
          )}
        </ProfileForm>
      </div>
    </main>
  )
}
