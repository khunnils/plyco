import {
  type OrganizationMember,
  type Template,
  type TemplateInput,
  type TemplateVariable,
  type TemplateVariableField,
} from "@plyco/shared"
import { Braces, ChevronDown, ChevronRight, Columns, Eye, FileCode, ListTree, Loader2, Search } from "lucide-react"
import {
  useMemo,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
} from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { Button } from "@/components/ui/button"
import {
  useTemplatePreview,
  useTemplateVariableCatalog,
} from "../hooks/use-templates"
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
  onSubmit,
}: {
  defaultValues: Template | TemplateInput
  members?: OrganizationMember[]
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

    return variables.filter((variable: TemplateVariable) =>
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

  const [isSchemaOpen, setIsSchemaOpen] = useState(false)
  const [editorMode, setEditorMode] = useState<"content" | "preview" | "compare">("compare")
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({})

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  const gridColsClass = useMemo(() => {
    if (isSchemaOpen) {
      if (editorMode === "compare") {
        return "xl:grid-cols-[280px_minmax(0,1fr)_minmax(320px,0.9fr)]"
      } else {
        return "xl:grid-cols-[280px_1fr]"
      }
    } else {
      if (editorMode === "compare") {
        return "xl:grid-cols-[1fr_1fr]"
      } else {
        return "xl:grid-cols-1"
      }
    }
  }, [isSchemaOpen, editorMode])

  const markdownStyles = useMemo(() => {
    return "prose-custom [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-4 [&_h1]:text-slate-900 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-3 [&_h2]:text-slate-900 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-slate-900 [&_p]:mb-4 [&_p]:leading-relaxed [&_p]:text-slate-800 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_li]:mb-1 [&_strong]:font-bold [&_strong]:text-slate-950 [&_em]:italic [&_a]:text-blue-600 [&_a]:underline hover:[&_a]:text-blue-800 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600 [&_blockquote]:my-4 [&_code]:font-mono [&_code]:text-xs [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-slate-900 [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-4 [&_pre]:rounded-md [&_pre]:overflow-x-auto [&_pre]:my-4 [&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_pre_code]:p-0 [&_hr]:my-6 [&_hr]:border-slate-200 [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:p-2 [&_th]:font-semibold [&_td]:border [&_td]:border-slate-200 [&_td]:p-2"
  }, [])

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
    <form className="grid gap-4" id="template-form" onSubmit={handleSubmit}>
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

      <div className="flex flex-wrap items-center justify-between gap-2 border border-slate-200 bg-slate-50 p-2 rounded-md">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={isSchemaOpen ? "secondary" : "outline"}
            size="sm"
            onClick={() => setIsSchemaOpen((prev) => !prev)}
            className="gap-1.5"
            title={isSchemaOpen ? "Collapse Schema" : "Expand Schema"}
          >
            <ListTree className="size-4" />
            <span>{isSchemaOpen ? "Hide Schema" : "Show Schema"}</span>
          </Button>
        </div>

        <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs">
          <button
            type="button"
            onClick={() => setEditorMode("content")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer ${
              editorMode === "content"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <FileCode className="size-3.5" />
            Content
          </button>
          <button
            type="button"
            onClick={() => setEditorMode("preview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer ${
              editorMode === "preview"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Eye className="size-3.5" />
            Preview
          </button>
          <button
            type="button"
            onClick={() => setEditorMode("compare")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer ${
              editorMode === "compare"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Columns className="size-3.5" />
            Compare
          </button>
        </div>
      </div>

      <div className={`grid h-[calc(100vh-385px)] min-h-[620px] gap-4 ${gridColsClass}`}>
        <section className={`grid min-h-0 grid-rows-[auto_1fr] gap-3 border border-slate-200 bg-white p-4 ${!isSchemaOpen ? "hidden" : ""}`}>
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
                  ([category, variables]) => {
                    const isCollapsed = collapsedCategories[category] ?? false
                    return (
                      <div className="grid gap-2 border-b border-slate-100 pb-3 last:border-0 last:pb-0" key={category}>
                        <button
                          type="button"
                          onClick={() => toggleCategory(category)}
                          className="flex w-full items-center justify-between text-left hover:bg-slate-50 p-1.5 rounded transition cursor-pointer"
                        >
                          <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                            {category}
                          </h3>
                          {isCollapsed ? (
                            <ChevronRight className="size-3.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="size-3.5 text-slate-400" />
                          )}
                        </button>
                        {!isCollapsed && (
                          <div className="grid gap-2 mt-1">
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
                                              className="rounded border border-slate-200 px-1.5 py-1 text-xs text-slate-600 hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
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
                        )}
                      </div>
                    )
                  }
                )}
              </div>
            )}
          </div>
        </section>

        <section className={`grid min-h-0 grid-rows-[auto_1fr] gap-3 border border-slate-200 bg-white p-4 ${editorMode === "preview" ? "hidden" : ""}`}>
          <div className="flex items-center gap-2">
            <FileCode className="size-4 text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-950">Content</h2>
          </div>
          <textarea
            className="h-full w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 overflow-y-auto"
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
        </section>

        <section className={`grid min-h-0 grid-rows-[auto_1fr] gap-3 border border-slate-200 bg-white p-4 ${editorMode === "content" ? "hidden" : ""}`}>
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
          <div className="min-h-0 overflow-y-auto rounded-md border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-800">
            {!draft.name.trim() ? (
              <p className="font-sans text-sm text-slate-500">
                Add a template name to render the preview.
              </p>
            ) : preview.isError ? (
              <p className="font-sans text-sm text-red-600">
                {preview.error.message}
              </p>
            ) : previewContent ? (
              <div className={`font-sans ${markdownStyles}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{previewContent}</ReactMarkdown>
              </div>
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
    </form>
  )
}
