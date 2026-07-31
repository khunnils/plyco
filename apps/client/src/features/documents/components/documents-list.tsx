import { type DocumentSummary } from "@plyco/shared"

import { DocumentSummaryCard } from "@/features/documents/components/document-summary-card"
import { DocumentsEmptyState } from "@/features/documents/components/documents-empty-state"

export const DocumentsList = ({
  isLoading,
  documents,
  organizationName,
  hasTemplates,
  isDownloadPending,
  onDeleteTemplate,
  onDownloadPdf,
}: {
  isLoading: boolean
  documents: DocumentSummary[]
  organizationName: string
  hasTemplates: boolean
  isDownloadPending: boolean
  onDeleteTemplate: (templateId: string) => void
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
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {documents.map((summary) => (
        <DocumentSummaryCard
          key={summary.template.id}
          summary={summary}
          organizationName={organizationName}
          isDownloadPending={isDownloadPending}
          onDeleteTemplate={() => onDeleteTemplate(summary.template.id)}
          onDownloadPdf={onDownloadPdf}
        />
      ))}
    </div>
  )
}
