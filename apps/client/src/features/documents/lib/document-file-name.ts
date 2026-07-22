export const getDocumentFileName = (
  orgName: string,
  slug: string,
  version: string
) => {
  const o = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
  const s = slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
  let v = version.trim().toLowerCase()
  if (!v) {
    v = "v1.0"
  } else if (!v.startsWith("v")) {
    v = `v${v}`
  }
  return `${o}_${s}_${v}.pdf`
}
