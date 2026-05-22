import {
  Box,
  Building2,
  ClipboardList,
  Database,
  Download,
  Eye,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Save,
  ScrollText,
  Server,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react"
import {
  type DocumentSummary,
  type AuthUser,
  type Provider,
  type TemplateCatalog,
  type Vocabulary,
  type Country,
} from "@plyco/shared"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { DocumentContent } from "@/features/documents/components/document-content"
import { documentStatusLabel } from "@/features/documents/lib/document-status"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import {
  dataTypeOptionsFromProfile,
  emptyServiceVendorUseDraft,
  emptyVendorDraft,
  profileFromOrganization,
  providerNamesForSystem,
  toServiceVendorUseInput,
  toVendorInput,
  vendorInputFromProvider,
} from "@/features/security-profile/lib/profile"
import {
  ProfileAccessFields,
  ProfileCompanyFields,
  ProfileDataHandlingFields,
  ProfileForm,
  type ProfileFormReturn,
  ProfileServiceFields,
} from "@/features/security-profile/components/profile-form"
import { DataHandlingManager } from "@/features/security-profile/components/data-handling-manager"
import { InfrastructureManager } from "@/features/security-profile/components/infrastructure-manager"
import { PrivacyManager } from "@/features/security-profile/components/privacy-manager"
import { useCreateDocument, useDocument, useDocuments, useDownloadDocumentPdf } from "@/features/documents/hooks/use-documents"
import { useLogout } from "@/features/auth/hooks/use-auth"
import {
  useSaveSecurityProfile,
  useSecurityProfile,
} from "@/features/security-profile/hooks/use-security-profile"
import {
  useCreateTemplateFromSystem,
  useDeleteTemplate,
  useOrganizationMembers,
  useTemplates,
  useUpdateTemplate,
} from "@/features/templates/hooks/use-templates"
import {
  useCreateVendor,
  useCreateBusinessActivity,
  useCreateServiceVendorUse,
  useDeleteBusinessActivity,
  useDeleteServiceVendorUse,
  useDeleteVendor,
  useProviders,
  useUpdateBusinessActivity,
  useUpdateServiceVendorUse,
  useUpdateVendor,
} from "@/features/vendors/hooks/use-vendors"
import { Section } from "@/features/shell/components/section"
import {
  AppSidebar,
  type CompanySection,
  type CompanySectionId,
  type WorkspaceView,
} from "@/features/shell/components/app-sidebar"
import { SummaryTiles } from "@/features/security-profile/components/summary-tiles"
import { VendorEmptyState } from "@/features/vendors/components/vendor-empty-state"
import { VendorForm } from "@/features/vendors/components/vendor-form"
import { VendorList } from "@/features/vendors/components/vendor-list"
import { ServiceVendorUseForm } from "@/features/vendors/components/service-vendor-use-form"
import { ProviderSelector } from "@/features/vendors/components/provider-selector"
import { ActivitiesManager } from "@/features/vendors/components/activities-manager"
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
  codeValueList,
  countryLabel,
  countryOptions,
} from "@/features/vocabulary/lib/vocabulary"
import { type Option } from "@/features/vocabulary/lib/vocabulary"
import { VocabularyManager } from "@/features/vocabulary/components/vocabulary-manager"

const companySections: CompanySection[] = [
  {
    id: "profile",
    view: "companyProfile",
    title: "Profile",
    description: "Operational context customers ask for early.",
    icon: Building2,
  },
  {
    id: "service",
    view: "companyService",
    title: "Services",
    description: "Products or services the organization offers.",
    icon: Box,
  },
  {
    id: "activities",
    view: "companyActivities",
    title: "Activities",
    description: "Processing activities with purpose, role, and legal basis.",
    icon: ClipboardList,
  },
  {
    id: "privacy",
    view: "companyPrivacy",
    title: "Privacy",
    description: "Rights and request handling for privacy documents.",
    icon: ShieldCheck,
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
  | "companyService"
  | "companyActivities"
  | "companyPrivacy"
  | "companyInfrastructure"
  | "companyData"
  | "companyAccess" => companySectionByView.has(view)

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
  businessActivityOptions,
  countries,
  form,
  providers,
  section,
  vocabulary,
}: {
  businessActivityOptions: Option[]
  countries: Country[]
  form: ProfileFormReturn
  providers: Provider[]
  section: CompanySectionId
  vocabulary: Vocabulary | undefined
}) => {
  if (section === "activities") {
    return null
  }

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

  if (section === "service") {
    return (
      <ProfileServiceFields
        businessActivityOptions={businessActivityOptions}
        cookieTypeOptions={codeOptions(vocabulary, "privacy_cookie_types")}
        customerTypeOptions={codeOptions(vocabulary, "service_customer_types")}
        form={form}
        providers={providers}
        regionOptions={codeOptions(vocabulary, "regions")}
        userTypeOptions={codeOptions(vocabulary, "service_user_types")}
      />
    )
  }

  if (section === "privacy" || section === "infrastructure") {
    return null
  }

  if (section === "dataHandling") {
    return (
      <ProfileDataHandlingFields
        collectionMethodOptions={codeOptions(vocabulary, "collection_methods")}
        form={form}
        subjectTypeOptions={codeOptions(vocabulary, "subject_types")}
      />
    )
  }

  return (
    <ProfileAccessFields
      form={form}
      securityCadenceOptions={codeOptions(vocabulary, "security_cadences")}
    />
  )
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
  if (section === "activities") {
    return null
  }

  if (
    section === "dataHandling" ||
    section === "privacy" ||
    section === "infrastructure"
  ) {
    return null
  }

  if (section === "service") {
    return (
      <div className="grid gap-4">
        {profile.services.map((service, index) => (
          <section className="grid gap-3" key={service.id ?? index}>
            <h3 className="text-sm font-semibold text-slate-900">
              {service.serviceName || `Service ${index + 1}`}
            </h3>
            <DetailGrid
              rows={[
                ["Service URL", service.serviceUrl || "Not set"],
                ["Description", service.serviceDescription || "Not set"],
                [
                  "User types",
                  codeValueList(
                    vocabulary,
                    "service_user_types",
                    service.userTypes,
                  ),
                ],
                [
                  "Customer types",
                  codeValueList(
                    vocabulary,
                    "service_customer_types",
                    service.customerTypes,
                  ),
                ],
                [
                  "Availability regions",
                  codeValueList(vocabulary, "regions", service.availabilityRegions),
                ],
                ["Directed to children", boolText(service.childrenDirected)],
                [
                  "Minimum user age",
                  service.minimumUserAge === 0
                    ? "Not set"
                    : service.minimumUserAge,
                ],
                ["Uses cookies", boolText(service.privacy.usesCookies)],
                [
                  "Cookie types",
                  codeValueList(
                    vocabulary,
                    "privacy_cookie_types",
                    service.privacy.cookieTypes,
                  ),
                ],
                [
                  "Analytics providers",
                  providerNamesForSystem(
                    service.privacy.analyticsProviders,
                    providers,
                    "analytics",
                  ),
                ],
                [
                  "Advertising providers",
                  providerNamesForSystem(
                    service.privacy.advertisingProviders,
                    providers,
                    "advertising",
                  ),
                ],
                [
                  "Primary hosting region",
                  service.privacy.primaryHostingRegion
                    ? codeLabel(
                        vocabulary,
                        "regions",
                        service.privacy.primaryHostingRegion,
                      )
                    : "Not set",
                ],
                [
                  "Data residency options",
                  codeValueList(
                    vocabulary,
                    "regions",
                    service.privacy.dataResidencyOptions,
                  ),
                ],
              ]}
            />
          </section>
        ))}
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

  const rowsBySection: Record<
    Exclude<
      CompanySectionId,
      | "activities"
      | "dataHandling"
      | "infrastructure"
      | "privacy"
      | "service"
    >,
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
    access: [
      ["Least privilege", boolText(profile.access.leastPrivilege)],
      ["Role-based access", boolText(profile.access.roleBasedAccess)],
      [
        "Access review cadence",
        profile.access.accessReviewCadence
          ? codeLabel(
              vocabulary,
              "security_cadences",
              profile.access.accessReviewCadence,
            )
          : "Not set",
      ],
      [
        "Admin approval required",
        boolText(profile.access.adminApprovalRequired),
      ],
      ["MFA required", boolText(profile.access.mfaRequired)],
      ["SSO enabled", boolText(profile.access.ssoEnabled)],
      [
        "Password manager required",
        boolText(profile.access.passwordManagerRequired),
      ],
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
  const organizationMembers = useOrganizationMembers()
  const documents = useDocuments()
  const viewingDocumentId = useSecurityUiStore(
    (state) => state.viewingDocumentId
  )
  const document = useDocument(viewingDocumentId)

  const saveProfile = useSaveSecurityProfile()
  const createBusinessActivity = useCreateBusinessActivity()
  const updateBusinessActivity = useUpdateBusinessActivity()
  const deleteBusinessActivity = useDeleteBusinessActivity()
  const createVendor = useCreateVendor()
  const updateVendor = useUpdateVendor()
  const deleteVendor = useDeleteVendor()
  const createServiceVendorUse = useCreateServiceVendorUse()
  const updateServiceVendorUse = useUpdateServiceVendorUse()
  const deleteServiceVendorUse = useDeleteServiceVendorUse()
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
  const serviceVendorUses = snapshot?.serviceVendorUses ?? []
  const businessActivities = snapshot?.businessActivities ?? []
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
    organizationMembers.error,
    document.error,
  ]
    .map((err) => err?.message)
    .filter(Boolean)
    .join(" · ")

  const isActivityMutationPending =
    createBusinessActivity.isPending ||
    updateBusinessActivity.isPending ||
    deleteBusinessActivity.isPending

  const isVendorMutationPending =
    createVendor.isPending ||
    updateVendor.isPending ||
    createServiceVendorUse.isPending ||
    updateServiceVendorUse.isPending

  const providersList = providers.data ?? []
  const countriesList = countries.data ?? []
  const vocabularyData = vocabulary.data
  const organizationMembersData = organizationMembers.data ?? []
  const documentRecord = document.data ?? null

  const [showVendorCatalog, setShowVendorCatalog] = useState(false)
  const [showCustomVendorForm, setShowCustomVendorForm] = useState(false)
  const [showVendorUseForm, setShowVendorUseForm] = useState(false)
  const [editingVendorUseId, setEditingVendorUseId] = useState<string | null>(
    null
  )
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
  const editingVendorUse = serviceVendorUses.find(
    (vendorUse) => vendorUse.id === editingVendorUseId
  )
  const editingTemplate = templatesData.organizationTemplates.find(
    (template) => template.id === editingTemplateId
  )
  const dataTypeOptions = dataTypeOptionsFromProfile(
    defaultValues.dataHandling.dataTypesStored
  )
  const serviceOptions = (snapshot?.organization?.services ?? []).map(
    (service, index) => ({
      value: service.id,
      label: service.serviceName || `Service ${index + 1}`,
    })
  )
  const businessActivityOptions = businessActivities.map((activity) => ({
    value: activity.id,
    label: activity.name,
  }))
  const vendorOptions = vendors.map((vendor) => ({
    value: vendor.id,
    label: vendor.displayName || vendor.name,
  }))
  const defaultVendorUseValues = {
    ...emptyServiceVendorUseDraft,
    serviceId: serviceOptions[0]?.value ?? "",
    vendorId: vendorOptions[0]?.value ?? "",
  }
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
      <AppSidebar
        activeWorkspaceView={activeWorkspaceView}
        companySections={companySections}
        user={user}
        onLogout={() => logout.mutate()}
        onWorkspaceViewChange={setActiveWorkspaceView}
      />

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
              {activeCompanySectionId === "dataHandling" ? (
                <DataHandlingManager
                  collectionMethodOptions={codeOptions(
                    vocabularyData,
                    "collection_methods",
                  )}
                  isMutationPending={saveProfile.isPending}
                  profile={defaultValues}
                  subjectTypeOptions={codeOptions(
                    vocabularyData,
                    "subject_types",
                  )}
                  vocabulary={vocabularyData}
                  onSaveProfile={(profile) => saveProfile.mutate(profile)}
                />
              ) : activeCompanySectionId === "privacy" ? (
                <PrivacyManager
                  cookieConsentMechanismOptions={codeOptions(
                    vocabularyData,
                    "privacy_cookie_consent_mechanisms",
                  )}
                  isMutationPending={saveProfile.isPending}
                  marketingOptOutMethodOptions={codeOptions(
                    vocabularyData,
                    "privacy_marketing_opt_out_methods",
                  )}
                  newsletterProviderOptions={providersList
                    .filter((provider) =>
                      provider.systemTypes.includes("newsletter"),
                    )
                    .map((provider) => ({
                      value: provider.id,
                      label: provider.name,
                    }))}
                  profile={defaultValues}
                  providers={providersList}
                  requestMethodOptions={codeOptions(
                    vocabularyData,
                    "privacy_request_methods",
                  )}
                  supportedRightOptions={codeOptions(
                    vocabularyData,
                    "privacy_supported_rights",
                  )}
                  transferMechanismOptions={codeOptions(
                    vocabularyData,
                    "privacy_transfer_mechanisms",
                  )}
                  vocabulary={vocabularyData}
                  onSaveProfile={(profile) => saveProfile.mutate(profile)}
                />
              ) : activeCompanySectionId === "infrastructure" ? (
                <InfrastructureManager
                  isMutationPending={saveProfile.isPending}
                  profile={defaultValues}
                  providers={providersList}
                  securityCadenceOptions={codeOptions(
                    vocabularyData,
                    "security_cadences",
                  )}
                  securityCustomerNotificationProcessOptions={codeOptions(
                    vocabularyData,
                    "security_customer_notification_processes",
                  )}
                  securityEncryptionAlgorithmOptions={codeOptions(
                    vocabularyData,
                    "security_encryption_algorithms",
                  )}
                  securityKeyManagementProviderOptions={codeOptions(
                    vocabularyData,
                    "security_key_management_providers",
                  )}
                  securityMonitoringOwnerOptions={codeOptions(
                    vocabularyData,
                    "security_monitoring_owners",
                  )}
                  securityNotificationTimelineOptions={codeOptions(
                    vocabularyData,
                    "security_notification_timelines",
                  )}
                  securityTlsVersionOptions={codeOptions(
                    vocabularyData,
                    "security_tls_versions",
                  )}
                  vocabulary={vocabularyData}
                  onSaveProfile={(profile) => saveProfile.mutate(profile)}
                />
              ) : (
                [activeCompanySection].map((section) => (
                <Section
                  description={section.description}
                  key={section.id}
                  title={section.title}
                >
                  {section.id === "activities" ? (
                    <ActivitiesManager
                      activities={businessActivities}
                      isMutationPending={isActivityMutationPending}
                      legalBasisOptions={codeOptions(vocabularyData, "legal_basis")}
                      roleOptions={codeOptions(vocabularyData, "activity_role")}
                      vocabulary={vocabularyData}
                      onCreate={(activity) => createBusinessActivity.mutate(activity)}
                      onDelete={(activity) =>
                        deleteBusinessActivity.mutate(activity.id)
                      }
                      onUpdate={(input) => updateBusinessActivity.mutate(input)}
                    />
                  ) : editingCompanySection === section.id ? (
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
                            businessActivityOptions={businessActivityOptions}
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
              ))
              )}
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
	                  defaultValues={
	                    editingVendor
	                      ? toVendorInput(editingVendor)
	                      : emptyVendorDraft
	                  }
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
	              {(showVendorUseForm || editingVendorUse) && (
	                <ServiceVendorUseForm
	                  dataProcessingLevelOptions={codeOptions(
	                    vocabularyData,
	                    "data_processing_level",
	                  )}
	                  dataRegionOptions={codeOptions(vocabularyData, "regions")}
	                  dataTypeOptions={dataTypeOptions}
	                  defaultValues={
	                    editingVendorUse
	                      ? toServiceVendorUseInput(editingVendorUse)
	                      : defaultVendorUseValues
	                  }
	                  dpaStatusOptions={codeOptions(vocabularyData, "dpa_status")}
	                  serviceOptions={serviceOptions}
	                  submitDisabled={isVendorMutationPending}
	                  submitLabel={editingVendorUse ? "Save" : "Add service use"}
	                  vendorOptions={vendorOptions}
	                  onCancel={() => {
	                    setEditingVendorUseId(null)
	                    setShowVendorUseForm(false)
	                  }}
	                  onSubmit={(vendorUse) => {
	                    if (editingVendorUse) {
	                      updateServiceVendorUse.mutate(
	                        { id: editingVendorUse.id, vendorUse },
	                        {
	                          onSuccess: () => {
	                            setEditingVendorUseId(null)
	                            setShowVendorUseForm(false)
	                          },
	                        }
	                      )
	                      return
	                    }

	                    createServiceVendorUse.mutate(vendorUse)
	                    setShowVendorUseForm(false)
	                  }}
	                />
	              )}
	              {!showVendorCatalog &&
	              !showCustomVendorForm &&
	              !editingVendor &&
	              !showVendorUseForm &&
	              !editingVendorUse ? (
	                vendors.length > 0 ? (
	                  <div className="grid gap-4">
	                    <div className="flex flex-wrap gap-2">
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
	                      <Button
	                        className="w-fit"
	                        disabled={serviceOptions.length === 0 || vendors.length === 0}
	                        type="button"
	                        variant="outline"
	                        onClick={() => {
	                          setEditingVendorUseId(null)
	                          setShowVendorUseForm(true)
	                        }}
	                      >
	                        <Plus />
	                        Add service use
	                      </Button>
	                    </div>
	                    <VendorList
	                      countries={countriesList}
	                      serviceVendorUses={serviceVendorUses}
	                      vocabulary={vocabularyData}
	                      vendors={vendors}
	                      onDelete={(vendor) => deleteVendor.mutate(vendor.id)}
	                      onDeleteUse={(vendorUse) =>
	                        deleteServiceVendorUse.mutate(vendorUse.id)
	                      }
	                      onEdit={(vendor) => {
	                        startEditingVendor(vendor.id)
	                        setShowCustomVendorForm(true)
	                      }}
	                      onEditUse={(vendorUse) => {
	                        setEditingVendorUseId(vendorUse.id)
	                        setShowVendorUseForm(true)
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
                    members={organizationMembersData}
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
