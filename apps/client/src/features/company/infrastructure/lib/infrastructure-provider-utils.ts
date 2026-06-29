import { type ProviderSelection, type ProviderSystemType } from "@plyco/shared"

export type InfrastructureProviderSystemType = Exclude<
  ProviderSystemType,
  "analytics" | "advertising" | "newsletter"
>

export const infrastructureSystemTypes: InfrastructureProviderSystemType[] = [
  "ai",
  "cloud",
  "source_control",
  "issue_tracking",
  "auth",
  "password_manager",
]

export const infrastructureProviderLabels: Record<
  InfrastructureProviderSystemType,
  string
> = {
  ai: "AI providers",
  auth: "Login provider",
  source_control: "Code repository",
  cloud: "Cloud providers",
  password_manager: "Password manager",
  issue_tracking: "Issue tracking",
}

export const updateInfrastructureProviderSelection = (
  providers: ProviderSelection[],
  systemType: InfrastructureProviderSystemType,
  providerIds: string[]
) => {
  const otherProviders = providers.filter(
    (provider) => provider.systemType !== systemType
  )
  const hadNone = providers.some(
    (provider) =>
      provider.systemType === systemType && provider.providerId === "none"
  )
  const hasNone = providerIds.includes("none")
  const selectedIds =
    hasNone && !hadNone
      ? ["none"]
      : providerIds.filter((providerId) => providerId !== "none")

  return [
    ...otherProviders,
    ...selectedIds.map((providerId) => ({ systemType, providerId })),
  ]
}
