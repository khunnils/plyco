import { type DocumentSummary } from "@plyco/shared"
import { Eye, FileText, X } from "lucide-react"
import { useEffect, useId } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getDocumentFileName } from "@/features/documents/lib/document-file-name"

export const DocumentHistoryDialog = ({
  summary,
  organizationName,
  onClose,
}: {
  summary: DocumentSummary
  organizationName: string
  onClose: () => void
}) => {
  const navigate = useNavigate()
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  return createPortal(
    <div
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4"
      role="dialog"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="flex max-h-[min(720px,90vh)] w-full max-w-2xl flex-col border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <h2 className="text-base font-semibold text-slate-950" id={titleId}>
              Document history
            </h2>
            <p className="mt-1 text-sm text-slate-600" id={descriptionId}>
              Published versions of {summary.template.name}.
            </p>
          </div>
          <Button
            aria-label="Close document history"
            size="icon-sm"
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            <X />
          </Button>
        </div>

        <div className="min-h-0 overflow-y-auto p-5">
          <div className="grid gap-2">
            {summary.documents.map((doc) => (
              <div
                className="flex items-center justify-between gap-4 border border-slate-200 px-3 py-3"
                key={doc.id}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="size-5 shrink-0 text-slate-500" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {getDocumentFileName(
                          organizationName,
                          summary.template.slug,
                          `${doc.templateVersionMajor}.${doc.templateVersionMinor}`
                        )}
                      </p>
                      {doc.id === summary.document?.id ? (
                        <Badge variant="info">Current</Badge>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Version {doc.templateVersionMajor}.
                      {doc.templateVersionMinor} · Published on{" "}
                      {new Date(doc.generatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button
                  aria-label={`Preview version ${doc.templateVersionMajor}.${doc.templateVersionMinor}`}
                  size="icon-sm"
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onClose()
                    navigate(`/documents/view/${doc.id}`)
                  }}
                >
                  <Eye />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
