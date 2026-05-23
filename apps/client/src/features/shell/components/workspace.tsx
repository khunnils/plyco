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
  type TemplateCatalog,
  type Vocabulary,
  type Country,
} from "@plyco/shared"
import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DocumentContent } from "@/features/documents/components/document-content"
import { documentStatusLabel } from "@/features/documents/lib/document-status"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import {
  dataTypeOptionsFromProfile,
  profileFromOrganization,
} from "@/features/security-profile/lib/profile"
import {
  ProfileAccessFields,
  ProfileDataHandlingFields,
  ProfileForm,
  type ProfileFormReturn,
  ProfileServiceFields,
} from "@/features/security-profile/components/profile-form"
import { CompanyProfilePage } from "@/features/security-profile/pages/company-profile-page"
import { DataHandlingProfilePage } from "@/features/security-profile/pages/data-handling-profile-page"
import { InfrastructureProfilePage } from "@/features/security-profile/pages/infrastructure-profile-page"
import { PrivacyProfilePage } from "@/features/security-profile/pages/privacy-profile-page"
import { ServiceProfilePage } from "@/features/security-profile/pages/service-profile-page"
import {
  useCreateDocument,
  useDocument,
  useDocuments,
  useDownloadDocumentPdf,
} from "@/features/documents/hooks/use-documents"
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
  useCreateOrganizationProvider,
  useCreateOrganizationProviders,
  useCreateBusinessActivity,
  useCreateServiceProviderUsage,
  useDeleteBusinessActivity,
  useDeleteServiceProviderUsage,
  useDeleteOrganizationProvider,
  useProviders,
  useUpdateBusinessActivity,
  useUpdateServiceProviderUsage,
  useUpdateOrganizationProvider,
} from "@/features/vendors/hooks/use-vendors"
import { Section } from "@/features/shell/components/section"
import {
  AppSidebar,
  type CompanySection,
  type CompanySectionId,
  type WorkspaceView,
} from "@/features/shell/components/app-sidebar"
import { SummaryTiles } from "@/features/security-profile/components/summary-tiles"
import { VendorInventoryPage } from "@/features/vendors/components/vendor-inventory-page"
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

const workspacePathByView: Record<WorkspaceView, string> = {
  dashboard: "/",
  companyProfile: "/company/profile",
  companyService: "/company/services",
  companyActivities: "/company/activities",
  companyPrivacy: "/company/privacy",
  companyInfrastructure: "/company/infrastructure",
  companyData: "/company/data",
  companyAccess: "/company/access",
  templates: "/templates",
  documents: "/documents",
  vendors: "/vendors",
  vocabulary: "/vocabulary",
}

const workspaceViewFromPath = (pathname: string): WorkspaceView => {
  if (pathname.startsWith("/company/services")) return "companyService"
  if (pathname === "/company/profile") return "companyProfile"
  if (pathname === "/company/activities") return "companyActivities"
  if (pathname === "/company/privacy") return "companyPrivacy"
  if (pathname === "/company/infrastructure") return "companyInfrastructure"
  if (pathname === "/company/data") return "companyData"
  if (pathname === "/company/access") return "companyAccess"
  if (pathname === "/templates") return "templates"
  if (pathname.startsWith("/documents")) return "documents"
  if (pathname === "/vendors") return "vendors"
  if (pathname === "/vocabulary") return "vocabulary"

  return "dashboard"
}

const serviceIdFromPath = (pathname: string) => {
  const match = pathname.match(/^\/company\/services\/([^/]+)$/)

  return match?.[1] ?? null
}

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

const boolText = (value: boolean | null) =>
  value === null ? "Not answered" : value ? "Yes" : "No"

const DetailGrid = ({ rows }: { rows: Array<[string, string | number | null]> }) => (
  <dl className="grid gap-3 sm:grid-cols-2">
    {rows.map(([label, value]) => (
      <div
        className="rounded-md border border-slate-200 bg-slate-50 p-3"
        key={label}
      >
        <dt className="text-xs font-medium text-slate-500">{label}</dt>
        <dd className="mt-1 text-sm font-medium text-slate-900">
          {value ?? "Not answered"}
        </dd>
      </div>
    ))}
  </dl>
)

const CompanySectionFields = ({
  businessActivityOptions,
  form,
  section,
  vocabulary,
}: {
  businessActivityOptions: Option[]
  form: ProfileFormReturn
  section: CompanySectionId
  vocabulary: Vocabulary | undefined
}) => {
  if (section === "activities") {
    return null
  }

  if (section === "profile") {
    return null
  }

  if (section === "service") {
    return (
      <ProfileServiceFields
        businessActivityOptions={businessActivityOptions}
        cookieTypeOptions={codeOptions(vocabulary, "privacy_cookie_types")}
        customerTypeOptions={codeOptions(vocabulary, "service_customer_types")}
        form={form}
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
  section,
  vocabulary,
  onEdit,
}: {
  countries: Country[]
  profile: ProfileDraft
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
                    service.userTypes
                  ),
                ],
                [
                  "Customer types",
                  codeValueList(
                    vocabulary,
                    "service_customer_types",
                    service.customerTypes
                  ),
                ],
                [
                  "Availability regions",
                  codeValueList(
                    vocabulary,
                    "regions",
                    service.availabilityRegions
                  ),
                ],
                ["Directed to children", boolText(service.childrenDirected)],
                [
                  "Minimum user age",
                  service.minimumUserAge === null
                    ? "Not answered"
                    : service.minimumUserAge === 0
                      ? "Not set"
                      : service.minimumUserAge,
                ],
                ["Uses cookies", boolText(service.privacy.usesCookies)],
                [
                  "Cookie types",
                  codeValueList(
                    vocabulary,
                    "privacy_cookie_types",
                    service.privacy.cookieTypes
                  ),
                ],
                [
                  "Primary hosting region",
                  service.privacy.primaryHostingRegion
                    ? codeLabel(
                        vocabulary,
                        "regions",
                        service.privacy.primaryHostingRegion
                      )
                    : "Not set",
                ],
                [
                  "Data residency options",
                  codeValueList(
                    vocabulary,
                    "regions",
                    service.privacy.dataResidencyOptions
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
      "activities" | "dataHandling" | "infrastructure" | "privacy" | "service"
    >,
    Array<[string, string | number | null]>
  > = {
    profile: [
      ["Company name", profile.company.companyName || "Not set"],
      ["Legal entity", profile.company.legalEntityName || "Not set"],
      ["Website", profile.company.website || "Not set"],
      ["Contact email", profile.company.contactEmail || "Not set"],
      ["Security contact", profile.company.securityContactEmail || "Not set"],
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
      [
        "Regions",
        codeValueList(vocabulary, "regions", profile.company.regions),
      ],
      [
        "Compliance goals",
        codeValueList(
          vocabulary,
          "compliance_goals",
          profile.company.complianceGoals
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
              profile.access.accessReviewCadence
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
  const location = useLocation()
  const navigate = useNavigate()
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
  const createProvider = useCreateOrganizationProvider()
  const createProviders = useCreateOrganizationProviders()
  const updateProvider = useUpdateOrganizationProvider()
  const deleteProvider = useDeleteOrganizationProvider()
  const createServiceProviderUsage = useCreateServiceProviderUsage()
  const updateServiceProviderUsage = useUpdateServiceProviderUsage()
  const deleteServiceProviderUsage = useDeleteServiceProviderUsage()
  const createVocabularyCode = useCreateVocabularyCode()
  const updateVocabularyCode = useUpdateVocabularyCode()
  const deleteVocabularyCode = useDeleteVocabularyCode()
  const createTemplate = useCreateTemplateFromSystem()
  const updateTemplate = useUpdateTemplate()
  const deleteTemplate = useDeleteTemplate()
  const createDocument = useCreateDocument()
  const downloadDocumentPdf = useDownloadDocumentPdf()

  const snapshot = securityProfile.data
  const defaultValues = profileFromOrganization(snapshot?.organization ?? null)
  const organizationProviders = snapshot?.organizationProviders ?? []
  const serviceProviderUsage = snapshot?.serviceProviderUsage ?? []
  const businessActivities = snapshot?.businessActivities ?? []
  const templatesData: TemplateCatalog = templates.data ?? {
    systemTemplates: [],
    organizationTemplates: [],
  }
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
    createProvider.isPending ||
    createProviders.isPending ||
    updateProvider.isPending ||
    deleteProvider.isPending ||
    createServiceProviderUsage.isPending ||
    updateServiceProviderUsage.isPending ||
    deleteServiceProviderUsage.isPending

  const providersList = providers.data ?? []
  const countriesList = countries.data ?? []
  const vocabularyData = vocabulary.data
  const organizationMembersData = organizationMembers.data ?? []
  const documentRecord = document.data ?? null

  const [showVendorCatalog, setShowVendorCatalog] = useState(false)
  const [showCustomVendorForm, setShowCustomVendorForm] = useState(false)
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [editingActivityId, setEditingActivityId] = useState<string | null>(
    null
  )
  const {
    editingCompanySection,
    editingTemplateId,
    editingVendorId,
    selectedServiceId,
    servicesExpanded,
    setViewingDocument,
    setEditingCompanySection,
    setSelectedServiceId,
    setServicesExpanded,
    startEditingTemplate,
    startEditingVendor,
  } = useSecurityUiStore()
  const activeWorkspaceView = workspaceViewFromPath(location.pathname)
  const routeServiceId = serviceIdFromPath(location.pathname)
  const isCreatingService =
    activeWorkspaceView === "companyService" && routeServiceId === "new"
  const routedSelectedServiceId =
    activeWorkspaceView === "companyService" && routeServiceId !== "new"
      ? routeServiceId
      : selectedServiceId
  const editingProvider = organizationProviders.find(
    (provider) => provider.id === editingVendorId
  )
  const editingTemplate = templatesData.organizationTemplates.find(
    (template) => template.id === editingTemplateId
  )
  const dataTypeOptions = dataTypeOptionsFromProfile(
    defaultValues.dataHandling.dataTypesStored
  )
  const businessActivityOptions = businessActivities.map((activity) => ({
    value: activity.id,
    label: activity.name,
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
  const headerService =
    defaultValues.services.find(
      (service) => service.id === routedSelectedServiceId
    ) ??
    defaultValues.services.find(
      (service) => service.id === selectedServiceId
    ) ??
    defaultValues.services[0]
  const activeCompanyTitle =
    activeCompanySectionId === "service"
      ? isCreatingService
        ? "Add service"
        : headerService?.serviceName?.trim() || "Service"
      : (activeCompanySection?.title ?? "Profile")
  const headerServiceIndex = Math.max(
    defaultValues.services.findIndex(
      (service) => service.id === routedSelectedServiceId
    ),
    0
  )
  const deleteSelectedService = () => {
    if (defaultValues.services.length === 1) {
      return
    }

    const nextServices = defaultValues.services.filter(
      (_, index) => index !== headerServiceIndex
    )
    const nextSelectedService =
      nextServices[Math.min(headerServiceIndex, nextServices.length - 1)] ??
      null

    saveProfile.mutate(
      {
        ...defaultValues,
        services: nextServices,
      },
      {
        onSuccess: () => {
          const nextPath = nextSelectedService?.id
            ? `/company/services/${nextSelectedService.id}`
            : "/company/services"

          setSelectedServiceId(nextSelectedService?.id ?? null)
          navigate(nextPath)
        },
      }
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar
        activeWorkspaceView={activeWorkspaceView}
        companySections={companySections}
        selectedServiceId={routedSelectedServiceId}
        services={defaultValues.services}
        servicesExpanded={servicesExpanded}
        user={user}
        onAddService={() => {
          setSelectedServiceId(null)
          setServicesExpanded(true)
          navigate("/company/services/new")
        }}
        onLogout={() => logout.mutate()}
        onSelectService={(serviceId) => {
          setSelectedServiceId(serviceId)
          setServicesExpanded(true)
          navigate(
            serviceId ? `/company/services/${serviceId}` : "/company/services"
          )
        }}
        onServicesExpandedChange={setServicesExpanded}
        onWorkspaceViewChange={(view) => {
          navigate(workspacePathByView[view])
        }}
      />

      <SidebarInset>
        <main className="grid gap-6 px-4 py-6 md:px-12">
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
                          : "Providers"}
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
                          : "Provider inventory"}
              </h1>
            </div>
            {activeCompanySectionId === "service" && !isCreatingService ? (
              <Button
                className="w-fit"
                disabled={
                  defaultValues.services.length === 1 || saveProfile.isPending
                }
                type="button"
                variant="outline"
                onClick={deleteSelectedService}
              >
                <Trash2 />
                Delete service
              </Button>
            ) : null}
          </header>

          {workspaceDataError ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
              {workspaceDataError}
            </p>
          ) : null}

          {activeWorkspaceView === "dashboard" && (
            <>
              <SummaryTiles
                profile={defaultValues}
                providers={organizationProviders}
              />
              <Section
                description="Current source-of-truth posture captured during onboarding."
                title="Snapshot"
              >
                <CompanyReadOnlySection
                  countries={countriesList}
                  profile={defaultValues}
                  section="profile"
                  vocabulary={vocabularyData}
                  onEdit={() => {
                    navigate("/company/profile")
                  }}
                />
              </Section>
            </>
          )}

          {activeCompanySection && activeCompanySectionId && (
            <div className="grid gap-5">
              {activeCompanySectionId === "service" ? (
                <ServiceProfilePage
                  businessActivityOptions={businessActivityOptions}
                  dataTypeOptions={dataTypeOptions}
                  isCreatingService={isCreatingService}
                  isProfileMutationPending={saveProfile.isPending}
                  isVendorMutationPending={isVendorMutationPending}
                  profile={defaultValues}
                  selectedServiceId={routedSelectedServiceId}
                  serviceProviderUsage={serviceProviderUsage}
                  organizationProviders={organizationProviders}
                  vocabulary={vocabularyData}
                  onCancelCreateService={() =>
                    navigate(
                      routedSelectedServiceId
                        ? `/company/services/${routedSelectedServiceId}`
                        : "/company/services"
                    )
                  }
                  onCreateProviderUsage={(providerUsage, onSuccess) =>
                    createServiceProviderUsage.mutate(providerUsage, {
                      onSuccess,
                    })
                  }
                  onDeleteProviderUsage={(providerUsage) =>
                    deleteServiceProviderUsage.mutate(providerUsage.id)
                  }
                  onSaveProfile={(profile, onSuccess) =>
                    saveProfile.mutate(profile, { onSuccess })
                  }
                  onSelectService={(serviceId) => {
                    setSelectedServiceId(serviceId)
                    navigate(
                      serviceId
                        ? `/company/services/${serviceId}`
                        : "/company/services"
                    )
                  }}
                  onUpdateProviderUsage={(input, onSuccess) =>
                    updateServiceProviderUsage.mutate(input, { onSuccess })
                  }
                />
              ) : activeCompanySectionId === "dataHandling" ? (
                <DataHandlingProfilePage
                  isMutationPending={saveProfile.isPending}
                  profile={defaultValues}
                  vocabulary={vocabularyData}
                  onSaveProfile={(profile, onSuccess) =>
                    saveProfile.mutate(profile, { onSuccess })
                  }
                />
              ) : activeCompanySectionId === "privacy" ? (
                <PrivacyProfilePage
                  isMutationPending={saveProfile.isPending}
                  profile={defaultValues}
                  providers={providersList}
                  vocabulary={vocabularyData}
                  onSaveProfile={(profile, onSuccess) =>
                    saveProfile.mutate(profile, { onSuccess })
                  }
                />
              ) : activeCompanySectionId === "infrastructure" ? (
                <InfrastructureProfilePage
                  isMutationPending={saveProfile.isPending}
                  profile={defaultValues}
                  providers={providersList}
                  vocabulary={vocabularyData}
                  onSaveProfile={(profile, onSuccess) =>
                    saveProfile.mutate(profile, { onSuccess })
                  }
                />
              ) : activeCompanySectionId === "profile" ? (
                <CompanyProfilePage
                  countries={countriesList}
                  isMutationPending={saveProfile.isPending}
                  profile={defaultValues}
                  vocabulary={vocabularyData}
                  onSaveProfile={(profile, onSuccess) =>
                    saveProfile.mutate(profile, { onSuccess })
                  }
                />
              ) : (
                [activeCompanySection].map((section) => (
                  <Section
                    description={section.description}
                    key={section.id}
                    title={section.title}
                    action={
                      section.id === "activities" &&
                      businessActivities.length > 0 &&
                      !showActivityForm &&
                      !editingActivityId ? (
                        <Button
                          className="w-fit"
                          type="button"
                          onClick={() => {
                            setEditingActivityId(null)
                            setShowActivityForm(true)
                          }}
                        >
                          <Plus />
                          Add activity
                        </Button>
                      ) : undefined
                    }
                  >
                    {section.id === "activities" ? (
                      <ActivitiesManager
                        activities={businessActivities}
                        isMutationPending={isActivityMutationPending}
                        legalBasisOptions={codeOptions(
                          vocabularyData,
                          "legal_basis"
                        )}
                        roleOptions={codeOptions(
                          vocabularyData,
                          "activity_role"
                        )}
                        vocabulary={vocabularyData}
                        onCreate={(activity, onSuccess) =>
                          createBusinessActivity.mutate(activity, { onSuccess })
                        }
                        onDelete={(activity) =>
                          deleteBusinessActivity.mutate(activity.id)
                        }
                        onUpdate={(input, onSuccess) =>
                          updateBusinessActivity.mutate(input, { onSuccess })
                        }
                        showForm={showActivityForm}
                        setShowForm={setShowActivityForm}
                        editingActivityId={editingActivityId}
                        setEditingActivityId={setEditingActivityId}
                      />
                    ) : editingCompanySection === section.id ? (
                      <ProfileForm
                        defaultValues={defaultValues}
                        onSubmit={(profile) => {
                          saveProfile.mutate(profile, {
                            onSuccess: () => setEditingCompanySection(null),
                          })
                        }}
                      >
                        {(form) => (
                          <>
                            <CompanySectionFields
                              businessActivityOptions={businessActivityOptions}
                              form={form}
                              section={section.id}
                              vocabulary={vocabularyData}
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                disabled={saveProfile.isPending}
                                type="submit"
                              >
                                {saveProfile.isPending ? (
                                  <Loader2 className="animate-spin" />
                                ) : (
                                  <Save />
                                )}
                                Save section
                              </Button>
                              <Button
                                disabled={saveProfile.isPending}
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
            <VendorInventoryPage
              countries={countriesList}
              editingProvider={editingProvider}
              isLoadingProviders={providers.isLoading}
              isMutationPending={isVendorMutationPending}
              providerError={providers.error?.message ?? null}
              providers={providersList}
              serviceProviderUsage={serviceProviderUsage}
              showCustomVendorForm={showCustomVendorForm}
              showVendorCatalog={showVendorCatalog}
              vocabulary={vocabularyData}
              organizationProviders={organizationProviders}
              onCreateProviders={(providerInputs) =>
                createProviders.mutate(providerInputs, {
                  onSuccess: () => {
                    setShowVendorCatalog(false)
                    setShowCustomVendorForm(false)
                  },
                })
              }
              onDeleteProvider={(provider) => deleteProvider.mutate(provider.id)}
              onEditProvider={startEditingVendor}
              onShowCustomVendorFormChange={setShowCustomVendorForm}
              onShowVendorCatalogChange={setShowVendorCatalog}
              onSubmitProvider={(provider) => {
                if (editingProvider) {
                  updateProvider.mutate(
                    { id: editingProvider.id, provider },
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

                createProvider.mutate(provider, {
                  onSuccess: () => {
                    setShowVendorCatalog(false)
                    setShowCustomVendorForm(false)
                  },
                })
              }}
            />
          )}

          {activeWorkspaceView === "vocabulary" && (
            <Section
              description="Edit organization-owned vocabularies used by onboarding and provider records."
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
                              <Badge variant="code">
                                {summary.template.slug}
                              </Badge>
                              <Badge
                                variant={
                                  summary.status === "stale"
                                    ? "warning"
                                    : "secondary"
                                }
                              >
                                {documentStatusLabel(summary.status)}
                              </Badge>
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
