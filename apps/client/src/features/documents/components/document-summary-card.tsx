import {
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  FileText,
  Pencil,
  Trash2,
} from "lucide-react"
import { type DocumentSummary } from "@plyco/shared"
import { useNavigate } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { documentStatusLabel } from "@/features/documents/lib/document-status"
import { getDocumentFileName } from "@/features/documents/lib/document-file-name"
import { getTemplateIcon } from "@/features/documents/lib/template-icons"
import { cn } from "@/lib/utils"

const generatedText = (summary: DocumentSummary) =>
  summary.document
    ? `Last generated on ${new Date(summary.document.generatedAt).toLocaleString()}`
    : "Never generated"

export const DocumentSummaryCard = ({
  summary,
  organizationName,
  isExpanded,
  documentFilter,
  isPublishPending,
  isDownloadPending,
  onToggleExpand,
  onDocumentFilterChange,
  onDeleteTemplate,
  onPublish,
  onDownloadPdf,
}: {
  summary: DocumentSummary
  organizationName: string
  isExpanded: boolean
  documentFilter: "current" | "all"
  isPublishPending: boolean
  isDownloadPending: boolean
  onToggleExpand: () => void
  onDocumentFilterChange: (filter: "current" | "all") => void
  onDeleteTemplate: () => void
  onPublish: () => void
  onDownloadPdf: (doc: { id: string; title: string }) => void
}) => {
  const navigate = useNavigate()
  const TemplateIcon = getTemplateIcon(
    summary.template.sourceSystemTemplateSlug ?? summary.template.slug
  )

  return (
    <article className="border border-slate-200 bg-white py-3 px-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div
          className={cn(
            "flex min-w-0 flex-1 items-start gap-3",
            summary.document ? "cursor-pointer select-none" : ""
          )}
          onClick={summary.document ? onToggleExpand : undefined}
        >
          <div className="mt-1 flex shrink-0 items-center justify-center ">
            <TemplateIcon className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
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
        <div className="flex shrink-0 flex-wrap gap-2">
          {summary.document ? (
            <Button
              aria-label={isExpanded ? "Collapse document" : "Expand document"}
              size="icon-sm"
              type="button"
              variant="outline"
              onClick={onToggleExpand}
            >
              {isExpanded ? <ChevronUp /> : <ChevronDown />}
            </Button>
          ) : null}
          <Button
            size="icon-sm"
            type="button"
            variant="outline"
            onClick={() => navigate(`/documents/edit/${summary.template.id}`)}
            title="Edit template"
          >
            <Pencil />
          </Button>
          <Button
            size="icon-sm"
            type="button"
            variant="outline"
            onClick={onDeleteTemplate}
            title="Delete template"
          >
            <Trash2 />
          </Button>
          <Button
            disabled={isPublishPending}
            size="sm"
            type="button"
            variant="outline"
            onClick={onPublish}
          >
            Publish
          </Button>
        </div>
      </div>

      {isExpanded && summary.document ? (
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3">
          {summary.documents && summary.documents.length > 1 ? (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Document Versions
              </span>
              <div className="flex items-center rounded-md border border-slate-200 bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => onDocumentFilterChange("current")}
                  className={`cursor-pointer rounded-sm px-2 py-1 text-xs font-medium ${
                    documentFilter === "current"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  Current
                </button>
                <button
                  type="button"
                  onClick={() => onDocumentFilterChange("all")}
                  className={`cursor-pointer rounded-sm px-2 py-1 text-xs font-medium ${
                    documentFilter === "all"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  All ({summary.documents.length})
                </button>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            {(documentFilter === "current"
              ? [summary.document]
              : summary.documents || []
            ).map((doc) => {
              if (!doc) return null
              const isCurrentVersion =
                doc.templateVersionMajor === summary.template.versionMajor &&
                doc.templateVersionMinor === summary.template.versionMinor

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
                          {getDocumentFileName(
                            organizationName,
                            summary.template.slug,
                            `${doc.templateVersionMajor}.${doc.templateVersionMinor}`
                          )}
                        </span>
                        {isCurrentVersion ? (
                          <span className="inline-flex items-center rounded-sm bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-blue-700/10 ring-inset">
                            Current
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Published on{" "}
                        {new Date(doc.generatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      size="icon-sm"
                      type="button"
                      variant="outline"
                      onClick={() => navigate(`/documents/view/${doc.id}`)}
                      title="Preview document"
                    >
                      <Eye />
                    </Button>
                    {doc.hasPdf ? (
                      <Button
                        disabled={isDownloadPending}
                        size="icon-sm"
                        type="button"
                        variant="outline"
                        onClick={() =>
                          onDownloadPdf({ id: doc.id, title: doc.title })
                        }
                        title="Download PDF"
                      >
                        <Download />
                      </Button>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </article>
  )
}
