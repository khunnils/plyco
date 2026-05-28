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
import {
  type DocumentSummary,
  type Template,
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
import { PageHeader } from "@/features/shell/components/page-header"
import { TemplateForm } from "@/features/templates/components/template-form"
import { documentStatusLabel } from "@/features/documents/lib/document-status"

const blankTemplate: TemplateInput = {
  name: "",
  content: "",
  policyVersion: "",
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
  const { selectedOrganization } = useSelectedOrganization()
  const [expandedTemplateIds, setExpandedTemplateIds] = useState<string[]>([])
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

  // Setup header, breadcrumbs and action buttons based on mode
  let breadcrumbs = [{ label: "Policies & Documents", href: "/documents" }]
  const eyebrow = "Policies & Documents"
  let pageTitle = "Policies & Documents"

  let bannerTitle = "Documents & Policies"
  let bannerSubtitle = "Manage security policy templates and generate customized compliance documents."
  let bannerButtons: React.ReactNode = null
  let content: React.ReactNode = null

  if (mode === "add") {
    breadcrumbs = [
      { label: "Policies & Documents", href: "/documents" },
      { label: "Add" },
    ]
    pageTitle = "Add"
    bannerTitle = "Add template"
    bannerSubtitle = "Choose a pre-defined system template or start from scratch."
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
                    { onSuccess: () => navigate("/documents") }
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
    breadcrumbs = [
      { label: "Policies & Documents", href: "/documents" },
      { label: "New template" },
    ]
    pageTitle = "New template"
    bannerTitle = "New template"
    bannerSubtitle = "Draft a new policy template using markdown and schema variables."
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
        defaultValues={blankTemplate}
        isSaving={createTemplate.isPending}
        members={organizationMembersData}
        onCancel={() => navigate("/documents")}
        onSubmit={(template) =>
          createTemplate.mutate(template, {
            onSuccess: () => navigate("/documents"),
          })
        }
      />
    )
  } else if (mode === "edit") {
    breadcrumbs = [
      { label: "Policies & Documents", href: "/documents" },
      { label: editingTemplate?.name ?? "Edit template" },
    ]
    pageTitle = editingTemplate?.name ?? "Edit template"
    bannerTitle = editingTemplate?.name ?? "Edit template"
    bannerSubtitle = `Edit template version ${editingTemplate?.policyVersion || "1.0"}.`
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
        defaultValues={editingTemplate}
        isSaving={updateTemplate.isPending}
        members={organizationMembersData}
        onCancel={() => navigate("/documents")}
        onSubmit={(template) =>
          updateTemplate.mutate(
            { id: editingTemplate.id, template },
            { onSuccess: () => navigate("/documents") }
          )
        }
      />
    ) : (
      <p className="text-sm text-slate-500">Template was not found.</p>
    )
  } else if (mode === "view" && id) {
    breadcrumbs = [
      { label: "Policies & Documents", href: "/documents" },
      { label: documentRecord?.title ?? "Document" },
    ]
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
            onClick={() =>
              downloadDocumentPdf.mutate({
                id: documentRecord.id,
                title: documentRecord.title,
              })
            }
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
    breadcrumbs = [{ label: "Policies & Documents" }]
    pageTitle = "Policies & Documents"
    bannerTitle = "Documents & Policies"
    bannerSubtitle = "Manage security policy templates and generate customized compliance documents."
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
              className="border border-slate-200 bg-white rounded-md overflow-hidden"
              key={summary.template.id}
            >
              <div className="grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-start">
                <div className="flex items-start gap-2.5 min-w-0">
                  {summary.document ? (
                    <Button
                      size="icon-xs"
                      type="button"
                      variant="ghost"
                      onClick={toggleExpand}
                      className="mt-0.5 text-slate-500 hover:text-slate-900 shrink-0"
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
                      </h2>
                      <Badge
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
                <div className="flex flex-wrap justify-start gap-2 md:justify-end shrink-0">
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
                    onClick={() => deleteTemplate.mutate(summary.template.id)}
                    title="Delete template"
                  >
                    <Trash2 />
                  </Button>
                  {!summary.document && (
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
                      Publish
                    </Button>
                  )}
                </div>
              </div>

              {isExpanded && summary.document && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-4 pl-12">
                  <div className="flex items-center justify-between gap-4 py-2 bg-white border border-slate-100 rounded-md px-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="size-5 text-slate-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {getFileName(
                            selectedOrganization?.name ?? "organization",
                            summary.template.slug,
                            summary.template.policyVersion
                          )}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Published on {new Date(summary.document.generatedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="icon"
                        type="button"
                        variant="outline"
                        onClick={() =>
                          navigate(`/documents/view/${summary.document?.id}`)
                        }
                        title="Preview document"
                      >
                        <Eye />
                      </Button>
                      {summary.document.hasPdf && (
                        <Button
                          disabled={downloadDocumentPdf.isPending}
                          size="icon"
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
                          title="Download PDF"
                        >
                          <Download />
                        </Button>
                      )}
                    </div>
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-950">{bannerTitle}</h2>
            <p className="mt-1 text-sm text-slate-500">{bannerSubtitle}</p>
          </div>
          {bannerButtons ? (
            <div className="flex flex-wrap gap-2 shrink-0">{bannerButtons}</div>
          ) : null}
        </div>
        {content}
      </div>
    </>
  )
}
