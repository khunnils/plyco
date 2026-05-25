import { type ProviderSystemType } from "@plyco/shared"

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
  auth: "Login provider",
  source_control: "Code repository",
  cloud: "Cloud providers",
  password_manager: "Password manager",
}
