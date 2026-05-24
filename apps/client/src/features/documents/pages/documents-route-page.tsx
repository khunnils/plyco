import { Download, Eye, ScrollText, X } from "lucide-react"
import { type DocumentSummary } from "@plyco/shared"

import {
  useCreateDocument,
  useDocument,
  useDocuments,
  useDownloadDocumentPdf,
} from "@/features/documents/hooks/use-documents"
import { useSecurityUiStore } from "@/features/shell/stores/security-ui-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Section } from "@/features/shell/components/section"
import { DocumentContent } from "@/features/documents/components/document-content"
import { documentStatusLabel } from "@/features/documents/lib/document-status"
import { PageHeader } from "@/features/shell/components/page-header"

export const DocumentsRoutePage = () => {
  const documents = useDocuments()
  const viewingDocumentId = useSecurityUiStore(
    (state) => state.viewingDocumentId
  )
  const document = useDocument(viewingDocumentId)
  const downloadDocumentPdf = useDownloadDocumentPdf()
  const createDocument = useCreateDocument()
  const setViewingDocument = useSecurityUiStore(
    (state) => state.setViewingDocument
  )

  const documentsList: DocumentSummary[] = documents.data ?? []
  const documentRecord = document.data ?? null
  const viewedDocumentSummary = documentsList.find(
    (summary) => summary.document?.id === viewingDocumentId
  )

  return (
    <>
      <PageHeader eyebrow="Documents" title={viewingDocumentId && documentRecord ? documentRecord.title : "Generated documents"} />
      <div className="grid gap-5">
        {viewingDocumentId ? (
          <Section
            description={
              viewedDocumentSummary
                ? `Generated from ${viewedDocumentSummary.template.name}.`
                : "Generated document content."
            }
            title={documentRecord?.title ?? "Document"}
          >
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                className="w-fit"
                type="button"
                variant="outline"
                onClick={() => setViewingDocument(null)}
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
              <p className="text-sm text-slate-500">
                Loading document...
              </p>
            ) : documentRecord ? (
              <DocumentContent document={documentRecord} />
            ) : (
              <p className="text-sm text-slate-500">
                Document was not found.
              </p>
            )}
          </Section>
        ) : (
          <Section
            description="Generate customer-facing documents from organization templates."
            title="Documents"
          >
            {documents.isLoading ? (
              <p className="text-sm text-slate-500">
                Loading documents...
              </p>
            ) : documentsList.length > 0 ? (
              documentsList.map((summary) => {
                const isGenerated = Boolean(summary.document)

                return (
                  <div
                    className={
                      isGenerated
                        ? "grid gap-4 rounded-md border border-slate-200 bg-white p-4 md:grid-cols-[1fr_auto] md:items-start"
                        : "grid gap-4 rounded-md border border-dashed border-slate-300 bg-white/60 p-4 md:grid-cols-[1fr_auto] md:items-start"
                    }
                    key={summary.template.id}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-950">
                          {summary.template.name}
                        </h3>
                        <Badge variant="code">
                          {summary.template.slug}
                        </Badge>
                        <Badge
                          variant={
                            summary.status === "stale"
                              ? "warning"
                              : "secondary"
                          }
                        >
                          {documentStatusLabel(summary.status)}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {summary.document
                          ? `Generated ${new Date(
                              summary.document.generatedAt
                            ).toLocaleString()}`
                          : "No document has been generated yet."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {summary.document ? (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              setViewingDocument(
                                summary.document?.id ?? null
                              )
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
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-slate-500">
                Add an organization template before generating documents.
              </p>
            )}
          </Section>
        )}
      </div>
    </>
  )
}
