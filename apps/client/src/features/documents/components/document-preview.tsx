import { type Template } from "@plyco/shared"

import { DocumentMarkdown } from "@/features/documents/components/document-markdown"
import { useTemplatePreview } from "@/features/documents/hooks/use-templates"

export const DocumentPreview = ({
  isLoadingTemplate,
  template,
}: {
  isLoadingTemplate: boolean
  template: Template | null
}) => {
  const preview = useTemplatePreview(
    template
      ? { name: template.name, content: template.content }
      : { name: "", content: "" },
    Boolean(template)
  )

  if (isLoadingTemplate) {
    return <p className="text-sm text-slate-500">Loading template...</p>
  }

  if (!template) {
    return <p className="text-sm text-slate-500">Template was not found.</p>
  }

  if (preview.isError) {
    return (
      <p className="text-sm text-red-600">
        {preview.error.message ?? "Preview could not be rendered."}
      </p>
    )
  }

  if (preview.isLoading || preview.isFetching) {
    return <p className="text-sm text-slate-500">Rendering preview...</p>
  }

  const content = preview.data?.renderedContent ?? ""
  if (!content) {
    return <p className="text-sm text-slate-500">Preview is empty.</p>
  }

  return <DocumentMarkdown content={content} />
}
