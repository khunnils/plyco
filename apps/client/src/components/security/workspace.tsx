import { Check, Loader2, Save } from "lucide-react"
import { type Vendor, type VendorInput } from "@complyflow/shared"

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

export const Workspace = ({
  defaultValues,
  vendors,
  error,
  saveState,
  onSaveProfile,
  onCreateVendor,
  onUpdateVendor,
  onDeleteVendor,
}: {
  defaultValues: ProfileDraft
  vendors: Vendor[]
  error: string | null
  saveState: MutationState
  onSaveProfile: (profile: ProfileDraft) => void
  onCreateVendor: (vendor: VendorInput) => void
  onUpdateVendor: (id: string, vendor: VendorInput) => void
  onDeleteVendor: (vendor: Vendor) => void
}) => {
  const { editingVendorId, startEditingVendor } = useSecurityUiStore()
  const editingVendor = vendors.find((vendor) => vendor.id === editingVendorId)

  return (
    <main className="min-h-svh bg-slate-50 px-4 py-6 text-slate-900 md:px-8">
      <div className="mx-auto grid max-w-6xl gap-6">
        <ProfileForm defaultValues={defaultValues} onSubmit={onSaveProfile}>
          {(form) => (
            <>
              <header className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
                <div>
                  <p className="text-sm font-semibold text-blue-700">
                    ComplyFlow
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold text-slate-950">
                    {form.watch("company.companyName") ||
                      "Security program snapshot"}
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Single source-of-truth for basic posture, data handling,
                    access, and vendors.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {saveState === "saved" && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-sm font-medium text-green-800">
                      <Check className="size-4" />
                      Saved
                    </span>
                  )}
                  <Button disabled={saveState === "loading"} type="submit">
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

              <SummaryTiles profile={form.watch()} vendors={vendors} />

              <div className="grid gap-5 xl:grid-cols-2">
                <Section
                  description="Operational context customers ask for early."
                  title="Company profile"
                >
                  <ProfileCompanyFields form={form} />
                </Section>
                <Section
                  description="The baseline systems behind the product."
                  title="Infrastructure"
                >
                  <ProfileInfrastructureFields form={form} />
                </Section>
                <Section
                  description="Data categories and protection practices."
                  title="Data handling"
                >
                  <ProfileDataHandlingFields form={form} />
                </Section>
                <Section
                  description="Access hygiene and account risk."
                  title="Access"
                >
                  <ProfileAccessFields form={form} />
                </Section>
              </div>
            </>
          )}
        </ProfileForm>

        <Section
          description="Subprocessors, DPA state, criticality, and ownership."
          title="Vendor inventory"
        >
          <VendorForm
            defaultValues={
              editingVendor ? toVendorInput(editingVendor) : emptyVendorDraft
            }
            submitLabel={editingVendor ? "Update vendor" : "Add vendor"}
            onSubmit={(vendor) => {
              if (editingVendor) {
                onUpdateVendor(editingVendor.id, vendor)
                startEditingVendor(null)
              } else {
                onCreateVendor(vendor)
              }
            }}
          />
          <VendorList
            vendors={vendors}
            onDelete={onDeleteVendor}
            onEdit={(vendor) => startEditingVendor(vendor.id)}
          />
        </Section>
      </div>
    </main>
  )
}
