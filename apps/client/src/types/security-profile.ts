import {
  type AccessProfile,
  type CompanyProfile,
  type DataHandlingProfile,
  type InfrastructureProfile,
} from "@complyflow/shared"

export type ProfileDraft = {
  company: CompanyProfile
  infrastructure: InfrastructureProfile
  dataHandling: DataHandlingProfile
  access: AccessProfile
}

export type MutationState = "idle" | "loading" | "saved" | "error"
