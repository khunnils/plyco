import { type Document } from "@plyco/shared"

import { DocumentMarkdown } from "@/features/documents/components/document-markdown"

export const DocumentContent = ({ document }: { document: Document }) => (
  <DocumentMarkdown content={document.renderedContent} />
)
