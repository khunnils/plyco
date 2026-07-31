import { useState, type ReactNode } from "react"
import { usePostHog } from "@posthog/react"
import { type DocumentSummary, type TemplateCatalog } from "@plyco/shared"
import { Ellipsis, Pencil, Save, Trash2 } from "lucide-react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"

import { POSTHOG_EVENTS } from "@/lib/posthog-events"
import { useSelectedOrganization } from "@/features/organizations/hooks/use-selected-organization"
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
  useGenerateTemplate,
  useTemplates,
  useUpdateTemplate,
} from "@/features/documents/hooks/use-templates"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DocumentPreview } from "@/features/documents/components/document-preview"
import { DocumentView } from "@/features/documents/components/document-view"
import { DocumentsList } from "@/features/documents/components/documents-list"
import { DocumentsPageBanner } from "@/features/documents/components/documents-page-banner"
import { RenameTemplateDialog } from "@/features/documents/components/rename-template-dialog"
import { TemplateEditor } from "@/features/documents/components/template-editor"
import { TemplateCreator } from "@/features/documents/components/template-creator"
import { TemplateSelector } from "@/features/documents/components/template-selector"
import {
  PageHeader,
  type PageHeaderCrumb,
} from "@/features/shell/components/page-header"
import {
  SIDEBAR_SECTION,
  sectionPageBreadcrumbs,
} from "@/features/shell/lib/navigation"

const documentsNavItem = {
  label: "Policies & Documents",
  href: "/documents",
} as const

export const DocumentsRoutePage = () => {
  const { mode, id } = useParams()
  const navigate = useNavigate()
  const posthog = usePostHog()
  const { selectedOrganization } = useSelectedOrganization()
  const [templateSubmitIntent, setTemplateSubmitIntent] = useState<
    "save" | "publish" | null
  >(null)
  const [prevMode, setPrevMode] = useState(mode)
  const [prevId, setPrevId] = useState(id)
  const [templateName, setTemplateName] = useState("Untitled Template")
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const templates = useTemplates()
  const documents = useDocuments()
  const createTemplate = useCreateTemplate()
  const generateTemplate = useGenerateTemplate()
  const createTemplateFromSystem = useCreateTemplateFromSystem()
  const updateTemplate = useUpdateTemplate()
  const deleteTemplate = useDeleteTemplate()
  const createDocument = useCreateDocument()
  const document = useDocument(mode === "view" ? (id ?? null) : null)
  const downloadDocumentPdf = useDownloadDocumentPdf()

  const templatesData: TemplateCatalog = templates.data ?? {
    systemTemplates: [],
    organizationTemplates: [],
  }
  const documentsList: DocumentSummary[] = documents.data ?? []
  const selectedTemplate = templatesData.organizationTemplates.find(
    (template) => template.id === id
  )
  const selectedTemplateSummary = documentsList.find(
    (summary) => summary.template.id === id
  )
  const [prevEditingTemplateName, setPrevEditingTemplateName] = useState<
    string | undefined
  >(selectedTemplate?.name)

  if (mode !== prevMode || id !== prevId) {
    setPrevMode(mode)
    setPrevId(id)
    if (mode === "edit" && selectedTemplate) {
      setTemplateName(selectedTemplate.name)
      setPrevEditingTemplateName(selectedTemplate.name)
    } else if (mode === "new") {
      setTemplateName("Untitled Template")
      setPrevEditingTemplateName(undefined)
    }
  }

  if (
    mode === "edit" &&
    selectedTemplate &&
    selectedTemplate.name !== prevEditingTemplateName
  ) {
    setPrevEditingTemplateName(selectedTemplate.name)
    setTemplateName(selectedTemplate.name)
  }

  const viewedDocumentSummary = documentsList.find(
    (summary) => summary.document?.id === id
  )
  const documentRecord = document.data ?? null
  const addedSystemTemplateSlugs = new Set(
    templatesData.organizationTemplates
      .map((template) => template.sourceSystemTemplateSlug)
      .filter((slug): slug is string => Boolean(slug))
  )
  const isLoading = templates.isLoading || documents.isLoading

  if (
    mode === "preview" &&
    selectedTemplateSummary?.document &&
    !documents.isLoading
  ) {
    return (
      <Navigate
        replace
        to={`/documents/view/${selectedTemplateSummary.document.id}`}
      />
    )
  }

  if (mode === "create") {
    return (
      <TemplateCreator
        isPending={generateTemplate.isPending}
        onCancel={() => navigate("/documents/add")}
        onSubmit={(input) =>
          generateTemplate.mutate(input, {
            onSuccess: (createdTemplate) => {
              posthog.capture(POSTHOG_EVENTS.TEMPLATE_CREATED, {
                template_id: createdTemplate.id,
                creation_method: "natural_language",
              })
              navigate(`/documents/edit/${createdTemplate.id}`)
            },
          })
        }
      />
    )
  }

  const eyebrow = SIDEBAR_SECTION.documents
  let breadcrumbs: PageHeaderCrumb[]
  let pageTitle: string
  let bannerTitle = ""
  let bannerSubtitle = ""
  let bannerButtons: ReactNode = null
  let showBack = false
  let content: ReactNode

  if (mode === "add") {
    breadcrumbs = sectionPageBreadcrumbs(SIDEBAR_SECTION.documents, [
      documentsNavItem,
      { label: "Add" },
    ])
    pageTitle = "Add"
    content = (
      <TemplateSelector
        addedSystemTemplateSlugs={addedSystemTemplateSlugs}
        isLoading={templates.isLoading}
        submitDisabled={createTemplateFromSystem.isPending}
        systemTemplates={templatesData.systemTemplates}
        onCancel={() => navigate("/documents")}
        onChooseTemplates={(selectedTemplates) => {
          createTemplateFromSystem.mutate(
            selectedTemplates.map((template) => ({
              sourceSystemTemplateSlug: template.slug,
            })),
            {
              onSuccess: (createdTemplates) => {
                createdTemplates.forEach((createdTemplate, index) => {
                  const sourceSlug = selectedTemplates[index]?.slug
                  posthog.capture(POSTHOG_EVENTS.TEMPLATE_ADDED_FROM_SYSTEM, {
                    template_id: createdTemplate.id,
                    source_system_template_slug: sourceSlug,
                  })
                })
                navigate("/documents")
              },
            }
          )
        }}
      />
    )
  } else if (mode === "new" || mode === "edit") {
    breadcrumbs = sectionPageBreadcrumbs(SIDEBAR_SECTION.documents, [
      documentsNavItem,
      { label: templateName },
    ])
    pageTitle = templateName
    bannerTitle = templateName
    bannerSubtitle =
      mode === "new"
        ? "Draft a new policy template using markdown and schema variables."
        : selectedTemplate && selectedTemplateSummary?.document
          ? `Edit template version v${selectedTemplate.versionMajor}.${selectedTemplate.versionMinor}.`
          : "Edit this policy template draft."
    showBack = true
    const isTemplateMutationPending =
      createTemplate.isPending ||
      updateTemplate.isPending ||
      createDocument.isPending
    bannerButtons = (
      <>
        <Button
          disabled={isTemplateMutationPending}
          type="submit"
          form="template-form"
          name="intent"
          value="publish"
        >
          {templateSubmitIntent === "publish" && isTemplateMutationPending
            ? "Publishing..."
            : "Publish"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="Template actions"
              disabled={isTemplateMutationPending || deleteTemplate.isPending}
              size="icon"
              type="button"
              variant="outline"
            >
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => {
                const form = window.document.getElementById(
                  "template-form"
                ) as HTMLFormElement | null
                form?.requestSubmit()
              }}
            >
              <Save />
              {templateSubmitIntent === "save" && isTemplateMutationPending
                ? "Saving..."
                : "Save draft"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setIsRenameOpen(true)}>
              <Pencil /> Rename
            </DropdownMenuItem>
            {mode === "edit" && selectedTemplate ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => {
                    deleteTemplate.mutate(selectedTemplate.id, {
                      onSuccess: () => {
                        posthog.capture(POSTHOG_EVENTS.TEMPLATE_DELETED, {
                          template_id: selectedTemplate.id,
                        })
                        navigate("/documents")
                      },
                    })
                  }}
                >
                  <Trash2 />
                  {deleteTemplate.isPending ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    )
    content = (
      <TemplateEditor
        mode={mode}
        templateName={templateName}
        editingTemplate={selectedTemplate}
        onSaveDraft={(template) => {
          setTemplateSubmitIntent("save")

          if (mode === "new") {
            createTemplate.mutate(template, {
              onSuccess: (createdTemplate) => {
                posthog.capture(POSTHOG_EVENTS.TEMPLATE_CREATED, {
                  template_id: createdTemplate.id,
                })
                setTemplateSubmitIntent(null)
                navigate("/documents")
              },
              onError: () => setTemplateSubmitIntent(null),
            })
            return
          }

          if (!selectedTemplate) {
            setTemplateSubmitIntent(null)
            return
          }

          updateTemplate.mutate(
            { id: selectedTemplate.id, template },
            {
              onSuccess: (updatedTemplate) => {
                posthog.capture(POSTHOG_EVENTS.TEMPLATE_UPDATED, {
                  template_id: updatedTemplate.id,
                })
                setTemplateSubmitIntent(null)
                navigate("/documents")
              },
              onError: () => setTemplateSubmitIntent(null),
            }
          )
        }}
        onPublish={(template) => {
          setTemplateSubmitIntent("publish")

          const publishTemplate = (templateId: string, name: string) => {
            createDocument.mutate(
              { templateId },
              {
                onSuccess: (doc) => {
                  posthog.capture(POSTHOG_EVENTS.DOCUMENT_PUBLISHED, {
                    template_id: templateId,
                    template_name: name,
                    document_id: doc.id,
                  })
                  setTemplateSubmitIntent(null)
                  navigate("/documents")
                },
                onError: () => {
                  setTemplateSubmitIntent(null)
                  if (mode === "new") {
                    navigate(`/documents/edit/${templateId}`, { replace: true })
                  }
                },
              }
            )
          }

          if (mode === "new") {
            createTemplate.mutate(template, {
              onSuccess: (createdTemplate) => {
                posthog.capture(POSTHOG_EVENTS.TEMPLATE_CREATED, {
                  template_id: createdTemplate.id,
                })
                publishTemplate(createdTemplate.id, createdTemplate.name)
              },
              onError: () => setTemplateSubmitIntent(null),
            })
            return
          }

          if (!selectedTemplate) {
            setTemplateSubmitIntent(null)
            return
          }

          updateTemplate.mutate(
            { id: selectedTemplate.id, template },
            {
              onSuccess: (updatedTemplate) => {
                posthog.capture(POSTHOG_EVENTS.TEMPLATE_UPDATED, {
                  template_id: updatedTemplate.id,
                })
                publishTemplate(updatedTemplate.id, updatedTemplate.name)
              },
              onError: () => setTemplateSubmitIntent(null),
            }
          )
        }}
      />
    )
  } else if (mode === "preview" && id) {
    breadcrumbs = sectionPageBreadcrumbs(SIDEBAR_SECTION.documents, [
      documentsNavItem,
      { label: selectedTemplate?.name ?? "Preview" },
    ])
    pageTitle = selectedTemplate?.name ?? "Preview"
    bannerTitle = selectedTemplate?.name ?? "Preview"
    bannerSubtitle = selectedTemplate
      ? `Preview of current template version v${selectedTemplate.versionMajor}.${selectedTemplate.versionMinor}.`
      : "Preview the current template version with live organization data."
    bannerButtons = (
      <Button
        type="button"
        variant="outline"
        onClick={() => navigate("/documents")}
      >
        Close
      </Button>
    )
    content = documents.isLoading ? (
      <p className="text-sm text-slate-500">Loading preview...</p>
    ) : (
      <DocumentPreview
        isLoadingTemplate={templates.isLoading}
        template={selectedTemplate ?? null}
      />
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
    content = (
      <DocumentView isLoading={document.isLoading} document={documentRecord} />
    )
  } else {
    breadcrumbs = sectionPageBreadcrumbs(SIDEBAR_SECTION.documents, [
      { label: "Policies & Documents" },
    ])
    pageTitle = "Policies & Documents"
    bannerTitle = "Documents & Policies"
    bannerSubtitle =
      "Manage security policy templates and generate customized compliance documents."
    bannerButtons =
      !isLoading && templatesData.organizationTemplates.length > 0 ? (
        <Button asChild className="w-fit" type="button">
          <Link to="/documents/add">Add</Link>
        </Button>
      ) : null
    content = (
      <DocumentsList
        isLoading={isLoading}
        documents={documentsList}
        organizationName={selectedOrganization?.name ?? "organization"}
        hasTemplates={templatesData.organizationTemplates.length > 0}
        isDownloadPending={downloadDocumentPdf.isPending}
        onDeleteTemplate={(templateId) => {
          deleteTemplate.mutate(templateId, {
            onSuccess: () =>
              posthog.capture(POSTHOG_EVENTS.TEMPLATE_DELETED, {
                template_id: templateId,
              }),
          })
        }}
        onDownloadPdf={(doc) => {
          posthog.capture(POSTHOG_EVENTS.DOCUMENT_PDF_DOWNLOADED, {
            document_id: doc.id,
            document_title: doc.title,
          })
          downloadDocumentPdf.mutate(doc)
        }}
      />
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
        {mode !== "add" ? (
          <DocumentsPageBanner
            title={bannerTitle}
            subtitle={bannerSubtitle}
            actions={bannerButtons}
            onBack={showBack ? () => navigate("/documents") : undefined}
          />
        ) : null}
        {content}
      </div>

      {isRenameOpen ? (
        <RenameTemplateDialog
          templateName={templateName}
          onClose={() => setIsRenameOpen(false)}
          onRename={setTemplateName}
        />
      ) : null}
    </>
  )
}
