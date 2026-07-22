import { type DocumentSummary } from "@plyco/shared"

import { DocumentSummaryCard } from "@/features/documents/components/document-summary-card"
import { DocumentsEmptyState } from "@/features/documents/components/documents-empty-state"

export const DocumentsList = ({
  isLoading,
  documents,
  organizationName,
  hasTemplates,
  expandedTemplateIds,
  documentFilters,
  isPublishPending,
  isDownloadPending,
  onToggleExpand,
  onDocumentFilterChange,
  onDeleteTemplate,
  onPublish,
  onDownloadPdf,
}: {
  isLoading: boolean
  documents: DocumentSummary[]
  organizationName: string
  hasTemplates: boolean
  expandedTemplateIds: string[]
  documentFilters: Record<string, "current" | "all">
  isPublishPending: boolean
  isDownloadPending: boolean
  onToggleExpand: (templateId: string) => void
  onDocumentFilterChange: (
    templateId: string,
    filter: "current" | "all"
  ) => void
  onDeleteTemplate: (templateId: string) => void
  onPublish: (templateId: string, templateName: string) => void
  onDownloadPdf: (doc: { id: string; title: string }) => void
}) => {
  if (isLoading) {
    return (
      <p className="text-sm text-slate-500">
        Loading policies and documents...
      </p>
    )
  }

  if (!hasTemplates) {
    return <DocumentsEmptyState />
  }

  return (
    <div className="grid gap-4">
      {documents.map((summary) => (
        <DocumentSummaryCard
          key={summary.template.id}
          summary={summary}
          organizationName={organizationName}
          isExpanded={expandedTemplateIds.includes(summary.template.id)}
          documentFilter={documentFilters[summary.template.id] ?? "current"}
          isPublishPending={isPublishPending}
          isDownloadPending={isDownloadPending}
          onToggleExpand={() => onToggleExpand(summary.template.id)}
          onDocumentFilterChange={(filter) =>
            onDocumentFilterChange(summary.template.id, filter)
          }
          onDeleteTemplate={() => onDeleteTemplate(summary.template.id)}
          onPublish={() =>
            onPublish(summary.template.id, summary.template.name)
          }
          onDownloadPdf={onDownloadPdf}
        />
      ))}
    </div>
  )
}
