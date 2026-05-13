import cors from "@fastify/cors"
import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from "fastify"
import {
  accessProfileSchema,
  companyProfileSchema,
  createDocumentSchema,
  createTemplateFromSystemSchema,
  dataHandlingProfileSchema,
  infrastructureProfileSchema,
  templateInputSchema,
  vendorInputSchema,
} from "@complyflow/shared"
import { z } from "zod"

import { ApiError, sendError } from "./errors.js"
import {
  Jinja2Renderer,
  ReportContextBuilder,
  templateSourceHash,
} from "./document-generation.js"
import { PrismaSecurityProfileRepository } from "./prisma-repository.js"
import { apiConfig } from "./config.js"
import {
  AirtableProviderSource,
  type ProviderSource,
  StaticProviderSource,
} from "./providers.js"
import {
  type SecurityProfileRepository,
  InMemorySecurityProfileRepository,
} from "./repository.js"
import {
  FileSystemTemplateSource,
  StaticSystemTemplateSource,
  type SystemTemplateSource,
} from "./system-templates.js"

const securityProfileBodySchema = z.object({
  company: companyProfileSchema,
  infrastructure: infrastructureProfileSchema,
  dataHandling: dataHandlingProfileSchema,
  access: accessProfileSchema,
})

export type CreateAppOptions = {
  repository?: SecurityProfileRepository
  providerSource?: ProviderSource
  systemTemplateSource?: SystemTemplateSource
  logger?: FastifyServerOptions["logger"]
}

export async function createApp({
  repository = process.env.DATABASE_URL
    ? new PrismaSecurityProfileRepository()
    : new InMemorySecurityProfileRepository(),
  providerSource = apiConfig.airtableBase && apiConfig.airtableApiKey
    ? new AirtableProviderSource(
        apiConfig.airtableBase,
        apiConfig.airtableApiKey,
      )
    : new StaticProviderSource(),
  systemTemplateSource = new FileSystemTemplateSource(),
  logger = false,
}: CreateAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger })
  const contextBuilder = new ReportContextBuilder()
  const renderer = new Jinja2Renderer()

  await app.register(cors, {
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    origin: true,
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

  app.get("/security-profile", async () => repository.getSnapshot())

  app.get("/providers", async () => providerSource.listProviders())

  app.get("/templates", async () => ({
    systemTemplates: await systemTemplateSource.listSystemTemplates(),
    organizationTemplates: await repository.listTemplates(),
  }))

  app.get("/documents", async () => {
    const context = contextBuilder.build(await repository.getSnapshot())

    return repository.listDocumentSummaries((template) =>
      templateSourceHash(template, context),
    )
  })

  app.put("/security-profile", async (request, reply) => {
    const body = securityProfileBodySchema.parse(request.body)
    const organization = await repository.upsertProfile(body)
    const vendors = await repository.listVendors()

    return reply.send({ organization, vendors })
  })

  app.get("/vendors", async () => repository.listVendors())

  app.post("/vendors", async (request, reply) => {
    const body = vendorInputSchema.parse(request.body)
    const vendor = await repository.createVendor(body)

    return reply.status(201).send(vendor)
  })

  app.put<{ Params: { id: string } }>(
    "/vendors/:id",
    async (request, reply) => {
      const body = vendorInputSchema.parse(request.body)
      const vendor = await repository.updateVendor(request.params.id, body)

      if (!vendor) {
        throw new ApiError("VENDOR_NOT_FOUND", "Vendor was not found.", 404)
      }

      return reply.send(vendor)
    },
  )

  app.delete<{ Params: { id: string } }>(
    "/vendors/:id",
    async (request, reply) => {
      const deleted = await repository.deleteVendor(request.params.id)

      if (!deleted) {
        throw new ApiError("VENDOR_NOT_FOUND", "Vendor was not found.", 404)
      }

      return reply.status(204).send()
    },
  )

  app.post("/templates/organization", async (request, reply) => {
    const body = createTemplateFromSystemSchema.parse(request.body)
    const systemTemplates = await systemTemplateSource.listSystemTemplates()
    const systemTemplate = systemTemplates.find(
      (template) => template.slug === body.sourceSystemTemplateSlug,
    )

    if (!systemTemplate) {
      throw new ApiError(
        "SYSTEM_TEMPLATE_NOT_FOUND",
        "System template was not found.",
        404,
      )
    }

    const template = await repository.createTemplateFromSystem(systemTemplate)

    return reply.status(201).send(template)
  })

  app.put<{ Params: { id: string } }>(
    "/templates/organization/:id",
    async (request, reply) => {
      const body = templateInputSchema.parse(request.body)
      const template = await repository.updateTemplate(request.params.id, body)

      if (!template) {
        throw new ApiError(
          "TEMPLATE_NOT_FOUND",
          "Template was not found.",
          404,
        )
      }

      return reply.send(template)
    },
  )

  app.delete<{ Params: { id: string } }>(
    "/templates/organization/:id",
    async (request, reply) => {
      const deleted = await repository.deleteTemplate(request.params.id)

      if (!deleted) {
        throw new ApiError("TEMPLATE_NOT_FOUND", "Template was not found.", 404)
      }

      return reply.status(204).send()
    },
  )

  app.post("/documents", async (request, reply) => {
    const body = createDocumentSchema.parse(request.body)
    const templates = await repository.listTemplates()
    const template = templates.find(
      (currentTemplate) => currentTemplate.id === body.templateId,
    )

    if (!template) {
      throw new ApiError("TEMPLATE_NOT_FOUND", "Template was not found.", 404)
    }

    const context = contextBuilder.build(await repository.getSnapshot())
    const document = await repository.createDocument({
      template,
      title: template.name,
      renderedContent: renderer.render(template, context),
      sourceHash: templateSourceHash(template, context),
    })

    return reply.status(201).send(document)
  })

  app.get<{ Params: { id: string } }>(
    "/documents/:id",
    async (request, reply) => {
      const document = await repository.getDocument(request.params.id)

      if (!document) {
        throw new ApiError("DOCUMENT_NOT_FOUND", "Document was not found.", 404)
      }

      return reply.send(document)
    },
  )

  return app
}

export function createTestApp() {
  return createApp({
    repository: new InMemorySecurityProfileRepository(),
    providerSource: new StaticProviderSource([
      {
        id: "prov-github",
        name: "GitHub",
        url: "https://github.com",
        category: "Source Control",
        securityCriticality: "Critical",
        handlesCustomerData: false,
      },
    ]),
    systemTemplateSource: new StaticSystemTemplateSource([
      {
        slug: "security-policy",
        name: "Security Policy",
        description: "A practical starter security policy.",
        content: "# {{ company.name }} Security Policy\n",
      },
      {
        slug: "incident-response-plan",
        name: "Incident Response Plan",
        description: "A lightweight incident response outline.",
        content: "# {{ company.name }} Incident Response Plan\n",
      },
    ]),
  })
}
