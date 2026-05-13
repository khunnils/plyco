import {
  Building2,
  Check,
  LayoutDashboard,
  Loader2,
  Plus,
  Save,
  Users,
  X,
} from "lucide-react"
import {
  type Provider,
  type Vendor,
  type VendorInput,
} from "@complyflow/shared"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  dataTypeOptionsFromProfile,
  emptyVendorDraft,
  toVendorInput,
  vendorInputFromProvider,
} from "@/lib/profile"
import {
  ProfileAccessFields,
  ProfileCompanyFields,
  ProfileDataHandlingFields,
  ProfileForm,
  type ProfileFormReturn,
  ProfileInfrastructureFields,
} from "@/components/security/profile-form"
import { ProviderSelector } from "@/components/security/provider-selector"
import { Section } from "@/components/security/section"
import { SummaryTiles } from "@/components/security/summary-tiles"
import { VendorEmptyState } from "@/components/security/vendor-empty-state"
import { VendorForm } from "@/components/security/vendor-form"
import { VendorList } from "@/components/security/vendor-list"
import { useSecurityUiStore } from "@/stores/security-ui-store"
import { type MutationState, type ProfileDraft } from "@/types/security-profile"

type CompanySectionId = "company" | "infrastructure" | "dataHandling" | "access"

const companySections: Array<{
  id: CompanySectionId
  title: string
  description: string
}> = [
  {
    id: "company",
    title: "Company",
    description: "Operational context customers ask for early.",
  },
  {
    id: "infrastructure",
    title: "Infrastructure",
    description: "The baseline systems behind the product.",
  },
  {
    id: "dataHandling",
    title: "Data",
    description: "Data categories and protection practices.",
  },
  {
    id: "access",
    title: "Access",
    description: "Access hygiene and account risk.",
  },
]

const valueList = (values: string[]) =>
  values.length > 0 ? values.join(", ") : "Not set"

const dataTypeList = (
  values: ProfileDraft["dataHandling"]["dataTypesStored"]
) =>
  values.length > 0
    ? values
        .map((value) =>
          value.description ? `${value.name}: ${value.description}` : value.name
        )
        .join(", ")
    : "Not set"

const boolText = (value: boolean) => (value ? "Yes" : "No")

const DetailGrid = ({ rows }: { rows: Array<[string, string | number]> }) => (
  <dl className="grid gap-3 sm:grid-cols-2">
    {rows.map(([label, value]) => (
      <div
        className="rounded-md border border-slate-200 bg-slate-50 p-3"
        key={label}
      >
        <dt className="text-xs font-medium text-slate-500">{label}</dt>
        <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
      </div>
    ))}
  </dl>
)

const CompanySectionFields = ({
  form,
  section,
}: {
  form: ProfileFormReturn
  section: CompanySectionId
}) => {
  if (section === "company") {
    return <ProfileCompanyFields form={form} />
  }

  if (section === "infrastructure") {
    return <ProfileInfrastructureFields form={form} />
  }

  if (section === "dataHandling") {
    return <ProfileDataHandlingFields form={form} />
  }

  return <ProfileAccessFields form={form} />
}

const CompanyReadOnlySection = ({
  profile,
  section,
  onEdit,
}: {
  profile: ProfileDraft
  section: CompanySectionId
  onEdit: () => void
}) => {
  const rowsBySection: Record<
    CompanySectionId,
    Array<[string, string | number]>
  > = {
    company: [
      ["Company name", profile.company.companyName || "Not set"],
      ["Employees", profile.company.employeeCount],
      ["Industries", valueList(profile.company.industries)],
      ["Regions", valueList(profile.company.regions)],
      ["Compliance goals", valueList(profile.company.complianceGoals)],
      ["Handles PII", boolText(profile.company.handlesPii)],
      ["Sensitive data", boolText(profile.company.handlesSensitiveData)],
    ],
    infrastructure: [
      ["Cloud providers", valueList(profile.infrastructure.cloudProviders)],
      [
        "Source control",
        profile.infrastructure.sourceControlProvider || "Not set",
      ],
      ["Auth provider", profile.infrastructure.authProvider || "Not set"],
      ["Password manager", profile.infrastructure.passwordManager || "Not set"],
      ["MFA enabled", boolText(profile.infrastructure.mfaEnabled)],
      [
        "Encrypted devices",
        boolText(profile.infrastructure.encryptedDevicesRequired),
      ],
      ["Backups", boolText(profile.infrastructure.backupsEnabled)],
      [
        "Centralized logging",
        boolText(profile.infrastructure.centralizedLoggingEnabled),
      ],
    ],
    dataHandling: [
      ["Data types", dataTypeList(profile.dataHandling.dataTypesStored)],
      ["Stores PII", boolText(profile.dataHandling.storesPii)],
      ["Healthcare data", boolText(profile.dataHandling.storesHealthcareData)],
      ["Encryption at rest", boolText(profile.dataHandling.encryptionAtRest)],
      [
        "Encryption in transit",
        boolText(profile.dataHandling.encryptionInTransit),
      ],
      [
        "Production data in development",
        boolText(profile.dataHandling.productionDataInDevelopment),
      ],
      [
        "Retention policy",
        boolText(profile.dataHandling.retentionPolicyExists),
      ],
    ],
    access: [
      ["MFA required", boolText(profile.access.mfaRequired)],
      ["SSO enabled", boolText(profile.access.ssoEnabled)],
      ["Shared accounts", boolText(profile.access.sharedAccountsExist)],
      ["Offboarding", boolText(profile.access.offboardingProcessExists)],
      ["Access reviews", boolText(profile.access.accessReviewsPerformed)],
      [
        "Privileged access restricted",
        boolText(profile.access.privilegedAccessRestricted),
      ],
    ],
  }

  return (
    <div className="grid gap-4">
      <DetailGrid rows={rowsBySection[section]} />
      <Button
        className="w-fit"
        type="button"
        variant="outline"
        onClick={onEdit}
      >
        Edit
      </Button>
    </div>
  )
}

export const Workspace = ({
  defaultValues,
  vendors,
  providers,
  providersError,
  providersLoading,
  error,
  saveState,
  onSaveProfile,
  onCreateVendor,
  onUpdateVendor,
  onDeleteVendor,
}: {
  defaultValues: ProfileDraft
  vendors: Vendor[]
  providers: Provider[]
  providersError: string | null
  providersLoading: boolean
  error: string | null
  saveState: MutationState
  onSaveProfile: (profile: ProfileDraft) => void
  onCreateVendor: (vendor: VendorInput) => void
  onUpdateVendor: (id: string, vendor: VendorInput) => void
  onDeleteVendor: (vendor: Vendor) => void
}) => {
  const [showVendorCatalog, setShowVendorCatalog] = useState(false)
  const [showCustomVendorForm, setShowCustomVendorForm] = useState(false)
  const {
    activeWorkspaceView,
    editingCompanySection,
    editingVendorId,
    setActiveWorkspaceView,
    setEditingCompanySection,
    startEditingVendor,
  } = useSecurityUiStore()
  const editingVendor = vendors.find((vendor) => vendor.id === editingVendorId)
  const dataTypeOptions = dataTypeOptionsFromProfile(
    defaultValues.dataHandling.dataTypesStored
  )

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <p className="text-sm font-semibold text-blue-700">ComplyFlow</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">
            {defaultValues.company.companyName || "Security workspace"}
          </p>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuButton
              active={activeWorkspaceView === "dashboard"}
              onClick={() => setActiveWorkspaceView("dashboard")}
            >
              <LayoutDashboard className="size-4" />
              Dashboard
            </SidebarMenuButton>
            <SidebarMenuButton
              active={activeWorkspaceView === "company"}
              onClick={() => setActiveWorkspaceView("company")}
            >
              <Building2 className="size-4" />
              Company
            </SidebarMenuButton>
            <SidebarMenuButton
              active={activeWorkspaceView === "vendors"}
              onClick={() => setActiveWorkspaceView("vendors")}
            >
              <Users className="size-4" />
              Vendors
            </SidebarMenuButton>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            <div className="flex size-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              {defaultValues.company.companyName.slice(0, 1).toUpperCase() ||
                "U"}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                Workspace user
              </p>
              <p className="text-xs text-slate-500">Founder</p>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <main className="grid gap-6 px-4 py-6 md:px-8">
          <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold text-blue-700">
                {activeWorkspaceView === "dashboard"
                  ? "Dashboard"
                  : activeWorkspaceView === "company"
                    ? "Company"
                    : "Vendors"}
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-950">
                {activeWorkspaceView === "dashboard"
                  ? "Security readiness dashboard"
                  : activeWorkspaceView === "company"
                    ? "Company profile"
                    : "Vendor inventory"}
              </h1>
            </div>
            {saveState === "saved" && (
              <span className="inline-flex w-fit items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-sm font-medium text-green-800">
                <Check className="size-4" />
                Saved
              </span>
            )}
          </header>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          )}

          {activeWorkspaceView === "dashboard" && (
            <>
              <SummaryTiles profile={defaultValues} vendors={vendors} />
              <Section
                description="Current source-of-truth posture captured during onboarding."
                title="Snapshot"
              >
                <CompanyReadOnlySection
                  profile={defaultValues}
                  section="company"
                  onEdit={() => {
                    setActiveWorkspaceView("company")
                    setEditingCompanySection("company")
                  }}
                />
              </Section>
            </>
          )}

          {activeWorkspaceView === "company" && (
            <div className="grid gap-5">
              {companySections.map((section) => (
                <Section
                  description={section.description}
                  key={section.id}
                  title={section.title}
                >
                  {editingCompanySection === section.id ? (
                    <ProfileForm
                      defaultValues={defaultValues}
                      onSubmit={(profile) => {
                        onSaveProfile(profile)
                        setEditingCompanySection(null)
                      }}
                    >
                      {(form) => (
                        <>
                          <CompanySectionFields
                            form={form}
                            section={section.id}
                          />
                          <div className="flex gap-2">
                            <Button
                              disabled={saveState === "loading"}
                              type="submit"
                            >
                              {saveState === "loading" ? <Loader2 /> : <Save />}
                              Save section
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setEditingCompanySection(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </>
                      )}
                    </ProfileForm>
                  ) : (
                    <CompanyReadOnlySection
                      profile={defaultValues}
                      section={section.id}
                      onEdit={() => setEditingCompanySection(section.id)}
                    />
                  )}
                </Section>
              ))}
            </div>
          )}

          {activeWorkspaceView === "vendors" && (
            <Section
              description="Review organization vendors or add common providers from the catalog."
              title="Vendors"
            >
              {showVendorCatalog ? (
                <div className="grid gap-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-950">
                        Add from catalog
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Filter by category, then choose a provider to add it to
                        the organization inventory.
                      </p>
                    </div>
                    <Button
                      className="w-fit"
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowVendorCatalog(false)
                        setShowCustomVendorForm(false)
                      }}
                    >
                      <X />
                      Cancel
                    </Button>
                  </div>
                  <ProviderSelector
                    error={providersError}
                    isLoading={providersLoading}
                    providers={providers}
                    onChooseOther={() => {
                      startEditingVendor(null)
                      setShowVendorCatalog(false)
                      setShowCustomVendorForm(true)
                    }}
                    onChooseProvider={(provider) => {
                      onCreateVendor(vendorInputFromProvider(provider))
                      setShowVendorCatalog(false)
                      setShowCustomVendorForm(false)
                    }}
                  />
                </div>
              ) : null}
              {(showCustomVendorForm || editingVendor) && (
                <VendorForm
                  dataTypeOptions={dataTypeOptions}
                  defaultValues={
                    editingVendor
                      ? toVendorInput(editingVendor)
                      : emptyVendorDraft
                  }
                  submitLabel={editingVendor ? "Update vendor" : "Add vendor"}
                  onSubmit={(vendor) => {
                    if (editingVendor) {
                      onUpdateVendor(editingVendor.id, vendor)
                      startEditingVendor(null)
                    } else {
                      onCreateVendor(vendor)
                    }

                    setShowVendorCatalog(false)
                    setShowCustomVendorForm(false)
                  }}
                />
              )}
              {!showVendorCatalog && !showCustomVendorForm && !editingVendor ? (
                vendors.length > 0 ? (
                  <div className="grid gap-4">
                    <Button
                      className="w-fit"
                      type="button"
                      onClick={() => {
                        startEditingVendor(null)
                        setShowVendorCatalog(true)
                      }}
                    >
                      <Plus />
                      Add vendor
                    </Button>
                    <VendorList
                      vendors={vendors}
                      onDelete={onDeleteVendor}
                      onEdit={(vendor) => {
                        startEditingVendor(vendor.id)
                        setShowCustomVendorForm(true)
                      }}
                    />
                  </div>
                ) : (
                  <VendorEmptyState
                    onAdd={() => {
                      startEditingVendor(null)
                      setShowVendorCatalog(true)
                    }}
                  />
                )
              ) : null}
            </Section>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
