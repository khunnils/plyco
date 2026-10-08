import {
  type TemplateVariable,
  type TemplateVariableField,
} from "@plyco/contracts"

const singularOverrides: Record<string, string> = {
  all: "item",
  cookieCategories: "category",
  activities: "activity",
  dataProcessors: "vendor",
  providers: "provider",
  services: "service",
  subprocessors: "vendor",
  vendors: "vendor",
}

const firstUsableField = (fields: TemplateVariableField[] = []) =>
  fields.find((field) => field.type !== "collection") ?? fields[0]

const variableNameForPath = (path: string) => {
  if (path === "services.all") {
    return "service"
  }
  if (path === "vendors.all" || path === "providers.all") {
    return "vendor"
  }

  const segment = path.split(".").at(-1) ?? "item"
  if (singularOverrides[segment]) {
    return singularOverrides[segment]
  }

  return segment.endsWith("s") ? segment.slice(0, -1) : segment
}

export const scalarSnippet = (key: string) => `{{ ${key} }}`

export const collectionSnippet = (
  variable: Pick<TemplateVariable, "key" | "itemFields">
) => {
  const displayField = firstUsableField(variable.itemFields)
  const displayKey = displayField?.key ?? "name"

  const parts = variable.key.split("[].")
  const loops = parts.map((path, index) => {
    const source =
      index === 0 ? path : `${variableNameForPath(parts[index - 1])}.${path}`
    return `{% for ${variableNameForPath(path)} in ${source} -%}`
  })
  const itemVariable = variableNameForPath(parts.at(-1) ?? variable.key)
  return [
    ...loops,
    `{{ ${itemVariable}.${displayKey} }}`,
    ...parts.map(() => "{% endfor %}"),
  ].join("\n")
}

export const itemFieldSnippet = (
  variable: Pick<TemplateVariable, "key" | "itemFields">,
  field: TemplateVariableField
) => {
  const collection = { ...variable, itemFields: [field] }

  return collectionSnippet(collection)
}

export const itemFieldPlaceholderSnippet = (
  variable: Pick<TemplateVariable, "key">,
  field: TemplateVariableField
) => {
  const itemVariable = variable.key.includes("[].")
    ? variableNameForPath(variable.key.split("[].").at(-1) ?? variable.key)
    : variableNameForPath(variable.key)

  return scalarSnippet(`${itemVariable}.${field.key}`)
}

export const isCursorInsideCollectionLoop = (
  content: string,
  cursorPosition: number,
  variable: Pick<TemplateVariable, "key">
) => {
  const beforeCursor = content.slice(0, cursorPosition)
  const itemVariable = variable.key.includes("[].")
    ? variableNameForPath(variable.key.split("[].").at(-1) ?? variable.key)
    : variableNameForPath(variable.key)
  const loopSource = variable.key.includes("[].")
    ? `${variableNameForPath(variable.key.split("[].").at(-2) ?? variable.key)}.${variable.key.split("[].").at(-1)}`
    : variable.key
  const loopStart = `{% for ${itemVariable} in ${loopSource}`
  const lastLoopStart = beforeCursor.lastIndexOf(loopStart)
  const lastLoopEnd = beforeCursor.lastIndexOf("{% endfor %}")

  return lastLoopStart > lastLoopEnd
}

export const variableSnippet = (variable: TemplateVariable) =>
  variable.type === "collection"
    ? collectionSnippet(variable)
    : scalarSnippet(variable.key)
