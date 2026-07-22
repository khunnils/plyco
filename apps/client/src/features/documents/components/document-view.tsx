import { type Document } from "@plyco/shared"

import { DocumentContent } from "@/features/documents/components/document-content"

export const DocumentView = ({
  isLoading,
  document,
}: {
  isLoading: boolean
  document: Document | null
}) => {
  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading document...</p>
  }

  if (!document) {
    return <p className="text-sm text-slate-500">Document was not found.</p>
  }

  return <DocumentContent document={document} />
}
