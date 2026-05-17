export const authStateQueryKey = ["auth"] as const

export const providersQueryKey = ["providers"] as const

export const countriesQueryKey = ["countries"] as const

export const vocabularyQueryKey = (organizationId: string) =>
  ["vocabulary", organizationId] as const

export const securityProfileQueryKey = (organizationId: string) =>
  ["security-profile", organizationId] as const

export const templatesQueryKey = (organizationId: string) =>
  ["templates", organizationId] as const

export const documentsQueryKey = (organizationId: string) =>
  ["documents", organizationId] as const

export const documentQueryKey = (organizationId: string, id: string) =>
  ["document", organizationId, id] as const
