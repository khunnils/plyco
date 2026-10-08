type MarkdownNode = { type: string; value?: string; children?: MarkdownNode[] }

// Support generated note line breaks without enabling arbitrary HTML in previews.
export const remarkLineBreaks = () => {
  const visit = (node: MarkdownNode) => {
    if (node.type === "html" && /^<br\s*\/?\s*>$/i.test(node.value ?? "")) {
      node.type = "break"
      delete node.value
    }
    node.children?.forEach(visit)
  }
  return visit
}
