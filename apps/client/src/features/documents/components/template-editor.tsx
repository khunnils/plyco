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
  onCreate,
  onUpdate,
}: {
  mode: "new" | "edit"
  templateName: string
  editingTemplate?: Template
  onCreate: (template: TemplateInput) => void
  onUpdate: (template: TemplateInput) => void
}) => {
  if (mode === "new") {
    return (
      <TemplateForm
        name={templateName}
        defaultValues={blankTemplate}
        onSubmit={onCreate}
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
      onSubmit={onUpdate}
    />
  )
}
