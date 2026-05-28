import { type DocumentSummary } from "@plyco/shared"

export const documentStatusLabel = (status: DocumentSummary["status"]) => {
  if (status === "stale") {
    return "Outdated"
  }

  if (status === "current") {
    return "Published"
  }

  return "Draft"
}
