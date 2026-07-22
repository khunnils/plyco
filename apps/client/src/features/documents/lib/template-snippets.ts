import {
  type TemplateVariable,
  type TemplateVariableField,
} from "@plyco/shared"

const singularOverrides: Record<string, string> = {
  all: "item",
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

  if (variable.key.includes("[].")) {
    const [outerPath, innerPath] = variable.key.split("[].", 2)
    const outerVariable = variableNameForPath(outerPath)
    const innerVariable = variableNameForPath(innerPath)

    return `{% for ${outerVariable} in ${outerPath} -%}
{% for ${innerVariable} in ${outerVariable}.${innerPath} -%}
{{ ${innerVariable}.${displayKey} }}
{% endfor %}
{% endfor %}`
  }

  const itemVariable = variableNameForPath(variable.key)

  return `{% for ${itemVariable} in ${variable.key} -%}
{{ ${itemVariable}.${displayKey} }}
{% endfor %}`
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
    ? `${variableNameForPath(variable.key.split("[].")[0])}.${variable.key.split("[].").at(-1)}`
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
