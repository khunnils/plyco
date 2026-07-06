import oauthPlugin, { type OAuth2Namespace } from "@fastify/oauth2"
import secureSession from "@fastify/secure-session"
import {
  magicLinkRequestSchema,
  magicLinkResponseSchema,
  type AuthUser,
} from "@plyco/shared"
import { type FastifyInstance, type FastifyRequest } from "fastify"
import { createHash, randomBytes } from "node:crypto"
import { z } from "zod"

import { type AuthConfig } from "../config.js"
import { ApiError } from "./errors.js"
import {
  bearerTokenFromRequest,
  hashOrganizationApiKey,
  organizationIdFromUrl,
} from "./organization-api-key.js"
import { type AccountRepository } from "../features/accounts/repository.js"
import { type MagicLinkEmailSender } from "../features/accounts/magic-link-email.js"

type OAuthPluginWithProviders = typeof oauthPlugin & {
  GOOGLE_CONFIGURATION: {
    authorizeHost?: string
    authorizePath?: string
    tokenHost: string
    tokenPath?: string
  }
}

declare module "@fastify/secure-session" {
  interface SessionData {
    user: AuthUser
  }
}

declare module "fastify" {
  interface FastifyInstance {
    googleOAuth2: OAuth2Namespace
  }
  interface FastifyRequest {
    // Set when a request is authenticated by an organization API key rather
    // than a session; holds the organization the key grants access to.
    organizationApiKeyOrgId: string | null
  }
}

const googleUserInfoSchema = z.object({
  sub: z.string().min(1),
  email: z.string().email(),
  email_verified: z.boolean().optional(),
  name: z.string().trim().min(1).optional(),
  picture: z.string().url().optional(),
})

export function getSessionUser(request: FastifyRequest) {
  return request.session?.get("user") ?? null
}

export async function getPersistedSessionUser(
  request: FastifyRequest,
  accountRepository: AccountRepository,
) {
  const user = getSessionUser(request)

  if (!user) {
    return null
  }

  const persistedUser = await accountRepository.getUser(user.id)

  if (!persistedUser) {
    request.session.delete()
    return null
  }

  if (
    persistedUser.email !== user.email ||
    persistedUser.name !== user.name ||
    persistedUser.picture !== user.picture
  ) {
    request.session.set("user", persistedUser)
  }

  return persistedUser
}

export async function registerAuth(
  app: FastifyInstance,
  {
    accountRepository,
    authConfig,
    magicLinkEmailSender,
  }: {
    accountRepository: AccountRepository
    authConfig: AuthConfig
    magicLinkEmailSender: MagicLinkEmailSender
  },
) {
  const cookieOptions = {
    path: "/",
    httpOnly: true,
    secure: authConfig.cookieSecure,
    sameSite: authConfig.cookieSameSite,
  } as const

  app.decorateRequest("organizationApiKeyOrgId", null)

  await app.register(secureSession, {
    secret: authConfig.sessionKey,
    salt: "plyco-auth-salt!",
    cookieName: "cf_session",
    cookie: cookieOptions,
  })

  await app.register(oauthPlugin, {
    name: "googleOAuth2",
    scope: ["openid", "profile", "email"],
    credentials: {
      client: {
        id: authConfig.googleClientId,
        secret: authConfig.googleClientSecret,
      },
      auth: (oauthPlugin as OAuthPluginWithProviders).GOOGLE_CONFIGURATION,
    },
    startRedirectPath: "/auth/google",
    callbackUri: `${authConfig.apiPublicUrl}/auth/google/callback`,
    cookie: cookieOptions,
    pkce: "S256",
  })

  app.get("/auth/google/callback", async function (request, reply) {
    const tokenResponse =
      await this.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(
        request,
        reply,
      )
    const userInfoResponse = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenResponse.token.access_token}`,
        },
      },
    )

    if (!userInfoResponse.ok) {
      throw new ApiError(
        "GOOGLE_USERINFO_FAILED",
        "Google user profile could not be loaded.",
        502,
        { status: userInfoResponse.status },
      )
    }

    const userinfo = googleUserInfoSchema.parse(await userInfoResponse.json())

    if (userinfo.email_verified === false) {
      throw new ApiError(
        "GOOGLE_EMAIL_NOT_VERIFIED",
        "Google account email must be verified.",
        403,
      )
    }

    const user = await accountRepository.upsertGoogleUser({
      googleSubject: userinfo.sub,
      email: userinfo.email,
      name: userinfo.name ?? userinfo.email,
      picture: userinfo.picture,
    })

    request.session.set("user", user)

    return reply.redirect(authConfig.clientUrl)
  })

  app.post("/auth/magic-link", async (request, reply) => {
    const body = magicLinkRequestSchema.parse(request.body)
    const token = randomBytes(32).toString("base64url")
    const returnTo = normalizeReturnTo(body.returnTo)
    await accountRepository.createMagicLinkToken({
      email: body.email,
      tokenHash: hashMagicLinkToken(token),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    })
    const loginUrl = new URL("/auth/magic-link/callback", authConfig.apiPublicUrl)
    loginUrl.searchParams.set("token", token)
    loginUrl.searchParams.set("returnTo", returnTo)

    await magicLinkEmailSender.sendMagicLink({
      email: body.email,
      loginUrl: loginUrl.toString(),
    })

    return reply.status(202).send(magicLinkResponseSchema.parse({ sent: true }))
  })

  app.get("/auth/magic-link/callback", async (request, reply) => {
    const query = z
      .object({
        token: z.string().min(20),
        returnTo: z.string().optional(),
      })
      .parse(request.query)
    const user = await accountRepository.consumeMagicLinkToken({
      tokenHash: hashMagicLinkToken(query.token),
      now: new Date(),
    })

    request.session.set("user", user)

    return reply.redirect(
      new URL(normalizeReturnTo(query.returnTo), authConfig.clientUrl).toString(),
    )
  })

  app.get("/auth/me", async (request) => {
    const user = await getPersistedSessionUser(request, accountRepository)

    return {
      user,
      organizations: user
        ? await accountRepository.listOrganizations(user.id)
        : [],
    }
  })

  app.post("/auth/logout", async (request, reply) => {
    request.session.delete()

    return reply.status(204).send()
  })

  app.addHook("preHandler", async (request) => {
    if (
      request.url === "/health" ||
      request.url === "/waitlist" ||
      request.url.startsWith("/auth/") ||
      request.url.startsWith("/codes/load") ||
      request.url.startsWith("/docs") ||
      request.url.startsWith("/providers/lookup") ||
      request.url.startsWith("/providers/import")
    ) {
      return
    }

    if (await getPersistedSessionUser(request, accountRepository)) {
      return
    }

    // Organization API keys grant read-only access to their own organization's
    // routes. Only GET requests qualify; writes remain session-only. The binary
    // PDF download stays session-only; API clients read the markdown document.
    const isPdfDownload = /\/documents\/[^/]+\/pdf(?:\?|$)/.test(request.url)

    if (request.method === "GET" && !isPdfDownload) {
      const token = bearerTokenFromRequest(request)
      const urlOrganizationId = organizationIdFromUrl(request.url)

      if (token && urlOrganizationId) {
        const keyOrganizationId =
          await accountRepository.getApiKeyOrganizationId(
            hashOrganizationApiKey(token),
          )

        if (keyOrganizationId && keyOrganizationId === urlOrganizationId) {
          request.organizationApiKeyOrgId = keyOrganizationId
          return
        }
      }
    }

    throw new ApiError(
      "AUTHENTICATION_REQUIRED",
      "Authentication is required.",
      401,
    )
  })
}

const hashMagicLinkToken = (token: string) =>
  createHash("sha256").update(token).digest("hex")

const normalizeReturnTo = (returnTo: string | undefined) => {
  if (!returnTo?.startsWith("/") || returnTo.startsWith("//")) {
    return "/"
  }

  try {
    const parsed = new URL(returnTo, "https://plyco.local")

    if (parsed.origin !== "https://plyco.local") {
      return "/"
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return "/"
  }
}
