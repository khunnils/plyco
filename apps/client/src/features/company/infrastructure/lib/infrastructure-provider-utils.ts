import { type ProviderSelection, type ProviderSystemType } from "@plyco/shared"

export type InfrastructureProviderSystemType = Exclude<
  ProviderSystemType,
  "analytics" | "advertising" | "issue_tracking" | "newsletter"
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
