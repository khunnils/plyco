import {
  AlertTriangle,
  Download,
  Ellipsis,
  Eye,
  History,
  Trash2,
} from "lucide-react"
import { type DocumentSummary } from "@plyco/shared"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DocumentHistoryDialog } from "@/features/documents/components/document-history-dialog"
import { getTemplateIcon } from "@/features/documents/lib/template-icons"

const generatedText = (summary: DocumentSummary) =>
  summary.document
    ? `Last published ${new Date(summary.document.generatedAt).toLocaleDateString()}`
    : "Not published"

export const DocumentSummaryCard = ({
  summary,
  organizationName,
  isDownloadPending,
  onDeleteTemplate,
  onDownloadPdf,
}: {
  summary: DocumentSummary
  organizationName: string
  isDownloadPending: boolean
  onDeleteTemplate: () => void
  onDownloadPdf: (doc: { id: string; title: string }) => void
}) => {
  const navigate = useNavigate()
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const TemplateIcon = getTemplateIcon(
    summary.template.sourceSystemTemplateSlug ?? summary.template.slug
  )
  const publishedDocument = summary.document

  return (
    <article className="group relative flex min-h-80 overflow-hidden border border-slate-200 bg-white shadow-sm transition-[border-color,box-shadow] duration-200 focus-within:border-slate-300 focus-within:shadow-md hover:border-slate-300 hover:shadow-md">
      <Link
        aria-label={`Edit ${summary.template.name}`}
        className="flex min-w-0 flex-1 cursor-pointer flex-col p-5 outline-none focus-visible:ring-3 focus-visible:ring-slate-100 focus-visible:ring-inset"
        to={`/documents/edit/${summary.template.id}`}
      >
        <div className="flex items-start justify-between gap-3 pr-8">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-slate-100 text-slate-700">
            <TemplateIcon className="size-4" />
          </span>
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
            {summary.status === "not_generated" ? (
              <Badge variant="outline">Draft</Badge>
            ) : null}
            {summary.status === "stale" ? (
              <span
                aria-label="Published document is outdated"
                className="inline-flex text-amber-600"
                role="img"
                title={
                  summary.staleReasons.length
                    ? summary.staleReasons.join("\n")
                    : "Published document is outdated"
                }
              >
                <AlertTriangle aria-hidden="true" className="size-4" />
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-base font-semibold text-slate-950">
            {summary.template.name}
          </h2>
          {publishedDocument ? (
            <p className="mt-1 text-xs text-slate-500">
              Version {summary.template.versionMajor}.
              {summary.template.versionMinor}
            </p>
          ) : null}
        </div>

        <p className="mt-6 line-clamp-6 text-xs leading-5 whitespace-pre-wrap text-slate-400">
          {summary.template.content || "Empty template"}
        </p>

        <div className="mt-auto border-t border-slate-100 pt-4 text-xs text-slate-500">
          {generatedText(summary)}
        </div>
      </Link>

      <div className="absolute top-3 right-3 z-10 opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={`Actions for ${summary.template.name}`}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {publishedDocument ? (
              <>
                <DropdownMenuItem
                  onSelect={() =>
                    navigate(`/documents/view/${publishedDocument.id}`)
                  }
                >
                  <Eye /> Preview
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setIsHistoryOpen(true)}>
                  <History /> History
                </DropdownMenuItem>
                {publishedDocument.hasPdf ? (
                  <DropdownMenuItem
                    disabled={isDownloadPending}
                    onSelect={() =>
                      onDownloadPdf({
                        id: publishedDocument.id,
                        title: publishedDocument.title,
                      })
                    }
                  >
                    <Download /> Download PDF
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
              </>
            ) : null}
            <DropdownMenuItem variant="destructive" onSelect={onDeleteTemplate}>
              <Trash2 /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isHistoryOpen ? (
        <DocumentHistoryDialog
          organizationName={organizationName}
          summary={summary}
          onClose={() => setIsHistoryOpen(false)}
        />
      ) : null}
    </article>
  )
}
