import { useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  FilePlus2,
  FileText,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import { usePostHog } from "@posthog/react"

import { POSTHOG_EVENTS } from "@/lib/posthog-events"
import {
  type DocumentSummary,
  type TemplateCatalog,
  type TemplateInput,
} from "@plyco/shared"
import { Link, useNavigate, useParams } from "react-router-dom"

import { useSelectedOrganization } from "@/features/organizations/hooks/use-selected-organization"
import { cn } from "@/lib/utils"

import {
  useCreateDocument,
  useDocument,
  useDocuments,
  useDownloadDocumentPdf,
} from "@/features/documents/hooks/use-documents"
import {
  useCreateTemplate,
  useCreateTemplateFromSystem,
  useDeleteTemplate,
  useOrganizationMembers,
  useTemplates,
  useUpdateTemplate,
} from "@/features/templates/hooks/use-templates"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { DocumentContent } from "@/features/documents/components/document-content"
import {
  PageHeader,
  type PageHeaderCrumb,
} from "@/features/shell/components/page-header"
import {
  SIDEBAR_SECTION,
  sectionPageBreadcrumbs,
} from "@/features/shell/lib/navigation"
import { TemplateForm } from "@/features/templates/components/template-form"
import { documentStatusLabel } from "@/features/documents/lib/document-status"

const blankTemplate: TemplateInput = {
  name: "Untitled Template",
  content: "",
}

const generatedText = (summary: DocumentSummary) =>
  summary.document
    ? `Last generated on ${new Date(summary.document.generatedAt).toLocaleString()}`
    : "Never generated"

const getFileName = (orgName: string, slug: string, version: string) => {
  const o = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
  const s = slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
  let v = version.trim().toLowerCase()
  if (!v) {
    v = "v1.0"
  } else if (!v.startsWith("v")) {
    v = `v${v}`
  }
  return `${o}_${s}_${v}.pdf`
}

export const DocumentsRoutePage = () => {
  const { mode, id } = useParams()
  const navigate = useNavigate()
  const posthog = usePostHog()
  const { selectedOrganization } = useSelectedOrganization()
  const [expandedTemplateIds, setExpandedTemplateIds] = useState<string[]>([])
  const [documentFilters, setDocumentFilters] = useState<
    Record<string, "current" | "all">
  >({})
  const [prevMode, setPrevMode] = useState(mode)
  const [prevId, setPrevId] = useState(id)
  const [templateName, setTemplateName] = useState("Untitled Template")
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const templates = useTemplates()
  const documents = useDocuments()
  const createTemplate = useCreateTemplate()
  const createTemplateFromSystem = useCreateTemplateFromSystem()
  const updateTemplate = useUpdateTemplate()
  const deleteTemplate = useDeleteTemplate()
  const createDocument = useCreateDocument()
  const document = useDocument(mode === "view" ? (id ?? null) : null)
  const downloadDocumentPdf = useDownloadDocumentPdf()
  const organizationMembers = useOrganizationMembers()

  const templatesData: TemplateCatalog = templates.data ?? {
    systemTemplates: [],
    organizationTemplates: [],
  }
  const documentsList: DocumentSummary[] = documents.data ?? []
  const organizationMembersData = organizationMembers.data ?? []
  const editingTemplate = templatesData.organizationTemplates.find(
    (template) => template.id === id
  )
  const [prevEditingTemplateName, setPrevEditingTemplateName] = useState<
    string | undefined
  >(editingTemplate?.name)

  // Sync state during render when route params change
  if (mode !== prevMode || id !== prevId) {
    setPrevMode(mode)
    setPrevId(id)
    if (mode === "edit" && editingTemplate) {
      setTemplateName(editingTemplate.name)
      setPrevEditingTemplateName(editingTemplate.name)
    } else if (mode === "new") {
      setTemplateName("Untitled Template")
      setPrevEditingTemplateName(undefined)
    }
  }

  // Sync state during render when editingTemplate loads asynchronously
  if (
    mode === "edit" &&
    editingTemplate &&
    editingTemplate.name !== prevEditingTemplateName
  ) {
    setPrevEditingTemplateName(editingTemplate.name)
    setTemplateName(editingTemplate.name)
  }

  const viewedDocumentSummary = documentsList.find(
    (summary) => summary.document?.id === id
  )
  const documentRecord = document.data ?? null
  const addedSystemTemplateSlugs = new Set(
    templatesData.organizationTemplates
      .map((template) => template.sourceSystemTemplateSlug)
      .filter(Boolean)
  )
  const isLoading = templates.isLoading || documents.isLoading

  const documentsNavItem = {
    label: "Policies & Documents",
    href: "/documents",
  } as const

  // Setup header, breadcrumbs and action buttons based on mode
  const eyebrow = SIDEBAR_SECTION.documents
  let breadcrumbs: PageHeaderCrumb[]
  let pageTitle: string
  let bannerTitle: string
  let bannerSubtitle: string
  let bannerButtons: React.ReactNode
  let content: React.ReactNode

  if (mode === "add") {
    breadcrumbs = sectionPageBreadcrumbs(SIDEBAR_SECTION.documents, [
      documentsNavItem,
      { label: "Add" },
    ])
    pageTitle = "Add"
    bannerTitle = "Add template"
    bannerSubtitle =
      "Choose a pre-defined system template or start from scratch."
    bannerButtons = (
      <Button asChild type="button" variant="outline">
        <Link to="/documents">Cancel</Link>
      </Button>
    )

    content = (
      <div className="grid gap-4">
        <article className="grid gap-4 border border-slate-200 bg-white p-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <FilePlus2 className="size-5 text-slate-500" />
              <h2 className="font-semibold text-slate-950">
                Create from scratch
              </h2>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Start with a blank policy template and write your own content.
            </p>
          </div>
          <Button asChild className="w-fit" type="button">
            <Link to="/documents/new">Create</Link>
          </Button>
        </article>

        {templatesData.systemTemplates.map((template) => {
          const isAdded = addedSystemTemplateSlugs.has(template.slug)

          return (
            <article
              className="grid gap-4 border border-slate-200 bg-white p-5 md:grid-cols-[1fr_auto] md:items-start"
              key={template.slug}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-slate-950">
                    {template.name}
                  </h2>
                  {isAdded ? <Badge variant="secondary">Added</Badge> : null}
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {template.description}
                </p>
              </div>
              <Button
                className="w-fit"
                disabled={isAdded || createTemplateFromSystem.isPending}
                type="button"
                variant={isAdded ? "outline" : "default"}
                onClick={() =>
                  createTemplateFromSystem.mutate(
                    { sourceSystemTemplateSlug: template.slug },
                    {
                      onSuccess: (createdTemplate) => {
                        posthog.capture(
                          POSTHOG_EVENTS.TEMPLATE_ADDED_FROM_SYSTEM,
                          {
                            template_id: createdTemplate.id,
                            source_system_template_slug: template.slug,
                          }
                        )
                        navigate("/documents")
                      },
                    }
                  )
                }
              >
                <Plus />
                {isAdded ? "Added" : "Add"}
              </Button>
            </article>
          )
        })}
      </div>
    )
  } else if (mode === "new") {
    breadcrumbs = sectionPageBreadcrumbs(SIDEBAR_SECTION.documents, [
      documentsNavItem,
      { label: templateName },
    ])
    pageTitle = templateName
    bannerTitle = templateName
    bannerSubtitle =
      "Draft a new policy template using markdown and schema variables."
    bannerButtons = (
      <>
        <Button
          disabled={createTemplate.isPending}
          type="submit"
          form="template-form"
        >
          {createTemplate.isPending ? "Saving..." : "Save template"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/documents")}
        >
          Cancel
        </Button>
      </>
    )

    content = (
      <TemplateForm
        name={templateName}
        defaultValues={blankTemplate}
        members={organizationMembersData}
        onSubmit={(template) =>
          createTemplate.mutate(template, {
            onSuccess: (createdTemplate) => {
              posthog.capture(POSTHOG_EVENTS.TEMPLATE_CREATED, {
                template_id: createdTemplate.id,
              })
              navigate("/documents")
            },
          })
        }
      />
    )
  } else if (mode === "edit") {
    breadcrumbs = sectionPageBreadcrumbs(SIDEBAR_SECTION.documents, [
      documentsNavItem,
      { label: templateName },
    ])
    pageTitle = templateName
    bannerTitle = templateName
    bannerSubtitle = `Edit template version ${editingTemplate ? `v${editingTemplate.versionMajor}.${editingTemplate.versionMinor}` : "1.0"}.`
    bannerButtons = (
      <>
        <Button
          disabled={updateTemplate.isPending}
          type="submit"
          form="template-form"
        >
          {updateTemplate.isPending ? "Saving..." : "Save template"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/documents")}
        >
          Cancel
        </Button>
      </>
    )

    content = editingTemplate ? (
      <TemplateForm
        name={templateName}
        defaultValues={editingTemplate}
        members={organizationMembersData}
        onSubmit={(template) =>
          updateTemplate.mutate(
            { id: editingTemplate.id, template },
            {
              onSuccess: (updatedTemplate) => {
                posthog.capture(POSTHOG_EVENTS.TEMPLATE_UPDATED, {
                  template_id: updatedTemplate.id,
                })
                navigate("/documents")
              },
            }
          )
        }
      />
    ) : (
      <p className="text-sm text-slate-500">Template was not found.</p>
    )
  } else if (mode === "view" && id) {
    breadcrumbs = sectionPageBreadcrumbs(SIDEBAR_SECTION.documents, [
      documentsNavItem,
      { label: documentRecord?.title ?? "Document" },
    ])
    pageTitle = documentRecord?.title ?? "Document"
    bannerTitle = documentRecord?.title ?? "Document"
    bannerSubtitle = viewedDocumentSummary
      ? `Generated from ${viewedDocumentSummary.template.name}.`
      : "View customized document content."
    bannerButtons = (
      <>
        {documentRecord?.hasPdf ? (
          <Button
            disabled={downloadDocumentPdf.isPending}
            type="button"
            variant="outline"
            onClick={() => {
              posthog.capture(POSTHOG_EVENTS.DOCUMENT_PDF_DOWNLOADED, {
                document_id: documentRecord.id,
                document_title: documentRecord.title,
              })
              downloadDocumentPdf.mutate({
                id: documentRecord.id,
                title: documentRecord.title,
              })
            }}
          >
            Download PDF
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/documents")}
        >
          Close
        </Button>
      </>
    )

    content = document.isLoading ? (
      <p className="text-sm text-slate-500">Loading document...</p>
    ) : documentRecord ? (
      <DocumentContent document={documentRecord} />
    ) : (
      <p className="text-sm text-slate-500">Document was not found.</p>
    )
  } else {
    // List view
    breadcrumbs = sectionPageBreadcrumbs(SIDEBAR_SECTION.documents, [
      { label: "Policies & Documents" },
    ])
    pageTitle = "Policies & Documents"
    bannerTitle = "Documents & Policies"
    bannerSubtitle =
      "Manage security policy templates and generate customized compliance documents."
    bannerButtons = (
      <Button asChild className="w-fit" type="button">
        <Link to="/documents/add">Add</Link>
      </Button>
    )

    content = isLoading ? (
      <p className="text-sm text-slate-500">
        Loading policies and documents...
      </p>
    ) : templatesData.organizationTemplates.length === 0 ? (
      <Empty className="min-h-[420px] border-slate-200 bg-white">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileText />
          </EmptyMedia>
          <EmptyTitle>No policy templates yet</EmptyTitle>
          <EmptyDescription>
            Add a system template or create a policy template from scratch
            before generating documents.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild type="button">
            <Link to="/documents/add">Add</Link>
          </Button>
        </EmptyContent>
      </Empty>
    ) : (
      <div className="grid gap-4">
        {documentsList.map((summary) => {
          const isExpanded = expandedTemplateIds.includes(summary.template.id)
          const toggleExpand = () => {
            setExpandedTemplateIds((prev) =>
              prev.includes(summary.template.id)
                ? prev.filter((id) => id !== summary.template.id)
                : [...prev, summary.template.id]
            )
          }

          return (
            <article
              className="overflow-hidden rounded-md border border-slate-200 bg-white"
              key={summary.template.id}
            >
              <div className="grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-start">
                <div className="flex min-w-0 items-start gap-2.5">
                  {summary.document ? (
                    <Button
                      size="icon-xs"
                      type="button"
                      variant="ghost"
                      onClick={toggleExpand}
                      className="mt-0.5 shrink-0 text-slate-500 hover:text-slate-900"
                    >
                      {isExpanded ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </Button>
                  ) : (
                    <div className="size-6 shrink-0" />
                  )}
                  <div
                    className={cn(
                      "min-w-0 flex-1",
                      summary.document ? "cursor-pointer select-none" : ""
                    )}
                    onClick={summary.document ? toggleExpand : undefined}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-slate-950">
                        {summary.template.name}
                        <span className="ml-2 text-xs font-normal text-slate-500">
                          v{summary.template.versionMajor}.
                          {summary.template.versionMinor}
                        </span>
                      </h2>
                      <Badge
                        title={
                          summary.staleReasons.length
                            ? summary.staleReasons.join("\n")
                            : undefined
                        }
                        variant={
                          summary.status === "stale"
                            ? "warning"
                            : summary.status === "current"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {documentStatusLabel(summary.status)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {generatedText(summary)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap justify-start gap-2 md:justify-end">
                  <Button
                    size="icon"
                    type="button"
                    variant="outline"
                    onClick={() =>
                      navigate(`/documents/edit/${summary.template.id}`)
                    }
                    title="Edit template"
                  >
                    <Pencil />
                  </Button>
                  <Button
                    size="icon"
                    type="button"
                    variant="destructive"
                    onClick={() =>
                      deleteTemplate.mutate(summary.template.id, {
                        onSuccess: () =>
                          posthog.capture(POSTHOG_EVENTS.TEMPLATE_DELETED, {
                            template_id: summary.template.id,
                          }),
                      })
                    }
                    title="Delete template"
                  >
                    <Trash2 />
                  </Button>
                  <Button
                    disabled={createDocument.isPending}
                    type="button"
                    variant="outline"
                    onClick={() =>
                      createDocument.mutate(
                        { templateId: summary.template.id },
                        {
                          onSuccess: (doc) => {
                            posthog.capture(POSTHOG_EVENTS.DOCUMENT_PUBLISHED, {
                              template_id: summary.template.id,
                              template_name: summary.template.name,
                              document_id: doc.id,
                            })
                          },
                        }
                      )
                    }
                  >
                    Publish
                  </Button>
                </div>
              </div>

              {isExpanded && summary.document && (
                <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 p-4 pl-12">
                  {summary.documents && summary.documents.length > 1 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">
                        Document Versions
                      </span>
                      <div className="flex items-center rounded-md border border-slate-200 bg-white p-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            setDocumentFilters((prev) => ({
                              ...prev,
                              [summary.template.id]: "current",
                            }))
                          }
                          className={`cursor-pointer rounded-sm px-2 py-1 text-xs font-medium ${
                            (documentFilters[summary.template.id] ??
                              "current") === "current"
                              ? "bg-slate-900 text-white"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          }`}
                        >
                          Current
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDocumentFilters((prev) => ({
                              ...prev,
                              [summary.template.id]: "all",
                            }))
                          }
                          className={`cursor-pointer rounded-sm px-2 py-1 text-xs font-medium ${
                            documentFilters[summary.template.id] === "all"
                              ? "bg-slate-900 text-white"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          }`}
                        >
                          All ({summary.documents.length})
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    {((documentFilters[summary.template.id] ?? "current") ===
                    "current"
                      ? [summary.document]
                      : summary.documents || []
                    ).map((doc) => {
                      if (!doc) return null
                      const isCurrentVersion =
                        doc.templateVersionMajor ===
                          summary.template.versionMajor &&
                        doc.templateVersionMinor ===
                          summary.template.versionMinor

                      return (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between gap-4 rounded-md border border-slate-100 bg-white px-3 py-2"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <FileText className="size-5 shrink-0 text-slate-500" />
                            <div className="min-w-0">
                              <p className="flex items-center gap-2 truncate text-sm font-medium text-slate-900">
                                <span>
                                  {getFileName(
                                    selectedOrganization?.name ??
                                      "organization",
                                    summary.template.slug,
                                    `${doc.templateVersionMajor}.${doc.templateVersionMinor}`
                                  )}
                                </span>
                                {isCurrentVersion && (
                                  <span className="inline-flex items-center rounded-sm bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-blue-700/10 ring-inset">
                                    Current
                                  </span>
                                )}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500">
                                Published on{" "}
                                {new Date(doc.generatedAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Button
                              size="icon"
                              type="button"
                              variant="outline"
                              onClick={() =>
                                navigate(`/documents/view/${doc.id}`)
                              }
                              title="Preview document"
                            >
                              <Eye />
                            </Button>
                            {doc.hasPdf && (
                              <Button
                                disabled={downloadDocumentPdf.isPending}
                                size="icon"
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  posthog.capture(
                                    POSTHOG_EVENTS.DOCUMENT_PDF_DOWNLOADED,
                                    {
                                      document_id: doc.id,
                                      document_title: doc.title,
                                    }
                                  )
                                  downloadDocumentPdf.mutate({
                                    id: doc.id,
                                    title: doc.title,
                                  })
                                }}
                                title="Download PDF"
                              >
                                <Download />
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>
    )
  }

  return (
    <>
      <PageHeader
        breadcrumbs={breadcrumbs}
        eyebrow={eyebrow}
        title={pageTitle}
      />
      <div className="grid gap-5">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
              <span>{bannerTitle}</span>
              {(mode === "new" || mode === "edit") && (
                <button
                  type="button"
                  onClick={() => setIsRenameOpen(true)}
                  className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  title="Rename template"
                >
                  <Pencil className="size-3.5" />
                </button>
              )}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{bannerSubtitle}</p>
          </div>
          {bannerButtons ? (
            <div className="flex shrink-0 flex-wrap gap-2">{bannerButtons}</div>
          ) : null}
        </div>
        {content}
      </div>

      {isRenameOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="animate-in fade-in zoom-in-95 w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl duration-150">
            <h3 className="text-lg font-semibold text-slate-950">
              Rename template
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Enter a new name for this policy template.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const newName = (formData.get("name") as string)?.trim()
                if (newName) {
                  setTemplateName(newName)
                }
                setIsRenameOpen(false)
              }}
              className="mt-4 grid gap-4"
            >
              <input
                autoComplete="new-password"
                name="name"
                type="text"
                defaultValue={templateName}
                required
                autoFocus
                className="field-focus-compact h-11 w-full rounded-sm border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 transition outline-none"
                placeholder="Template name"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRenameOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Rename</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
