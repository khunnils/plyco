import { useState, type ReactNode } from "react"
import { usePostHog } from "@posthog/react"
import { type DocumentSummary, type TemplateCatalog } from "@plyco/shared"
import { Link, useNavigate, useParams } from "react-router-dom"

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
  useTemplates,
  useUpdateTemplate,
} from "@/features/documents/hooks/use-templates"
import { Button } from "@/components/ui/button"
import { DocumentPreview } from "@/features/documents/components/document-preview"
import { DocumentView } from "@/features/documents/components/document-view"
import { DocumentsList } from "@/features/documents/components/documents-list"
import { DocumentsPageBanner } from "@/features/documents/components/documents-page-banner"
import { RenameTemplateDialog } from "@/features/documents/components/rename-template-dialog"
import { TemplateEditor } from "@/features/documents/components/template-editor"
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

  const templatesData: TemplateCatalog = templates.data ?? {
    systemTemplates: [],
    organizationTemplates: [],
  }
  const documentsList: DocumentSummary[] = documents.data ?? []
  const selectedTemplate = templatesData.organizationTemplates.find(
    (template) => template.id === id
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

  const eyebrow = SIDEBAR_SECTION.documents
  let breadcrumbs: PageHeaderCrumb[]
  let pageTitle: string
  let bannerTitle = ""
  let bannerSubtitle = ""
  let bannerButtons: ReactNode = null
  let showRename = false
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
        : `Edit template version ${selectedTemplate ? `v${selectedTemplate.versionMajor}.${selectedTemplate.versionMinor}` : "1.0"}.`
    showRename = true
    bannerButtons = (
      <>
        <Button
          disabled={
            mode === "new" ? createTemplate.isPending : updateTemplate.isPending
          }
          type="submit"
          form="template-form"
        >
          {(
            mode === "new" ? createTemplate.isPending : updateTemplate.isPending
          )
            ? "Saving..."
            : "Save"}
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
      <TemplateEditor
        mode={mode}
        templateName={templateName}
        editingTemplate={selectedTemplate}
        onCreate={(template) =>
          createTemplate.mutate(template, {
            onSuccess: (createdTemplate) => {
              posthog.capture(POSTHOG_EVENTS.TEMPLATE_CREATED, {
                template_id: createdTemplate.id,
              })
              navigate("/documents")
            },
          })
        }
        onUpdate={(template) => {
          if (!selectedTemplate) return
          updateTemplate.mutate(
            { id: selectedTemplate.id, template },
            {
              onSuccess: (updatedTemplate) => {
                posthog.capture(POSTHOG_EVENTS.TEMPLATE_UPDATED, {
                  template_id: updatedTemplate.id,
                })
                navigate("/documents")
              },
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
    content = (
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
        expandedTemplateIds={expandedTemplateIds}
        documentFilters={documentFilters}
        isPublishPending={createDocument.isPending}
        isDownloadPending={downloadDocumentPdf.isPending}
        onToggleExpand={(templateId) => {
          setExpandedTemplateIds((prev) =>
            prev.includes(templateId)
              ? prev.filter((currentId) => currentId !== templateId)
              : [...prev, templateId]
          )
        }}
        onDocumentFilterChange={(templateId, filter) => {
          setDocumentFilters((prev) => ({
            ...prev,
            [templateId]: filter,
          }))
        }}
        onDeleteTemplate={(templateId) => {
          deleteTemplate.mutate(templateId, {
            onSuccess: () =>
              posthog.capture(POSTHOG_EVENTS.TEMPLATE_DELETED, {
                template_id: templateId,
              }),
          })
        }}
        onPublish={(templateId, templateNameValue) => {
          createDocument.mutate(
            { templateId },
            {
              onSuccess: (doc) => {
                posthog.capture(POSTHOG_EVENTS.DOCUMENT_PUBLISHED, {
                  template_id: templateId,
                  template_name: templateNameValue,
                  document_id: doc.id,
                })
              },
            }
          )
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
            showRename={showRename}
            actions={bannerButtons}
            onRenameClick={() => setIsRenameOpen(true)}
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
