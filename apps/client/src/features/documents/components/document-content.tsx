import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { type Document } from "@plyco/shared"

const markdownStyles =
  "prose-custom [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-4 [&_h1]:text-slate-900 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-3 [&_h2]:text-slate-900 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-slate-900 [&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-slate-800 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_li]:mb-1 [&_strong]:font-bold [&_strong]:text-slate-950 [&_em]:italic [&_a]:text-blue-600 [&_a]:underline hover:[&_a]:text-blue-800 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600 [&_blockquote]:my-4 [&_code]:font-mono [&_code]:text-xs [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-slate-900 [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-4 [&_pre]:rounded-md [&_pre]:overflow-x-auto [&_pre]:my-4 [&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_pre_code]:p-0 [&_hr]:my-6 [&_hr]:border-slate-200 [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:p-2 [&_th]:font-semibold [&_td]:border [&_td]:border-slate-200 [&_td]:p-2"

export const DocumentContent = ({ document }: { document: Document }) => (
  <article
    className={`font-sans text-sm leading-6 text-slate-800 ${markdownStyles}`}
  >
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {document.renderedContent}
    </ReactMarkdown>
  </article>
)
