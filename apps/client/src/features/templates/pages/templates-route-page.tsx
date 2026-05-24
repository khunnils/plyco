import { Plus, Pencil, Trash2 } from "lucide-react"
import { type TemplateCatalog } from "@plyco/shared"

import {
  useCreateTemplateFromSystem,
  useDeleteTemplate,
  useOrganizationMembers,
  useTemplates,
  useUpdateTemplate,
} from "@/features/templates/hooks/use-templates"
import { useSecurityUiStore } from "@/features/shell/stores/security-ui-store"
import { Button } from "@/components/ui/button"
import { Section } from "@/features/shell/components/section"
import { TemplateCard } from "@/features/templates/components/template-card"
import { TemplateForm } from "@/features/templates/components/template-form"
import { PageHeader } from "@/features/shell/components/page-header"

export const TemplatesRoutePage = () => {
  const templates = useTemplates()
  const createTemplate = useCreateTemplateFromSystem()
  const updateTemplate = useUpdateTemplate()
  const deleteTemplate = useDeleteTemplate()
  const organizationMembers = useOrganizationMembers()

  const { editingTemplateId, startEditingTemplate } = useSecurityUiStore()

  const templatesData: TemplateCatalog = templates.data ?? {
    systemTemplates: [],
    organizationTemplates: [],
  }
  const addedSystemTemplateSlugs = new Set(
    templatesData.organizationTemplates.map(
      (template) => template.sourceSystemTemplateSlug
    )
  )
  const organizationMembersData = organizationMembers.data ?? []
  const editingTemplate = templatesData.organizationTemplates.find(
    (template) => template.id === editingTemplateId
  )

  return (
    <>
      <PageHeader eyebrow="Templates" title="Document templates" />
      <div className="grid gap-5">
        <Section
          description="Versioned starter markdown templates with Jinja-style placeholders."
          title="System templates"
        >
          {templates.isLoading ? (
            <p className="text-sm text-slate-500">Loading templates...</p>
          ) : templatesData.systemTemplates.length > 0 ? (
            templatesData.systemTemplates.map((template) => {
              const isAdded = addedSystemTemplateSlugs.has(template.slug)

              return (
                <TemplateCard key={template.slug} template={template}>
                  <Button
                    disabled={isAdded || createTemplate.isPending}
                    type="button"
                    onClick={() =>
                      createTemplate.mutate({
                        sourceSystemTemplateSlug: template.slug,
                      })
                    }
                  >
                    <Plus />
                    {isAdded ? "Added" : "Add"}
                  </Button>
                </TemplateCard>
              )
            })
          ) : (
            <p className="text-sm text-slate-500">
              No system templates are available.
            </p>
          )}
        </Section>

        <Section
          description="Organization copies can be edited for your own customer-facing documents."
          title="Organization templates"
        >
          {editingTemplate ? (
            <TemplateForm
              defaultValues={editingTemplate}
              isSaving={updateTemplate.isPending}
              members={organizationMembersData}
              onCancel={() => startEditingTemplate(null)}
              onSubmit={(template) => {
                updateTemplate.mutate(
                  { id: editingTemplate.id, template },
                  { onSuccess: () => startEditingTemplate(null) }
                )
              }}
            />
          ) : templatesData.organizationTemplates.length > 0 ? (
            templatesData.organizationTemplates.map((template) => (
              <TemplateCard key={template.id} template={template}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => startEditingTemplate(template.id)}
                >
                  <Pencil />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => deleteTemplate.mutate(template.id)}
                >
                  <Trash2 />
                  Delete
                </Button>
              </TemplateCard>
            ))
          ) : (
            <p className="text-sm text-slate-500">
              Add a system template to create the first organization
              template.
            </p>
          )}
        </Section>
      </div>
    </>
  )
}
