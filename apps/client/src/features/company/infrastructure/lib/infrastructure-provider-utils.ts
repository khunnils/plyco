import {
  type ProviderSystemType,
} from "@plyco/shared"

export type InfrastructureProviderSystemType = Exclude<
  ProviderSystemType,
  "analytics" | "advertising" | "newsletter"
>

export const infrastructureSystemTypes: InfrastructureProviderSystemType[] = [
  "cloud",
  "source_control",
  "auth",
  "password_manager",
]

export const infrastructureProviderLabels: Record<
  InfrastructureProviderSystemType,
  string
> = {
  auth: "Auth provider",
  source_control: "Source control provider",
  cloud: "Cloud provider",
  password_manager: "Password manager",
}
