import {
  Download,
  Eye,
  FilePlus2,
  FileText,
  Pencil,
  Plus,
  ScrollText,
  Trash2,
  X,
} from "lucide-react"
import {
  type DocumentSummary,
  type Template,
  type TemplateCatalog,
  type TemplateInput,
} from "@plyco/shared"
import { Link, useNavigate, useParams } from "react-router-dom"

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
  slug: "",
  content: "",
  policyEffectiveDate: "",
  policyLastReviewedDate: "",
  policyVersion: "",
  policyOwnerUserId: "",
  policyApproverUserId: "",
  policyReviewCadence: "",
}

const generatedText = (summary: DocumentSummary) =>
  summary.document
    ? `Last generated on ${new Date(summary.document.generatedAt).toLocaleString()}`
    : "Never generated"

const sourceLabel = (template: Template) =>
  template.sourceSystemTemplateSlug
    ? `Copied from ${template.sourceSystemTemplateSlug}`
    : "Created from scratch"

export const DocumentsRoutePage = () => {
  const { mode, id } = useParams()
  const navigate = useNavigate()
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

  if (mode === "add") {
    return (
      <>
        <PageHeader
          breadcrumbs={[
            { label: "Policies & Documents", href: "/documents" },
            { label: "Add" },
          ]}
          eyebrow="Policies & Documents"
          title="Add"
        />
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
                    <Badge variant="code">{template.slug}</Badge>
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
      </>
    )
  }

  if (mode === "new") {
    return (
      <>
        <PageHeader
          breadcrumbs={[
            { label: "Policies & Documents", href: "/documents" },
            { label: "New template" },
          ]}
          eyebrow="Policies & Documents"
          title="New template"
        />
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
      </>
    )
  }

  if (mode === "edit") {
    return (
      <>
        <PageHeader
          breadcrumbs={[
            { label: "Policies & Documents", href: "/documents" },
            { label: editingTemplate?.name ?? "Edit template" },
          ]}
          eyebrow="Policies & Documents"
          title={editingTemplate?.name ?? "Edit template"}
        />
        {editingTemplate ? (
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
        )}
      </>
    )
  }

  if (mode === "view" && id) {
    return (
      <>
        <PageHeader
          breadcrumbs={[
            { label: "Policies & Documents", href: "/documents" },
            { label: documentRecord?.title ?? "Document" },
          ]}
          eyebrow="Policies & Documents"
          title={documentRecord?.title ?? "Document"}
        />
        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            <Button
              className="w-fit"
              type="button"
              variant="outline"
              onClick={() => navigate("/documents")}
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
          </div>
          {document.isLoading ? (
            <p className="text-sm text-slate-500">Loading document...</p>
          ) : documentRecord ? (
            <>
              {viewedDocumentSummary ? (
                <p className="text-sm text-slate-500">
                  Generated from {viewedDocumentSummary.template.name}.
                </p>
              ) : null}
              <DocumentContent document={documentRecord} />
            </>
          ) : (
            <p className="text-sm text-slate-500">Document was not found.</p>
          )}
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader eyebrow="Policies & Documents" title="Policies & Documents" />
      <div className="grid gap-5">
        <div className="flex justify-end">
          <Button asChild className="w-fit" type="button">
            <Link to="/documents/add">
              <Plus />
              Add
            </Link>
          </Button>
        </div>

        {isLoading ? (
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
                <Link to="/documents/add">
                  <Plus />
                  Add
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid gap-4">
            {documentsList.map((summary) => (
              <article
                className="grid gap-4 border border-slate-200 bg-white p-4 md:grid-cols-[1fr_auto] md:items-start"
                key={summary.template.id}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-slate-950">
                      {summary.template.name}
                    </h2>
                    <Badge variant="code">{summary.template.slug}</Badge>
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
                  <p className="mt-2 text-sm text-slate-500">
                    {sourceLabel(summary.template)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {generatedText(summary)}
                  </p>
                </div>
                <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      navigate(`/documents/edit/${summary.template.id}`)
                    }
                  >
                    <Pencil />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => deleteTemplate.mutate(summary.template.id)}
                  >
                    <Trash2 />
                    Delete
                  </Button>
                  {summary.document ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          navigate(`/documents/view/${summary.document?.id}`)
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
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
