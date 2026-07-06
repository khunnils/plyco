import cors from "@fastify/cors"
import { Storage } from "@google-cloud/storage"
import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from "fastify"

import {
  AirtableProviderLookupCodeSource,
  type ProviderLookupCodeSource,
} from "./infrastructure/airtable-code-source.js"
import { registerAuth } from "./infrastructure/auth.js"
import { apiConfig, type AuthConfig } from "./config.js"
import { setupFastifyErrorInstrumentation } from "./infrastructure/instrumentation.js"
import {
  GcsDocumentPdfStorage,
  NullDocumentPdfStorage,
  type DocumentPdfStorage,
} from "./infrastructure/document-pdfs.js"
import { ApiError, sendError } from "./infrastructure/errors.js"
import { InMemoryAccountRepository } from "./features/accounts/in-memory-repository.js"
import {
  ResendInvitationEmailSender,
  type InvitationEmailSender,
} from "./features/accounts/invitation-email.js"
import {
  ResendMagicLinkEmailSender,
  type MagicLinkEmailSender,
} from "./features/accounts/magic-link-email.js"
import { PrismaAccountRepository } from "./features/accounts/prisma-repository.js"
import { type AccountRepository } from "./features/accounts/repository.js"
import { registerAccountRoutes } from "./features/accounts/routes.js"
import {
  registerCodeRoutes,
  type CodeLoader,
} from "./features/codes/routes.js"
import { InMemoryDocumentRepository } from "./features/documents/in-memory-repository.js"
import { PrismaDocumentRepository } from "./features/documents/prisma-repository.js"
import { type DocumentRepository } from "./features/documents/repository.js"
import { registerDocumentRoutes } from "./features/documents/routes.js"
import { InMemoryOrganizationRepository } from "./features/organizations/in-memory-repository.js"
import { PrismaOrganizationRepository } from "./features/organizations/prisma-repository.js"
import { type OrganizationRepository } from "./features/organizations/repository.js"
import { registerOrganizationRoutes } from "./features/organizations/routes.js"
import {
  createDefaultOrganizationLookupService,
  type OrganizationLookupService,
} from "./features/organization-lookup/service.js"
import { registerOrganizationLookupRoutes } from "./features/organization-lookup/routes.js"
import { registerRecommendationRoutes } from "./features/recommendations/routes.js"
import {
  FileSystemAdvisorRuleSource,
  type AdvisorRuleSource,
} from "./features/recommendations/rules.js"
import { InMemoryVendorRepository } from "./features/vendors/in-memory-repository.js"
import { PrismaVendorRepository } from "./features/vendors/prisma-repository.js"
import { type ProviderRepository } from "./features/vendors/repository.js"
import { registerVendorRoutes } from "./features/vendors/routes.js"
import { InMemoryVocabularyRepository } from "./features/vocabulary/in-memory-repository.js"
import { PrismaVocabularyRepository } from "./features/vocabulary/prisma-repository.js"
import { type VocabularyRepository } from "./features/vocabulary/repository.js"
import { registerVocabularyRoutes } from "./features/vocabulary/routes.js"
import { GeminiJsonClient, type LlmJsonClient } from "./infrastructure/llm-client.js"
import { LangfusePromptClient, type PromptClient } from "./infrastructure/prompt-client.js"
import {
  AirtableProviderImportClient,
  AirtableProviderImportService,
  type ProviderImportService,
} from "./features/vendors/provider-import.js"
import {
  LlmProviderLookupService,
  type ProviderLookupService,
} from "./features/vendors/provider-lookup.js"
import {
  AirtableProviderSource,
  type ProviderSource,
  StaticProviderSource,
} from "./infrastructure/providers.js"
import {
  FileSystemTemplateSource,
  type SystemTemplateSource,
} from "./infrastructure/system-templates.js"
import { InMemoryWaitlistRepository } from "./features/waitlist/in-memory-repository.js"
import { PrismaWaitlistRepository } from "./features/waitlist/prisma-repository.js"
import { type WaitlistRepository } from "./features/waitlist/repository.js"
import { registerWaitlistRoutes } from "./features/waitlist/routes.js"
import { registerOpenApi } from "./infrastructure/openapi.js"

export type CreateAppOptions = {
  auth?: false | AuthConfig
  accountRepository?: AccountRepository
  organizationRepository?: OrganizationRepository
  vendorRepository?: ProviderRepository
  vocabularyRepository?: VocabularyRepository
  documentRepository?: DocumentRepository
  documentPdfStorage?: DocumentPdfStorage
  providerSource?: ProviderSource
  providerLookupApiKey?: string
  providerLookupCodeSource?: ProviderLookupCodeSource
  providerLookupService?: ProviderLookupService
  providerImportService?: ProviderImportService
  organizationLookupService?: OrganizationLookupService
  advisorRuleSource?: AdvisorRuleSource
  promptClient?: PromptClient
  llmClient?: LlmJsonClient
  systemTemplateSource?: SystemTemplateSource
  codeLoader?: CodeLoader
  codeLoaderConfig?: {
    airtableApiKey?: string
    airtableBase?: string
  }
  waitlistRepository?: WaitlistRepository
  invitationEmailSender?: InvitationEmailSender
  magicLinkEmailSender?: MagicLinkEmailSender
  apiDocs?: boolean
  logger?: FastifyServerOptions["logger"]
}

export async function createApp({
  auth = apiConfig.auth(),
  accountRepository,
  organizationRepository,
  vendorRepository,
  vocabularyRepository,
  documentRepository,
  documentPdfStorage,
  providerSource = apiConfig.airtableBase && apiConfig.airtableApiKey
    ? new AirtableProviderSource(
        apiConfig.airtableBase,
        apiConfig.airtableApiKey,
      )
    : new StaticProviderSource(),
  providerLookupApiKey = apiConfig.apiKey,
  providerLookupCodeSource,
  providerLookupService,
  providerImportService,
  organizationLookupService,
  advisorRuleSource = new FileSystemAdvisorRuleSource(),
  promptClient,
  llmClient,
  systemTemplateSource = new FileSystemTemplateSource(),
  codeLoader,
  codeLoaderConfig,
  waitlistRepository,
  invitationEmailSender,
  magicLinkEmailSender,
  apiDocs = apiConfig.apiDocsEnabled(),
  logger = false,
}: CreateAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger })
  setupFastifyErrorInstrumentation(app)
  const repositories = createRepositories({
    accountRepository,
    documentRepository,
    organizationRepository,
    vendorRepository,
    vocabularyRepository,
  })

  await app.register(cors, {
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    origin: auth ? [auth.clientUrl, auth.webUrl] : true,
  })

  app.setErrorHandler((error, request, reply) => {
    request.log.error(
      {
        err: error,
        method: request.method,
        url: request.url,
      },
      "request failed",
    )

    return sendError(reply, error)
  })

  app.get("/health", async () => ({ status: "ok" }))

  if (apiDocs) {
    await registerOpenApi(app)
  }

  await registerWaitlistRoutes(app, {
    waitlistRepository:
      waitlistRepository ??
      (process.env.DATABASE_URL
        ? new PrismaWaitlistRepository()
        : new InMemoryWaitlistRepository()),
  })

  if (auth) {
    await registerAuth(app, {
      accountRepository: repositories.accountRepository,
      authConfig: auth,
      magicLinkEmailSender:
        magicLinkEmailSender ??
        new ResendMagicLinkEmailSender({
          apiKey: apiConfig.resendApiKey,
          from: apiConfig.invitationEmailFrom,
        }),
    })
  }

  await registerAccountRoutes(app, {
    accountRepository: repositories.accountRepository,
    clientUrl: auth ? auth.clientUrl : apiConfig.cliApiUrl,
    invitationEmailSender:
      invitationEmailSender ??
      new ResendInvitationEmailSender({
        apiKey: apiConfig.resendApiKey,
        from: apiConfig.invitationEmailFrom,
      }),
    vocabularyRepository: repositories.vocabularyRepository,
  })
  const resolvedOrganizationLookupService =
    organizationLookupService ??
    createDefaultOrganizationLookupService({
      llmClient,
      promptClient,
    })

  await registerOrganizationLookupRoutes(app, {
    accountRepository: repositories.accountRepository,
    organizationLookupService: resolvedOrganizationLookupService,
  })
  const resolvedProviderLookupService =
    providerLookupService ??
    createDefaultProviderLookupService({
      codeSource: providerLookupCodeSource,
      llmClient,
      promptClient,
    })

  await registerVendorRoutes(app, {
    accountRepository: repositories.accountRepository,
    providerSource,
    providerLookupApiKey,
    providerLookupService: resolvedProviderLookupService,
    providerImportService:
      providerImportService ??
      createDefaultProviderImportService(resolvedProviderLookupService),
    providerRepository: repositories.vendorRepository,
    vocabularyRepository: repositories.vocabularyRepository,
  })
  await registerCodeRoutes(app, {
    airtableApiKey: codeLoaderConfig?.airtableApiKey,
    airtableBase: codeLoaderConfig?.airtableBase,
    codeLoader,
    toolApiKey: providerLookupApiKey,
  })
  await registerOrganizationRoutes(app, {
    accountRepository: repositories.accountRepository,
    organizationRepository: repositories.organizationRepository,
    providerSource,
    vendorRepository: repositories.vendorRepository,
    vocabularyRepository: repositories.vocabularyRepository,
  })
  await registerRecommendationRoutes(app, {
    accountRepository: repositories.accountRepository,
    advisorRuleSource,
    organizationRepository: repositories.organizationRepository,
    vendorRepository: repositories.vendorRepository,
  })
  await registerVocabularyRoutes(app, {
    accountRepository: repositories.accountRepository,
    vocabularyRepository: repositories.vocabularyRepository,
  })
  await registerDocumentRoutes(app, {
    accountRepository: repositories.accountRepository,
    documentRepository: repositories.documentRepository,
    documentPdfStorage:
      documentPdfStorage ??
      (!documentRepository && process.env.DATABASE_URL
        ? new GcsDocumentPdfStorage(
            apiConfig.documentPdfBucket,
            new Storage({ projectId: apiConfig.gcpProjectId })
          )
        : new NullDocumentPdfStorage()),
    organizationRepository: repositories.organizationRepository,
    systemTemplateSource,
    vendorRepository: repositories.vendorRepository,
    vocabularyRepository: repositories.vocabularyRepository,
  })

  return app
}

function createDefaultProviderImportService(
  lookupService: ProviderLookupService,
): ProviderImportService {
  let service: ProviderImportService | null = null

  return {
    async importProvider(inputUrl: string) {
      if (service) {
        return service.importProvider(inputUrl)
      }

      const airtableBase = apiConfig.airtableBase
      const airtableApiKey = apiConfig.airtableApiKey
      const missing = [
        airtableBase ? null : "AIRTABLE_BASE",
        airtableApiKey ? null : "AIRTABLE_API_KEY",
      ].filter((name): name is string => Boolean(name))

      if (missing.length > 0) {
        throw new ApiError(
          "PROVIDER_IMPORT_NOT_CONFIGURED",
          "Provider import is not configured.",
          500,
          { missing },
        )
      }

      if (!airtableBase || !airtableApiKey) {
        throw new ApiError(
          "PROVIDER_IMPORT_NOT_CONFIGURED",
          "Provider import is not configured.",
          500,
        )
      }

      service = new AirtableProviderImportService(
        lookupService,
        new AirtableProviderImportClient(airtableBase, airtableApiKey),
      )

      return service.importProvider(inputUrl)
    },
  }
}

function createDefaultProviderLookupService({
  codeSource,
  promptClient,
  llmClient,
}: {
  codeSource?: ProviderLookupCodeSource
  promptClient?: PromptClient
  llmClient?: LlmJsonClient
}): ProviderLookupService {
  let service: ProviderLookupService | null = null

  return {
    async lookup(inputUrl: string) {
      if (service) {
        return service.lookup(inputUrl)
      }

      const airtableBase = apiConfig.airtableBase
      const airtableApiKey = apiConfig.airtableApiKey
      const geminiApiKey = apiConfig.geminiApiKey
      const missing = [
        codeSource || airtableBase ? null : "AIRTABLE_BASE",
        codeSource || airtableApiKey ? null : "AIRTABLE_API_KEY",
        geminiApiKey || llmClient ? null : "GEMINI_API_KEY",
        promptClient || apiConfig.langfusePublicKey ? null : "LANGFUSE_PUBLIC_KEY",
        promptClient || apiConfig.langfuseSecretKey ? null : "LANGFUSE_SECRET_KEY",
      ].filter((name): name is string => Boolean(name))

      if (missing.length > 0) {
        throw new ApiError(
          "PROVIDER_LOOKUP_NOT_CONFIGURED",
          "Provider lookup is not configured.",
          500,
          { missing },
        )
      }

      const resolvedCodeSource =
        codeSource ??
        (airtableBase && airtableApiKey
          ? new AirtableProviderLookupCodeSource(airtableBase, airtableApiKey)
          : null)
      const resolvedLlmClient =
        llmClient ?? (geminiApiKey ? new GeminiJsonClient(geminiApiKey) : null)

      if (!resolvedCodeSource || !resolvedLlmClient) {
        throw new ApiError(
          "PROVIDER_LOOKUP_NOT_CONFIGURED",
          "Provider lookup is not configured.",
          500,
        )
      }

      service = new LlmProviderLookupService(
        resolvedCodeSource,
        promptClient ??
          LangfusePromptClient.fromConfig({
            publicKey: apiConfig.langfusePublicKey,
            secretKey: apiConfig.langfuseSecretKey,
            baseUrl: apiConfig.langfuseBaseUrl,
          }),
        resolvedLlmClient,
        apiConfig.geminiProviderLookupModel,
      )

      return service.lookup(inputUrl)
    },
  }
}

function createRepositories({
  accountRepository,
  documentRepository,
  organizationRepository,
  vendorRepository,
  vocabularyRepository,
}: {
  accountRepository?: AccountRepository
  documentRepository?: DocumentRepository
  organizationRepository?: OrganizationRepository
  vendorRepository?: ProviderRepository
  vocabularyRepository?: VocabularyRepository
}) {
  const resolvedAccountRepository =
    accountRepository ??
    (process.env.DATABASE_URL
      ? new PrismaAccountRepository()
      : new InMemoryAccountRepository())
  const resolvedOrganizationRepository =
    organizationRepository ??
    (process.env.DATABASE_URL
      ? new PrismaOrganizationRepository()
      : new InMemoryOrganizationRepository())
  const resolvedVendorRepository =
    vendorRepository ??
    (process.env.DATABASE_URL
      ? new PrismaVendorRepository(resolvedOrganizationRepository)
      : new InMemoryVendorRepository(resolvedOrganizationRepository))
  const resolvedVocabularyRepository =
    vocabularyRepository ??
    (process.env.DATABASE_URL
      ? new PrismaVocabularyRepository()
      : new InMemoryVocabularyRepository())
  const resolvedDocumentRepository =
    documentRepository ??
    (process.env.DATABASE_URL
      ? new PrismaDocumentRepository(resolvedOrganizationRepository)
      : new InMemoryDocumentRepository(resolvedOrganizationRepository))

  return {
    accountRepository: resolvedAccountRepository,
    documentRepository: resolvedDocumentRepository,
    organizationRepository: resolvedOrganizationRepository,
    vendorRepository: resolvedVendorRepository,
    vocabularyRepository: resolvedVocabularyRepository,
  }
}
