import {
  Building2,
  Check,
  Eye,
  FileText,
  LayoutDashboard,
  Loader2,
  Pencil,
  Plus,
  Save,
  ScrollText,
  Trash2,
  Users,
  X,
} from "lucide-react"
import {
  type Document,
  type DocumentSummary,
  type Provider,
  type Template,
  type TemplateCatalog,
  type TemplateInput,
  type Vendor,
  type VendorInput,
} from "@complyflow/shared"
import { useState, type FormEvent, type ReactNode } from "react"

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

const TemplateForm = ({
  defaultValues,
  saveState,
  onCancel,
  onSubmit,
}: {
  defaultValues: Template
  saveState: MutationState
  onCancel: () => void
  onSubmit: (template: TemplateInput) => void
}) => {
  const [draft, setDraft] = useState<TemplateInput>({
    name: defaultValues.name,
    slug: defaultValues.slug,
    content: defaultValues.content,
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(draft)
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-sm font-medium text-slate-700">Name</span>
          <input
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
            value={draft.name}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-medium text-slate-700">Slug</span>
          <input
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            required
            value={draft.slug}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                slug: event.target.value,
              }))
            }
          />
        </label>
      </div>
      <label className="grid gap-1">
        <span className="text-sm font-medium text-slate-700">Content</span>
        <textarea
          className="min-h-80 rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          value={draft.content}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              content: event.target.value,
            }))
          }
        />
      </label>
      <div className="flex gap-2">
        <Button disabled={saveState === "loading"} type="submit">
          {saveState === "loading" ? <Loader2 /> : <Save />}
          Save template
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

const TemplateCard = ({
  template,
  children,
}: {
  template: {
    slug: string
    name: string
    description?: string
    sourceSystemTemplateSlug?: string
  }
  children: ReactNode
}) => (
  <div className="grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_auto] md:items-start">
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold text-slate-950">{template.name}</h3>
        <span className="rounded-md bg-white px-2 py-1 font-mono text-xs text-slate-600 ring-1 ring-slate-200">
          {template.slug}
        </span>
      </div>
      {template.description ? (
        <p className="mt-2 text-sm text-slate-600">{template.description}</p>
      ) : null}
      {template.sourceSystemTemplateSlug ? (
        <p className="mt-2 text-xs text-slate-500">
          Copied from {template.sourceSystemTemplateSlug}
        </p>
      ) : null}
    </div>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
)

const documentStatusLabel = (status: DocumentSummary["status"]) => {
  if (status === "stale") {
    return "Outdated"
  }

  if (status === "current") {
    return "Generated"
  }

  return "Not generated"
}

const DocumentContent = ({ document }: { document: Document }) => (
  <article className="rounded-md border border-slate-200 bg-white p-5 font-mono text-sm leading-6 whitespace-pre-wrap text-slate-800">
    {document.renderedContent}
  </article>
)

export const Workspace = ({
  defaultValues,
  vendors,
  providers,
  providersError,
  providersLoading,
  document,
  documentLoading,
  documents,
  documentsLoading,
  templates,
  templatesLoading,
  error,
  saveState,
  onSaveProfile,
  onAddSystemTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onGenerateDocument,
  onCreateVendor,
  onUpdateVendor,
  onDeleteVendor,
}: {
  defaultValues: ProfileDraft
  vendors: Vendor[]
  providers: Provider[]
  providersError: string | null
  providersLoading: boolean
  document: Document | null
  documentLoading: boolean
  documents: DocumentSummary[]
  documentsLoading: boolean
  templates: TemplateCatalog
  templatesLoading: boolean
  error: string | null
  saveState: MutationState
  onSaveProfile: (profile: ProfileDraft) => void
  onAddSystemTemplate: (sourceSystemTemplateSlug: string) => void
  onUpdateTemplate: (id: string, template: TemplateInput) => void
  onDeleteTemplate: (template: Template) => void
  onGenerateDocument: (templateId: string) => void
  onCreateVendor: (vendor: VendorInput) => void
  onUpdateVendor: (id: string, vendor: VendorInput) => void
  onDeleteVendor: (vendor: Vendor) => void
}) => {
  const [showVendorCatalog, setShowVendorCatalog] = useState(false)
  const [showCustomVendorForm, setShowCustomVendorForm] = useState(false)
  const {
    activeWorkspaceView,
    editingCompanySection,
    editingTemplateId,
    editingVendorId,
    viewingDocumentId,
    setViewingDocument,
    setActiveWorkspaceView,
    setEditingCompanySection,
    startEditingTemplate,
    startEditingVendor,
  } = useSecurityUiStore()
  const editingVendor = vendors.find((vendor) => vendor.id === editingVendorId)
  const editingTemplate = templates.organizationTemplates.find(
    (template) => template.id === editingTemplateId
  )
  const dataTypeOptions = dataTypeOptionsFromProfile(
    defaultValues.dataHandling.dataTypesStored
  )
  const addedSystemTemplateSlugs = new Set(
    templates.organizationTemplates.map(
      (template) => template.sourceSystemTemplateSlug
    )
  )
  const viewedDocumentSummary = documents.find(
    (summary) => summary.document?.id === viewingDocumentId
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
                    : activeWorkspaceView === "templates"
                      ? "Templates"
                      : activeWorkspaceView === "documents"
                        ? "Documents"
                        : "Vendors"}
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-950">
                {activeWorkspaceView === "dashboard"
                  ? "Security readiness dashboard"
                  : activeWorkspaceView === "company"
                    ? "Company profile"
                    : activeWorkspaceView === "templates"
                      ? "Document templates"
                      : activeWorkspaceView === "documents"
                        ? "Generated documents"
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

          {activeWorkspaceView === "templates" && (
            <div className="grid gap-5">
              <Section
                description="Versioned starter markdown templates with Jinja-style placeholders."
                title="System templates"
              >
                {templatesLoading ? (
                  <p className="text-sm text-slate-500">Loading templates...</p>
                ) : templates.systemTemplates.length > 0 ? (
                  templates.systemTemplates.map((template) => {
                    const isAdded = addedSystemTemplateSlugs.has(template.slug)

                    return (
                      <TemplateCard key={template.slug} template={template}>
                        <Button
                          disabled={isAdded || saveState === "loading"}
                          type="button"
                          onClick={() => onAddSystemTemplate(template.slug)}
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
                    saveState={saveState}
                    onCancel={() => startEditingTemplate(null)}
                    onSubmit={(template) => {
                      onUpdateTemplate(editingTemplate.id, template)
                      startEditingTemplate(null)
                    }}
                  />
                ) : templates.organizationTemplates.length > 0 ? (
                  templates.organizationTemplates.map((template) => (
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
                        onClick={() => onDeleteTemplate(template)}
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
                  title={document?.title ?? "Document"}
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
                  {documentLoading ? (
                    <p className="text-sm text-slate-500">
                      Loading document...
                    </p>
                  ) : document ? (
                    <DocumentContent document={document} />
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
                  {documentsLoading ? (
                    <p className="text-sm text-slate-500">
                      Loading documents...
                    </p>
                  ) : documents.length > 0 ? (
                    documents.map((summary) => {
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
                            ) : (
                              <Button
                                disabled={saveState === "loading"}
                                type="button"
                                variant="outline"
                                onClick={() =>
                                  onGenerateDocument(summary.template.id)
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
