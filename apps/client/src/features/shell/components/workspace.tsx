import {
  Building2,
  Database,
  Download,
  Eye,
  FileText,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Save,
  ScrollText,
  Server,
  Trash2,
  Tags,
  Users,
  X,
} from "lucide-react"
import {
  type DocumentSummary,
  type AuthUser,
  type Provider,
  type ProviderSystemType,
  type TemplateCatalog,
  type Vocabulary,
  type Country,
} from "@complyflow/shared"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { DocumentContent } from "@/features/documents/components/document-content"
import { documentStatusLabel } from "@/features/documents/lib/document-status"
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
  profileFromOrganization,
  toVendorInput,
  vendorInputFromProvider,
} from "@/features/security-profile/lib/profile"
import {
  ProfileAccessFields,
  ProfileCompanyFields,
  ProfileDataHandlingFields,
  ProfileForm,
  type ProfileFormReturn,
  ProfileInfrastructureFields,
} from "@/features/security-profile/components/profile-form"
import { useCreateDocument, useDocument, useDocuments, useDownloadDocumentPdf } from "@/features/documents/hooks/use-documents"
import { useLogout } from "@/features/auth/hooks/use-auth"
import { OrganizationSwitcher } from "@/features/organizations/components/organization-switcher"
import {
  useSaveSecurityProfile,
  useSecurityProfile,
} from "@/features/security-profile/hooks/use-security-profile"
import {
  useCreateTemplateFromSystem,
  useDeleteTemplate,
  useTemplates,
  useUpdateTemplate,
} from "@/features/templates/hooks/use-templates"
import {
  useCreateVendor,
  useDeleteVendor,
  useProviders,
  useUpdateVendor,
} from "@/features/vendors/hooks/use-vendors"
import { Section } from "@/features/shell/components/section"
import { SummaryTiles } from "@/features/security-profile/components/summary-tiles"
import { VendorEmptyState } from "@/features/vendors/components/vendor-empty-state"
import { VendorForm } from "@/features/vendors/components/vendor-form"
import { VendorList } from "@/features/vendors/components/vendor-list"
import { ProviderSelector } from "@/features/vendors/components/provider-selector"
import { useSecurityUiStore } from "@/features/shell/stores/security-ui-store"
import { type ProfileDraft } from "@/features/security-profile/types/security-profile"
import { TemplateCard } from "@/features/templates/components/template-card"
import { TemplateForm } from "@/features/templates/components/template-form"
import {
  useCountries,
  useCreateVocabularyCode,
  useDeleteVocabularyCode,
  useUpdateVocabularyCode,
  useVocabulary,
} from "@/features/vocabulary/hooks/use-vocabulary"
import {
  codeLabel,
  codeOptions,
  countryLabel,
  countryOptions,
} from "@/features/vocabulary/lib/vocabulary"
import { VocabularyManager } from "@/features/vocabulary/components/vocabulary-manager"

type CompanySectionId = "profile" | "infrastructure" | "dataHandling" | "access"
type WorkspaceView =
  | "dashboard"
  | "companyProfile"
  | "companyInfrastructure"
  | "companyData"
  | "companyAccess"
  | "templates"
  | "documents"
  | "vendors"
  | "vocabulary"

const companySections: Array<{
  id: CompanySectionId
  view: WorkspaceView
  title: string
  description: string
  icon: typeof Building2
}> = [
  {
    id: "profile",
    view: "companyProfile",
    title: "Profile",
    description: "Operational context customers ask for early.",
    icon: Building2,
  },
  {
    id: "infrastructure",
    view: "companyInfrastructure",
    title: "Infrastructure",
    description: "The baseline systems behind the product.",
    icon: Server,
  },
  {
    id: "dataHandling",
    view: "companyData",
    title: "Data",
    description: "Data categories and protection practices.",
    icon: Database,
  },
  {
    id: "access",
    view: "companyAccess",
    title: "Access",
    description: "Access hygiene and account risk.",
    icon: KeyRound,
  },
]

const companySectionByView = new Map(
  companySections.map((section) => [section.view, section])
)

const isCompanyView = (
  view: WorkspaceView
): view is
  | "companyProfile"
  | "companyInfrastructure"
  | "companyData"
  | "companyAccess" => companySectionByView.has(view)

const valueList = (values: string[]) =>
  values.length > 0 ? values.join(", ") : "Not set"

const codeValueList = (
  vocabulary: Vocabulary | undefined,
  codeSetId: string,
  values: string[],
) =>
  values.length > 0
    ? values.map((value) => codeLabel(vocabulary, codeSetId, value)).join(", ")
    : "Not set"

const providerNamesForSystem = (
  profile: ProfileDraft,
  providers: Provider[],
  systemType: ProviderSystemType
) => {
  const names = profile.infrastructure.organizationProviders
    .filter((provider) => provider.systemType === systemType)
    .map((provider) => {
      const catalogProvider = providers.find(
        (catalogProvider) => catalogProvider.id === provider.providerId
      )

      return catalogProvider?.name ?? provider.providerId
    })

  return valueList(names)
}

const dataTypeList = (
  values: ProfileDraft["dataHandling"]["dataTypesStored"],
  vocabulary: Vocabulary | undefined,
) =>
  values.length > 0
    ? values
        .map((value) => {
          const details = [
            value.description,
            value.retentionDays > 0
              ? `${value.retentionDays} day retention`
              : null,
            value.isRequired ? "required" : null,
            value.isSensitive ? "sensitive" : null,
            value.sharedWithThirdParties ? "shared with third parties" : null,
          ].filter(Boolean)

          return details.length > 0
            ? `${codeLabel(vocabulary, "data_categories", value.name)}: ${details.join("; ")}`
            : codeLabel(vocabulary, "data_categories", value.name)
        })
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
  countries,
  form,
  providers,
  section,
  vocabulary,
}: {
  countries: Country[]
  form: ProfileFormReturn
  providers: Provider[]
  section: CompanySectionId
  vocabulary: Vocabulary | undefined
}) => {
  if (section === "profile") {
    return (
      <ProfileCompanyFields
        complianceGoalOptions={codeOptions(vocabulary, "compliance_goals")}
        countryOptions={countryOptions(countries)}
        form={form}
        industryOptions={codeOptions(vocabulary, "industries")}
        regionOptions={codeOptions(vocabulary, "regions")}
      />
    )
  }

  if (section === "infrastructure") {
    return <ProfileInfrastructureFields form={form} providers={providers} />
  }

  if (section === "dataHandling") {
    return (
      <ProfileDataHandlingFields
        collectionMethodOptions={codeOptions(vocabulary, "collection_methods")}
        dataCategoryOptions={codeOptions(vocabulary, "data_categories")}
        form={form}
        legalBasisOptions={codeOptions(vocabulary, "legal_basis")}
        purposeOptions={codeOptions(vocabulary, "data_purposes")}
        subjectTypeOptions={codeOptions(vocabulary, "subject_types")}
      />
    )
  }

  return <ProfileAccessFields form={form} />
}

const CompanyReadOnlySection = ({
  countries,
  profile,
  providers,
  section,
  vocabulary,
  onEdit,
}: {
  countries: Country[]
  profile: ProfileDraft
  providers: Provider[]
  section: CompanySectionId
  vocabulary: Vocabulary | undefined
  onEdit: () => void
}) => {
  const rowsBySection: Record<
    CompanySectionId,
    Array<[string, string | number]>
  > = {
    profile: [
      ["Company name", profile.company.companyName || "Not set"],
      ["Legal entity", profile.company.legalEntityName || "Not set"],
      ["Website", profile.company.website || "Not set"],
      ["Contact email", profile.company.contactEmail || "Not set"],
      [
        "Security contact",
        profile.company.securityContactEmail || "Not set",
      ],
      ["Privacy contact", profile.company.privacyContactEmail || "Not set"],
      [
        "Country",
        profile.company.country
          ? countryLabel(countries, profile.company.country)
          : "Not set",
      ],
      ["Address", profile.company.address || "Not set"],
      ["Employees", profile.company.employeeCount],
      [
        "Industries",
        codeValueList(vocabulary, "industries", profile.company.industries),
      ],
      ["Regions", codeValueList(vocabulary, "regions", profile.company.regions)],
      [
        "Compliance goals",
        codeValueList(
          vocabulary,
          "compliance_goals",
          profile.company.complianceGoals,
        ),
      ],
      ["Handles PII", boolText(profile.company.handlesPii)],
      ["Sensitive data", boolText(profile.company.handlesSensitiveData)],
    ],
    infrastructure: [
      ["Cloud providers", providerNamesForSystem(profile, providers, "cloud")],
      [
        "Source control",
        providerNamesForSystem(profile, providers, "source-control"),
      ],
      ["Auth provider", providerNamesForSystem(profile, providers, "auth")],
      [
        "Password manager",
        providerNamesForSystem(profile, providers, "password-manager"),
      ],
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
      [
        "Data types",
        dataTypeList(profile.dataHandling.dataTypesStored, vocabulary),
      ],
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

export const Workspace = ({ user }: { user: AuthUser }) => {
  const logout = useLogout()
  const securityProfile = useSecurityProfile()
  const providers = useProviders()
  const countries = useCountries()
  const vocabulary = useVocabulary()
  const templates = useTemplates()
  const documents = useDocuments()
  const viewingDocumentId = useSecurityUiStore(
    (state) => state.viewingDocumentId
  )
  const document = useDocument(viewingDocumentId)

  const saveProfile = useSaveSecurityProfile()
  const createVendor = useCreateVendor()
  const updateVendor = useUpdateVendor()
  const deleteVendor = useDeleteVendor()
  const createVocabularyCode = useCreateVocabularyCode()
  const updateVocabularyCode = useUpdateVocabularyCode()
  const deleteVocabularyCode = useDeleteVocabularyCode()
  const createTemplate = useCreateTemplateFromSystem()
  const updateTemplate = useUpdateTemplate()
  const deleteTemplate = useDeleteTemplate()
  const createDocument = useCreateDocument()
  const downloadDocumentPdf = useDownloadDocumentPdf()

  const snapshot = securityProfile.data
  const defaultValues = profileFromOrganization(
    snapshot?.organization ?? null
  )
  const vendors = snapshot?.vendors ?? []
  const templatesData: TemplateCatalog =
    templates.data ?? { systemTemplates: [], organizationTemplates: [] }
  const documentsList: DocumentSummary[] = documents.data ?? []

  const workspaceDataError = [
    securityProfile.error,
    templates.error,
    documents.error,
    providers.error,
    countries.error,
    vocabulary.error,
    document.error,
  ]
    .map((err) => err?.message)
    .filter(Boolean)
    .join(" · ")

  const isVendorMutationPending =
    createVendor.isPending || updateVendor.isPending

  const providersList = providers.data ?? []
  const countriesList = countries.data ?? []
  const vocabularyData = vocabulary.data
  const documentRecord = document.data ?? null

  const [showVendorCatalog, setShowVendorCatalog] = useState(false)
  const [showCustomVendorForm, setShowCustomVendorForm] = useState(false)
  const {
    activeWorkspaceView,
    editingCompanySection,
    editingTemplateId,
    editingVendorId,
    setViewingDocument,
    setActiveWorkspaceView,
    setEditingCompanySection,
    startEditingTemplate,
    startEditingVendor,
  } = useSecurityUiStore()
  const editingVendor = vendors.find((vendor) => vendor.id === editingVendorId)
  const editingTemplate = templatesData.organizationTemplates.find(
    (template) => template.id === editingTemplateId
  )
  const dataTypeOptions = dataTypeOptionsFromProfile(
    defaultValues.dataHandling.dataTypesStored
  ).map((option) => ({
    ...option,
    label: codeLabel(vocabularyData, "data_categories", option.value),
  }))
  const addedSystemTemplateSlugs = new Set(
    templatesData.organizationTemplates.map(
      (template) => template.sourceSystemTemplateSlug
    )
  )
  const viewedDocumentSummary = documentsList.find(
    (summary) => summary.document?.id === viewingDocumentId
  )
  const activeCompanySection = companySectionByView.get(activeWorkspaceView)
  const activeCompanySectionId = activeCompanySection?.id
  const activeCompanyTitle = activeCompanySection?.title ?? "Profile"

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <p className="text-sm font-semibold text-blue-700">ComplyFlow</p>
          <div className="mt-3">
            <OrganizationSwitcher user={user} />
          </div>
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
              active={isCompanyView(activeWorkspaceView)}
              onClick={() => setActiveWorkspaceView("companyProfile")}
            >
              <Building2 className="size-4" />
              Company
            </SidebarMenuButton>
            <div className="ml-4 grid gap-1 border-l border-slate-200 pl-3">
              {companySections.map((section) => {
                const Icon = section.icon

                return (
                  <SidebarMenuButton
                    active={activeWorkspaceView === section.view}
                    key={section.id}
                    onClick={() => setActiveWorkspaceView(section.view)}
                  >
                    <Icon className="size-4" />
                    {section.title}
                  </SidebarMenuButton>
                )
              })}
            </div>
            <SidebarMenuButton
              active={activeWorkspaceView === "vendors"}
              onClick={() => setActiveWorkspaceView("vendors")}
            >
              <Users className="size-4" />
              Vendors
            </SidebarMenuButton>
            <SidebarMenuButton
              active={activeWorkspaceView === "vocabulary"}
              onClick={() => setActiveWorkspaceView("vocabulary")}
            >
              <Tags className="size-4" />
              Vocabulary
            </SidebarMenuButton>
            <SidebarMenuButton
              active={activeWorkspaceView === "templates"}
              onClick={() => setActiveWorkspaceView("templates")}
            >
              <FileText className="size-4" />
              Templates
            </SidebarMenuButton>
            <SidebarMenuButton
              active={activeWorkspaceView === "documents"}
              onClick={() => setActiveWorkspaceView("documents")}
            >
              <ScrollText className="size-4" />
              Documents
            </SidebarMenuButton>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            {user.picture ? (
              <img alt="" className="size-9 rounded-full" src={user.picture} />
            ) : (
              <div className="flex size-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                {user.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
          <Button type="button" variant="outline" onClick={() => logout.mutate()}>
            <LogOut />
            Logout
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <main className="grid gap-6 px-4 py-6 md:px-8">
          <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold text-blue-700">
                {activeWorkspaceView === "dashboard"
                  ? "Dashboard"
                  : isCompanyView(activeWorkspaceView)
                    ? "Company"
                    : activeWorkspaceView === "templates"
                      ? "Templates"
                      : activeWorkspaceView === "documents"
                        ? "Documents"
                        : activeWorkspaceView === "vocabulary"
                          ? "Vocabulary"
                          : "Vendors"}
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-950">
                {activeWorkspaceView === "dashboard"
                  ? "Security readiness dashboard"
                  : isCompanyView(activeWorkspaceView)
                    ? activeCompanyTitle
                    : activeWorkspaceView === "templates"
                      ? "Document templates"
                      : activeWorkspaceView === "documents"
                        ? "Generated documents"
                        : activeWorkspaceView === "vocabulary"
                          ? "Vocabulary"
                          : "Vendor inventory"}
              </h1>
            </div>
          </header>

          {workspaceDataError ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
              {workspaceDataError}
            </p>
          ) : null}

          {activeWorkspaceView === "dashboard" && (
            <>
              <SummaryTiles profile={defaultValues} vendors={vendors} />
              <Section
                description="Current source-of-truth posture captured during onboarding."
                title="Snapshot"
              >
                <CompanyReadOnlySection
                  countries={countriesList}
                  profile={defaultValues}
                  providers={providersList}
                  section="profile"
                  vocabulary={vocabularyData}
                  onEdit={() => {
                    setActiveWorkspaceView("companyProfile")
                    setEditingCompanySection("profile")
                  }}
                />
              </Section>
            </>
          )}

          {activeCompanySection && activeCompanySectionId && (
            <div className="grid gap-5">
              {[activeCompanySection].map((section) => (
                <Section
                  description={section.description}
                  key={section.id}
                  title={section.title}
                >
                  {editingCompanySection === section.id ? (
                    <ProfileForm
                      defaultValues={defaultValues}
                      onSubmit={(profile) => {
                        saveProfile.mutate(profile)
                        setEditingCompanySection(null)
                      }}
                    >
                      {(form) => (
                        <>
                          <CompanySectionFields
                            countries={countriesList}
                            form={form}
                            providers={providersList}
                            section={section.id}
                            vocabulary={vocabularyData}
                          />
                          <div className="flex gap-2">
                            <Button
                              disabled={saveProfile.isPending}
                              type="submit"
                            >
                              {saveProfile.isPending ? <Loader2 /> : <Save />}
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
                      countries={countriesList}
                      profile={defaultValues}
                      providers={providersList}
                      section={section.id}
                      vocabulary={vocabularyData}
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
                    error={providers.error?.message ?? null}
                    isLoading={providers.isLoading}
                    providers={providersList}
                    onChooseOther={() => {
                      startEditingVendor(null)
                      setShowVendorCatalog(false)
                      setShowCustomVendorForm(true)
                    }}
                    onChooseProvider={(provider) => {
                      createVendor.mutate(vendorInputFromProvider(provider))
                      setShowVendorCatalog(false)
                      setShowCustomVendorForm(false)
                    }}
                  />
                </div>
              ) : null}
              {(showCustomVendorForm || editingVendor) && (
                <VendorForm
                  countryOptions={countryOptions(countriesList)}
                  criticalityOptions={codeOptions(
                    vocabularyData,
                    "vendor_criticality",
                  )}
                  dataTypeOptions={dataTypeOptions}
                  dataProcessingLevelOptions={codeOptions(
                    vocabularyData,
                    "data_processing_level",
                  )}
                  dataRegionOptions={codeOptions(vocabularyData, "regions")}
                  defaultValues={
                    editingVendor
                      ? toVendorInput(editingVendor)
                      : emptyVendorDraft
                  }
                  dpaStatusOptions={codeOptions(vocabularyData, "dpa_status")}
                  submitDisabled={isVendorMutationPending}
                  submitLabel={editingVendor ? "Save" : "Add vendor"}
                  vendorCategoryOptions={codeOptions(
                    vocabularyData,
                    "vendor_category",
                  )}
                  onCancel={
                    editingVendor
                      ? () => {
                          startEditingVendor(null)
                          setShowVendorCatalog(false)
                          setShowCustomVendorForm(false)
                        }
                      : undefined
                  }
                  onSubmit={(vendor) => {
                    if (editingVendor) {
                      updateVendor.mutate(
                        { id: editingVendor.id, vendor },
                        {
                          onSuccess: () => {
                            startEditingVendor(null)
                            setShowVendorCatalog(false)
                            setShowCustomVendorForm(false)
                          },
                        }
                      )
                      return
                    }

                    createVendor.mutate(vendor)
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
                      countries={countriesList}
                      vocabulary={vocabularyData}
                      vendors={vendors}
                      onDelete={(vendor) => deleteVendor.mutate(vendor.id)}
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

          {activeWorkspaceView === "vocabulary" && (
            <Section
              description="Edit organization-owned vocabularies used by onboarding and vendor records."
              title="Vocabulary"
            >
              <VocabularyManager
                vocabulary={vocabularyData}
                isSaving={
                  createVocabularyCode.isPending ||
                  updateVocabularyCode.isPending ||
                  deleteVocabularyCode.isPending
                }
                onCreateCode={(codeSetId, code) =>
                  createVocabularyCode.mutate({ codeSetId, code })
                }
                onDeleteCode={(codeSetId, codeId) =>
                  deleteVocabularyCode.mutate({ codeSetId, codeId })
                }
                onUpdateCode={(codeSetId, codeId, code) =>
                  updateVocabularyCode.mutate({ codeSetId, codeId, code })
                }
              />
            </Section>
          )}

          {activeWorkspaceView === "templates" && (
            <div className="grid gap-5">
              <Section
                description="Versioned starter markdown templates with Jinja-style placeholders."
                title="System templates"
              >
                {templates.isLoading ? (
                  <p className="text-sm text-slate-500">Loading templates...</p>
                ) : templatesData.systemTemplates.length > 0 ? (
                  templatesData.systemTemplates.map((template) => {
                    const isAdded = addedSystemTemplateSlugs.has(template.slug)

                    return (
                      <TemplateCard key={template.slug} template={template}>
                        <Button
                          disabled={isAdded || createTemplate.isPending}
                          type="button"
                          onClick={() =>
                            createTemplate.mutate({
                              sourceSystemTemplateSlug: template.slug,
                            })
                          }
                        >
                          <Plus />
                          {isAdded ? "Added" : "Add"}
                        </Button>
                      </TemplateCard>
                    )
                  })
                ) : (
                  <p className="text-sm text-slate-500">
                    No system templates are available.
                  </p>
                )}
              </Section>

              <Section
                description="Organization copies can be edited for your own customer-facing documents."
                title="Organization templates"
              >
                {editingTemplate ? (
                  <TemplateForm
                    defaultValues={editingTemplate}
                    isSaving={updateTemplate.isPending}
                    onCancel={() => startEditingTemplate(null)}
                    onSubmit={(template) => {
                      updateTemplate.mutate(
                        { id: editingTemplate.id, template },
                        { onSuccess: () => startEditingTemplate(null) }
                      )
                    }}
                  />
                ) : templatesData.organizationTemplates.length > 0 ? (
                  templatesData.organizationTemplates.map((template) => (
                    <TemplateCard key={template.id} template={template}>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => startEditingTemplate(template.id)}
                      >
                        <Pencil />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => deleteTemplate.mutate(template.id)}
                      >
                        <Trash2 />
                        Delete
                      </Button>
                    </TemplateCard>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    Add a system template to create the first organization
                    template.
                  </p>
                )}
              </Section>
            </div>
          )}

          {activeWorkspaceView === "documents" && (
            <div className="grid gap-5">
              {viewingDocumentId ? (
                <Section
                  description={
                    viewedDocumentSummary
                      ? `Generated from ${viewedDocumentSummary.template.name}.`
                      : "Generated document content."
                  }
                  title={documentRecord?.title ?? "Document"}
                >
                  <Button
                    className="w-fit"
                    type="button"
                    variant="outline"
                    onClick={() => setViewingDocument(null)}
                  >
                    <X />
                    Close
                  </Button>
                  {documentRecord?.hasPdf ? (
                    <Button
                      className="w-fit"
                      disabled={downloadDocumentPdf.isPending}
                      type="button"
                      variant="outline"
                      onClick={() =>
                        downloadDocumentPdf.mutate({
                          id: documentRecord.id,
                          title: documentRecord.title,
                        })
                      }
                    >
                      <Download />
                      Download PDF
                    </Button>
                  ) : null}
                  {document.isLoading ? (
                    <p className="text-sm text-slate-500">
                      Loading document...
                    </p>
                  ) : documentRecord ? (
                    <DocumentContent document={documentRecord} />
                  ) : (
                    <p className="text-sm text-slate-500">
                      Document was not found.
                    </p>
                  )}
                </Section>
              ) : (
                <Section
                  description="Generate customer-facing documents from organization templates."
                  title="Documents"
                >
                  {documents.isLoading ? (
                    <p className="text-sm text-slate-500">
                      Loading documents...
                    </p>
                  ) : documentsList.length > 0 ? (
                    documentsList.map((summary) => {
                      const isGenerated = Boolean(summary.document)

                      return (
                        <div
                          className={
                            isGenerated
                              ? "grid gap-4 rounded-md border border-slate-200 bg-white p-4 md:grid-cols-[1fr_auto] md:items-start"
                              : "grid gap-4 rounded-md border border-dashed border-slate-300 bg-white/60 p-4 md:grid-cols-[1fr_auto] md:items-start"
                          }
                          key={summary.template.id}
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-slate-950">
                                {summary.template.name}
                              </h3>
                              <span className="rounded-md bg-slate-50 px-2 py-1 font-mono text-xs text-slate-600 ring-1 ring-slate-200">
                                {summary.template.slug}
                              </span>
                              <span
                                className={
                                  summary.status === "stale"
                                    ? "rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800"
                                    : "rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                                }
                              >
                                {documentStatusLabel(summary.status)}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-slate-500">
                              {summary.document
                                ? `Generated ${new Date(
                                    summary.document.generatedAt
                                  ).toLocaleString()}`
                                : "No document has been generated yet."}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {summary.document ? (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() =>
                                    setViewingDocument(
                                      summary.document?.id ?? null
                                    )
                                  }
                                >
                                  <Eye />
                                  View
                                </Button>
                                {summary.document.hasPdf ? (
                                  <Button
                                    disabled={downloadDocumentPdf.isPending}
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                      summary.document
                                        ? downloadDocumentPdf.mutate({
                                            id: summary.document.id,
                                            title: summary.document.title,
                                          })
                                        : undefined
                                    }
                                  >
                                    <Download />
                                    Download
                                  </Button>
                                ) : null}
                              </>
                            ) : (
                              <Button
                                disabled={createDocument.isPending}
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  createDocument.mutate({
                                    templateId: summary.template.id,
                                  })
                                }
                              >
                                <ScrollText />
                                Generate
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-sm text-slate-500">
                      Add an organization template before generating documents.
                    </p>
                  )}
                </Section>
              )}
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
