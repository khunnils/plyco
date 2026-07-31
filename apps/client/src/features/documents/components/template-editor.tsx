import { type Template, type TemplateInput } from "@plyco/shared"

import { TemplateForm } from "@/features/documents/components/template-form"

const blankTemplate: TemplateInput = {
  name: "Untitled Template",
  content: "",
}

export const TemplateEditor = ({
  mode,
  templateName,
  editingTemplate,
  onSaveDraft,
  onPublish,
}: {
  mode: "new" | "edit"
  templateName: string
  editingTemplate?: Template
  onSaveDraft: (template: TemplateInput) => void
  onPublish: (template: TemplateInput) => void
}) => {
  const onSubmit = (template: TemplateInput, intent: "save" | "publish") => {
    if (intent === "publish") {
      onPublish(template)
      return
    }

    onSaveDraft(template)
  }

  if (mode === "new") {
    return (
      <TemplateForm
        name={templateName}
        defaultValues={blankTemplate}
        onSubmit={onSubmit}
      />
    )
  }

  if (!editingTemplate) {
    return <p className="text-sm text-slate-500">Template was not found.</p>
  }

  return (
    <TemplateForm
      name={templateName}
      defaultValues={editingTemplate}
      onSubmit={onSubmit}
    />
  )
}
