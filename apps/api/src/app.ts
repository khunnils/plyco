import cors from "@fastify/cors"
import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from "fastify"
import {
  accessProfileSchema,
  companyProfileSchema,
  dataHandlingProfileSchema,
  infrastructureProfileSchema,
  vendorInputSchema,
} from "@complyflow/shared"
import { z } from "zod"

import { ApiError, sendError } from "./errors.js"
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

const securityProfileBodySchema = z.object({
  company: companyProfileSchema,
  infrastructure: infrastructureProfileSchema,
  dataHandling: dataHandlingProfileSchema,
  access: accessProfileSchema,
})

export type CreateAppOptions = {
  repository?: SecurityProfileRepository
  providerSource?: ProviderSource
  logger?: FastifyServerOptions["logger"]
}

export async function createApp({
  repository = process.env.DATABASE_URL
    ? new PrismaSecurityProfileRepository()
    : new InMemorySecurityProfileRepository(),
  providerSource = apiConfig.airtableBase && apiConfig.airtableApiKey
    ? new AirtableProviderSource(
        apiConfig.airtableBase,
        apiConfig.airtableApiKey
      )
    : new StaticProviderSource(),
  logger = false,
}: CreateAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger })

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
      "request failed"
    )

    return sendError(reply, error)
  })

  app.get("/health", async () => ({ status: "ok" }))

  app.get("/security-profile", async () => repository.getSnapshot())

  app.get("/providers", async () => providerSource.listProviders())

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
    }
  )

  app.delete<{ Params: { id: string } }>(
    "/vendors/:id",
    async (request, reply) => {
      const deleted = await repository.deleteVendor(request.params.id)

      if (!deleted) {
        throw new ApiError("VENDOR_NOT_FOUND", "Vendor was not found.", 404)
      }

      return reply.status(204).send()
    }
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
  })
}
