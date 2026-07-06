import { type FastifyInstance } from "fastify"
import { beforeEach, describe, expect, it } from "vitest"

import { createApp } from "../src/app.js"
import { type MagicLinkEmailInput } from "../src/features/accounts/magic-link-email.js"
import { InMemoryVocabularyRepository } from "../src/features/vocabulary/in-memory-repository.js"
import { authConfig, createInMemoryRepositories } from "./helpers.js"

class CapturingMagicLinkEmailSender {
  readonly sent: MagicLinkEmailInput[] = []

  async sendMagicLink(input: MagicLinkEmailInput) {
    this.sent.push(input)
  }
}

const createAuthedApp = () => {
  const magicLinkEmailSender = new CapturingMagicLinkEmailSender()

  return {
    magicLinkEmailSender,
    app: createApp({
      ...createInMemoryRepositories(),
      vocabularyRepository: new InMemoryVocabularyRepository(),
      auth: authConfig,
      magicLinkEmailSender,
    }),
  }
}

// Logs in through the magic-link flow and returns the resulting session cookie.
const login = async (
  app: FastifyInstance,
  magicLinkEmailSender: CapturingMagicLinkEmailSender,
  email: string,
) => {
  await app.inject({
    method: "POST",
    url: "/auth/magic-link",
    payload: { email },
  })
  const loginUrl = new URL(magicLinkEmailSender.sent.at(-1)!.loginUrl)
  const callback = await app.inject({
    method: "GET",
    url: `${loginUrl.pathname}${loginUrl.search}`,
  })
  const cookie = callback.cookies.find(
    (current) => current.name === "cf_session",
  )!

  return { cf_session: cookie.value }
}

const createOrganization = async (
  app: FastifyInstance,
  session: Record<string, string>,
  name: string,
) => {
  const response = await app.inject({
    method: "POST",
    url: "/organizations",
    cookies: session,
    payload: { name },
  })

  expect(response.statusCode).toBe(201)

  return response.json().id as string
}

describe("organization API keys", () => {
  let app: FastifyInstance
  let magicLinkEmailSender: CapturingMagicLinkEmailSender

  beforeEach(async () => {
    const created = createAuthedApp()
    magicLinkEmailSender = created.magicLinkEmailSender
    app = await created.app
  })

  it("creates a key, reveals the raw secret once, and lists it without the secret", async () => {
    const session = await login(app, magicLinkEmailSender, "owner@example.com")
    const organizationId = await createOrganization(app, session, "Acme AI")

    const created = await app.inject({
      method: "POST",
      url: `/organizations/${organizationId}/api-keys`,
      cookies: session,
      payload: { name: "MCP server" },
    })

    expect(created.statusCode).toBe(201)
    const createdBody = created.json()
    expect(createdBody.name).toBe("MCP server")
    expect(createdBody.key).toMatch(/^plyco_org_/)
    expect(createdBody.keyPrefix).toBe(createdBody.key.slice(0, "plyco_org_".length + 4))
    expect(createdBody.createdByName).toBe("owner@example.com")

    const list = await app.inject({
      method: "GET",
      url: `/organizations/${organizationId}/api-keys`,
      cookies: session,
    })

    expect(list.statusCode).toBe(200)
    expect(list.json()).toHaveLength(1)
    expect(list.json()[0]).toMatchObject({
      id: createdBody.id,
      name: "MCP server",
      keyPrefix: createdBody.keyPrefix,
    })
    expect(list.json()[0]).not.toHaveProperty("key")
  })

  it("authenticates read-only organization requests with a valid key", async () => {
    const session = await login(app, magicLinkEmailSender, "owner@example.com")
    const organizationId = await createOrganization(app, session, "Acme AI")
    const key = (
      await app.inject({
        method: "POST",
        url: `/organizations/${organizationId}/api-keys`,
        cookies: session,
        payload: { name: "MCP server" },
      })
    ).json().key as string

    const read = await app.inject({
      method: "GET",
      url: `/organizations/${organizationId}`,
      headers: { authorization: `Bearer ${key}` },
    })

    expect(read.statusCode).toBe(200)
    expect(read.json().organization).toBeDefined()
  })

  it("rejects invalid keys, writes, and cross-organization access", async () => {
    const session = await login(app, magicLinkEmailSender, "owner@example.com")
    const organizationId = await createOrganization(app, session, "Acme AI")
    const otherOrganizationId = await createOrganization(
      app,
      session,
      "Beta Corp",
    )
    const key = (
      await app.inject({
        method: "POST",
        url: `/organizations/${organizationId}/api-keys`,
        cookies: session,
        payload: { name: "MCP server" },
      })
    ).json().key as string

    const invalidKey = await app.inject({
      method: "GET",
      url: `/organizations/${organizationId}`,
      headers: { authorization: "Bearer plyco_org_not-a-real-key" },
    })
    expect(invalidKey.statusCode).toBe(401)

    const write = await app.inject({
      method: "PUT",
      url: `/organizations/${organizationId}/profile`,
      headers: { authorization: `Bearer ${key}` },
      payload: { companyName: "Renamed" },
    })
    expect(write.statusCode).toBe(401)

    const crossOrg = await app.inject({
      method: "GET",
      url: `/organizations/${otherOrganizationId}`,
      headers: { authorization: `Bearer ${key}` },
    })
    expect(crossOrg.statusCode).toBe(401)

    // API keys cannot manage keys; that path is owner/session only.
    const listWithKey = await app.inject({
      method: "GET",
      url: `/organizations/${organizationId}/api-keys`,
      headers: { authorization: `Bearer ${key}` },
    })
    expect(listWithKey.statusCode).toBe(401)
  })

  it("stops authenticating a revoked key", async () => {
    const session = await login(app, magicLinkEmailSender, "owner@example.com")
    const organizationId = await createOrganization(app, session, "Acme AI")
    const created = await app.inject({
      method: "POST",
      url: `/organizations/${organizationId}/api-keys`,
      cookies: session,
      payload: { name: "MCP server" },
    })
    const key = created.json().key as string
    const keyId = created.json().id as string

    const revoke = await app.inject({
      method: "DELETE",
      url: `/organizations/${organizationId}/api-keys/${keyId}`,
      cookies: session,
    })
    expect(revoke.statusCode).toBe(204)

    const read = await app.inject({
      method: "GET",
      url: `/organizations/${organizationId}`,
      headers: { authorization: `Bearer ${key}` },
    })
    expect(read.statusCode).toBe(401)
  })

  it("only allows owners to manage keys", async () => {
    const ownerSession = await login(
      app,
      magicLinkEmailSender,
      "owner@example.com",
    )
    const organizationId = await createOrganization(
      app,
      ownerSession,
      "Acme AI",
    )

    // A signed-in user who is not an owner of the organization cannot manage
    // its keys.
    const outsiderSession = await login(
      app,
      magicLinkEmailSender,
      "outsider@example.com",
    )
    const outsiderCreate = await app.inject({
      method: "POST",
      url: `/organizations/${organizationId}/api-keys`,
      cookies: outsiderSession,
      payload: { name: "Sneaky" },
    })

    expect(outsiderCreate.statusCode).toBe(403)
    expect(outsiderCreate.json()).toMatchObject({
      error: { code: "ORGANIZATION_OWNER_REQUIRED" },
    })
  })
})
