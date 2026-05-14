import { type Document } from "@complyflow/shared"

export const DocumentContent = ({ document }: { document: Document }) => (
  <article className="rounded-md border border-slate-200 bg-white p-5 font-mono text-sm leading-6 whitespace-pre-wrap text-slate-800">
    {document.renderedContent}
  </article>
)
