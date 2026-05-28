import oauthPlugin, { type OAuth2Namespace } from "@fastify/oauth2"
import secureSession from "@fastify/secure-session"
import { type AuthUser } from "@plyco/shared"
import { type FastifyInstance, type FastifyRequest } from "fastify"
import { z } from "zod"

import { type AuthConfig } from "./config.js"
import { ApiError } from "./errors.js"
import { type AccountRepository } from "../features/accounts/repository.js"

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
  }: { accountRepository: AccountRepository; authConfig: AuthConfig },
) {
  const cookieOptions = {
    path: "/",
    httpOnly: true,
    secure: authConfig.cookieSecure,
    sameSite: authConfig.cookieSameSite,
  } as const

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

    const user = await accountRepository.upsertUser({
      googleSubject: userinfo.sub,
      email: userinfo.email,
      name: userinfo.name ?? userinfo.email,
      picture: userinfo.picture,
    })

    request.session.set("user", user)

    return reply.redirect(authConfig.clientUrl)
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
      request.url.startsWith("/auth/") ||
      request.url.startsWith("/providers/lookup") ||
      request.url.startsWith("/providers/import")
    ) {
      return
    }

    if (!(await getPersistedSessionUser(request, accountRepository))) {
      throw new ApiError(
        "AUTHENTICATION_REQUIRED",
        "Authentication is required.",
        401,
      )
    }
  })
}
