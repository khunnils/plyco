import {
  type OrganizationMember,
  type Template,
  type TemplateInput,
  type TemplateVariable,
  type TemplateVariableField,
} from "@plyco/shared"
import { Braces, Eye, ListTree, Loader2, Save, Search } from "lucide-react"
import {
  useMemo,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react"

import { Button } from "@/components/ui/button"
import {
  useTemplatePreview,
  useTemplateVariableCatalog,
} from "@/features/templates/hooks/use-templates"
import {
  isCursorInsideCollectionLoop,
  itemFieldPlaceholderSnippet,
  itemFieldSnippet,
  variableSnippet,
} from "@/features/templates/lib/template-snippets"

const useDebouncedTemplate = (draft: TemplateInput, delayMs = 450) => {
  const [debouncedDraft, setDebouncedDraft] = useState(draft)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedDraft(draft), delayMs)

    return () => window.clearTimeout(timeout)
  }, [delayMs, draft])

  return debouncedDraft
}

const groupedVariables = (variables: TemplateVariable[]) =>
  variables.reduce<Record<string, TemplateVariable[]>>((groups, variable) => {
    groups[variable.category] = [...(groups[variable.category] ?? []), variable]

    return groups
  }, {})

export const TemplateForm = ({
  defaultValues,
  isSaving,
  onCancel,
  onSubmit,
}: {
  defaultValues: Template | TemplateInput
  isSaving: boolean
  members?: OrganizationMember[]
  onCancel: () => void
  onSubmit: (template: TemplateInput) => void
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [schemaSearch, setSchemaSearch] = useState("")
  const [draft, setDraft] = useState<TemplateInput>({
    name: defaultValues.name,
    content: defaultValues.content,
    policyVersion: defaultValues.policyVersion,
  })
  const debouncedDraft = useDebouncedTemplate(draft)
  const schema = useTemplateVariableCatalog()
  const preview = useTemplatePreview(debouncedDraft)
  const filteredVariables = useMemo(() => {
    const query = schemaSearch.trim().toLowerCase()
    const variables = schema.data?.variables ?? []

    if (!query) {
      return variables
    }

    return variables.filter((variable) =>
      [
        variable.key,
        variable.label,
        variable.category,
        variable.description ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    )
  }, [schema.data?.variables, schemaSearch])
  const variablesByCategory = useMemo(
    () => groupedVariables(filteredVariables),
    [filteredVariables]
  )
  const previewContent = preview.data?.renderedContent ?? ""

  const insertSnippet = (snippet: string) => {
    const textarea = textareaRef.current
    const start = textarea?.selectionStart ?? draft.content.length
    const end = textarea?.selectionEnd ?? draft.content.length
    const nextContent = `${draft.content.slice(0, start)}${snippet}${draft.content.slice(end)}`

    setDraft((current) => ({
      ...current,
      content: nextContent,
    }))

    window.requestAnimationFrame(() => {
      textarea?.focus()
      textarea?.setSelectionRange(
        start + snippet.length,
        start + snippet.length
      )
    })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(draft)
  }

  const handleDragStart =
    (snippet: string) => (event: DragEvent<HTMLButtonElement>) => {
      event.dataTransfer.setData("text/plain", snippet)
      event.dataTransfer.effectAllowed = "copy"
    }

  const handleDrop = (event: DragEvent<HTMLTextAreaElement>) => {
    event.preventDefault()
    const snippet = event.dataTransfer.getData("text/plain")

    if (snippet) {
      insertSnippet(snippet)
    }
  }

  const insertItemFieldSnippet = (
    variable: TemplateVariable,
    field: TemplateVariableField
  ) => {
    const cursorPosition =
      textareaRef.current?.selectionStart ?? draft.content.length
    const snippet = isCursorInsideCollectionLoop(
      draft.content,
      cursorPosition,
      variable
    )
      ? itemFieldPlaceholderSnippet(variable, field)
      : itemFieldSnippet(variable, field)

    insertSnippet(snippet)
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-sm font-medium text-slate-700">Name</span>
          <input
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
            value={draft.name}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-medium text-slate-700">Version</span>
          <input
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            value={draft.policyVersion}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                policyVersion: event.target.value,
              }))
            }
          />
        </label>
      </div>

      <div className="grid min-h-[620px] gap-4 xl:grid-cols-[280px_minmax(0,1fr)_minmax(320px,0.9fr)]">
        <section className="grid min-h-0 grid-rows-[auto_1fr] gap-3 border border-slate-200 bg-white p-4">
          <div className="grid gap-3">
            <div className="flex items-center gap-2">
              <ListTree className="size-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-950">Schema</h2>
            </div>
            <label className="relative block">
              <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-slate-400" />
              <input
                className="h-9 w-full rounded-md border border-slate-200 bg-white pr-3 pl-9 text-sm text-slate-900 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Search variables"
                value={schemaSearch}
                onChange={(event) => setSchemaSearch(event.target.value)}
              />
            </label>
          </div>
          <div className="min-h-0 overflow-y-auto pr-1">
            {schema.isLoading ? (
              <p className="text-sm text-slate-500">Loading schema...</p>
            ) : schema.isError ? (
              <p className="text-sm text-red-600">
                Schema could not be loaded.
              </p>
            ) : filteredVariables.length === 0 ? (
              <p className="text-sm text-slate-500">No variables found.</p>
            ) : (
              <div className="grid gap-4">
                {Object.entries(variablesByCategory).map(
                  ([category, variables]) => (
                    <div className="grid gap-2" key={category}>
                      <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                        {category}
                      </h3>
                      <div className="grid gap-2">
                        {variables.map((variable) => {
                          const snippet = variableSnippet(variable)

                          return (
                            <div
                              className="grid gap-2 rounded-md border border-slate-200 p-2"
                              key={variable.key}
                            >
                              <button
                                className="grid gap-1 text-left"
                                draggable
                                type="button"
                                onClick={() => insertSnippet(snippet)}
                                onDragStart={handleDragStart(snippet)}
                              >
                                <span className="flex items-start gap-2 text-sm font-medium text-slate-900">
                                  <Braces className="mt-0.5 size-3.5 text-slate-400" />
                                  {variable.label}
                                </span>
                                <span className="font-mono text-xs break-all text-slate-500">
                                  {variable.key}
                                </span>
                              </button>
                              {variable.type === "collection" &&
                              variable.itemFields?.length ? (
                                <div className="flex flex-wrap gap-1">
                                  {variable.itemFields
                                    .filter(
                                      (field) => field.type !== "collection"
                                    )
                                    .slice(0, 6)
                                    .map((field) => {
                                      const fieldSnippet = itemFieldSnippet(
                                        variable,
                                        field
                                      )

                                      return (
                                        <button
                                          className="rounded border border-slate-200 px-1.5 py-1 text-xs text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                          draggable
                                          key={field.key}
                                          type="button"
                                          onClick={() =>
                                            insertItemFieldSnippet(
                                              variable,
                                              field
                                            )
                                          }
                                          onDragStart={handleDragStart(
                                            fieldSnippet
                                          )}
                                        >
                                          {field.label}
                                        </button>
                                      )
                                    })}
                                </div>
                              ) : null}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </section>

        <label className="grid min-h-0 grid-rows-[auto_1fr] gap-1">
          <span className="text-sm font-medium text-slate-700">Content</span>
          <textarea
            className="min-h-80 resize-none rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            ref={textareaRef}
            value={draft.content}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                content: event.target.value,
              }))
            }
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          />
        </label>

        <section className="grid min-h-0 grid-rows-[auto_1fr] gap-3 border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Eye className="size-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-950">
                Live preview
              </h2>
            </div>
            {preview.isFetching ? (
              <Loader2 className="size-4 animate-spin text-slate-400" />
            ) : null}
          </div>
          <div className="min-h-0 overflow-y-auto rounded-md border border-slate-100 bg-slate-50 p-4 font-mono text-sm leading-6 whitespace-pre-wrap text-slate-800">
            {!draft.name.trim() ? (
              <p className="font-sans text-sm text-slate-500">
                Add a template name to render the preview.
              </p>
            ) : preview.isError ? (
              <p className="font-sans text-sm text-red-600">
                {preview.error.message}
              </p>
            ) : previewContent ? (
              previewContent
            ) : preview.isLoading ? (
              <p className="font-sans text-sm text-slate-500">
                Rendering preview...
              </p>
            ) : (
              <p className="font-sans text-sm text-slate-500">
                Preview is empty.
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="flex gap-2">
        <Button disabled={isSaving} type="submit">
          {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
          Save template
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
