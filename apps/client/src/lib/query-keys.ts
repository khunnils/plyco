export const authStateQueryKey = ["auth"] as const

export const providersQueryKey = ["providers"] as const

export const countriesQueryKey = ["countries"] as const

export const vocabularyQueryKey = (organizationId: string) =>
  ["vocabulary", organizationId] as const

export const organizationMembersQueryKey = (organizationId: string) =>
  ["organization-members", organizationId] as const

export const organizationInvitationsQueryKey = (organizationId: string) =>
  ["organization-invitations", organizationId] as const

export const organizationApiKeysQueryKey = (organizationId: string) =>
  ["organization-api-keys", organizationId] as const

export const organizationSnapshotQueryKey = (organizationId: string) =>
  ["organization-snapshot", organizationId] as const

export const recommendationsQueryKey = (organizationId: string) =>
  ["recommendations", organizationId] as const

export const templatesQueryKey = (organizationId: string) =>
  ["templates", organizationId] as const

export const templateSchemaQueryKey = (organizationId: string) =>
  ["template-schema", organizationId] as const

export const templatePreviewQueryKey = (
  organizationId: string,
  name: string,
  content: string
) => ["template-preview", organizationId, name, content] as const

export const documentsQueryKey = (organizationId: string) =>
  ["documents", organizationId] as const

export const documentQueryKey = (organizationId: string, id: string) =>
  ["document", organizationId, id] as const
