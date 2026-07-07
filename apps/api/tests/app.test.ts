import { afterEach, describe, expect, it, vi } from "vitest";

import { allowedCorsOrigins, createApp } from "../src/app.js";
import { type MagicLinkEmailInput } from "../src/features/accounts/magic-link-email.js";
import { createTestApp } from "./helpers.js";
import { readAuthConfig } from "../src/config.js";
import { authConfig, createInMemoryRepositories } from "./helpers.js";

describe("security profile API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns health status", async () => {
    const app = await createTestApp();
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });

  it("serves OpenAPI documentation when enabled", async () => {
    const app = await createApp({
      ...createInMemoryRepositories(),
      auth: false,
      apiDocs: true,
    });
    const response = await app.inject({
      method: "GET",
      url: "/docs/json",
    });

    expect(response.statusCode).toBe(200);
    const document = response.json();
    expect(document.openapi).toBe("3.1.0");
    expect(document.paths).toHaveProperty("/waitlist");
    expect(document.paths).toHaveProperty("/organizations");
    expect(document.paths).toHaveProperty("/organizations/{organizationId}");
    expect(document.paths).toHaveProperty(
      "/organizations/{organizationId}/profile",
    );
    expect(document.paths).toHaveProperty(
      "/organizations/{organizationId}/data",
    );
    expect(document.paths).toHaveProperty(
      "/organizations/{organizationId}/security",
    );
    expect(document.paths).not.toHaveProperty(
      "/organizations/{organizationId}/security-profile",
    );
    expect(document.paths).toHaveProperty("/providers/lookup");
  });

  it("does not register OpenAPI documentation by default in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("API_DOCS_ENABLED", "");
    const app = await createApp({
      ...createInMemoryRepositories(),
      auth: false,
    });
    const response = await app.inject({
      method: "GET",
      url: "/docs/json",
    });

    expect(response.statusCode).toBe(404);
  });

  it("rejects protected routes when authentication is enabled", async () => {
    const app = await createApp({
      ...createInMemoryRepositories(),
      auth: authConfig,
    });
    const response = await app.inject({
      method: "GET",
      url: "/organizations/org-test",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: {
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication is required.",
      },
    });
  });

  it("does not expose the old security-profile endpoint", async () => {
    const app = await createApp({
      ...createInMemoryRepositories(),
      auth: false,
      apiDocs: false,
    });
    const response = await app.inject({
      method: "GET",
      url: "/organizations/org-test/security-profile",
    });

    expect(response.statusCode).toBe(404);
  });

  it("returns anonymous auth state before login", async () => {
    const app = await createApp({
      ...createInMemoryRepositories(),
      auth: authConfig,
    });
    const response = await app.inject({ method: "GET", url: "/auth/me" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ user: null, organizations: [] });
  });

  it("allows the configured marketing origin through CORS", async () => {
    const app = await createApp({
      ...createInMemoryRepositories(),
      auth: authConfig,
    });
    const response = await app.inject({
      method: "OPTIONS",
      url: "/waitlist",
      headers: {
        origin: authConfig.webUrl,
        "access-control-request-method": "POST",
      },
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(
      authConfig.webUrl,
    );
  });

  it("normalizes configured CORS origins", () => {
    expect(
      allowedCorsOrigins([
        "http://localhost:4300/",
        "http://localhost:4300/waitlist",
        "not-a-url",
      ]),
    ).toEqual(["http://localhost:4300"]);
  });

  it("allows additional configured origins through CORS", async () => {
    const app = await createApp({
      ...createInMemoryRepositories(),
      auth: authConfig,
      corsAllowedOrigins: ["https://www.plyco.ai"],
    });
    const response = await app.inject({
      method: "OPTIONS",
      url: "/waitlist",
      headers: {
        origin: "https://www.plyco.ai",
        "access-control-request-method": "POST",
      },
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "https://www.plyco.ai",
    );
  });

  it("supports idempotent logout without a session", async () => {
    const app = await createApp({
      ...createInMemoryRepositories(),
      auth: authConfig,
    });
    const response = await app.inject({ method: "POST", url: "/auth/logout" });

    expect(response.statusCode).toBe(204);
  });

  it("sends magic links with a generic accepted response", async () => {
    const magicLinkEmailSender = new CapturingMagicLinkEmailSender();
    const app = await createApp({
      ...createInMemoryRepositories(),
      auth: authConfig,
      magicLinkEmailSender,
    });
    const response = await app.inject({
      method: "POST",
      url: "/auth/magic-link",
      payload: {
        email: "Founder@Example.com",
        returnTo: "/invites/invite-token",
      },
    });

    expect(response.statusCode).toBe(202);
    expect(response.json()).toEqual({ sent: true });
    expect(magicLinkEmailSender.sent).toHaveLength(1);
    expect(magicLinkEmailSender.sent[0]).toMatchObject({
      email: "founder@example.com",
    });
    expect(new URL(magicLinkEmailSender.sent[0].loginUrl).pathname).toBe(
      "/auth/magic-link/callback",
    );
  });

  it("sets a session cookie when a magic-link callback is consumed", async () => {
    const magicLinkEmailSender = new CapturingMagicLinkEmailSender();
    const app = await createApp({
      ...createInMemoryRepositories(),
      auth: authConfig,
      magicLinkEmailSender,
    });
    await app.inject({
      method: "POST",
      url: "/auth/magic-link",
      payload: {
        email: "founder@example.com",
        returnTo: "/invites/invite-token",
      },
    });

    const loginUrl = new URL(magicLinkEmailSender.sent[0].loginUrl);
    const response = await app.inject({
      method: "GET",
      url: `${loginUrl.pathname}${loginUrl.search}`,
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(
      `${authConfig.clientUrl}/invites/invite-token`,
    );
    expect(response.headers["set-cookie"]).toBeDefined();
  });

  it("normalizes unsafe magic-link callback redirects to the client root", async () => {
    const magicLinkEmailSender = new CapturingMagicLinkEmailSender();
    const app = await createApp({
      ...createInMemoryRepositories(),
      auth: authConfig,
      magicLinkEmailSender,
    });
    await app.inject({
      method: "POST",
      url: "/auth/magic-link",
      payload: {
        email: "founder@example.com",
        returnTo: "/",
      },
    });
    const loginUrl = new URL(magicLinkEmailSender.sent[0].loginUrl);
    loginUrl.searchParams.set("returnTo", "https://evil.example");

    const response = await app.inject({
      method: "GET",
      url: `${loginUrl.pathname}${loginUrl.search}`,
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(`${authConfig.clientUrl}/`);
  });

  it("clears stale authenticated sessions whose user no longer exists", async () => {
    const app = await createApp({
      ...createInMemoryRepositories(),
      auth: authConfig,
    });

    const staleCookieResponse = await app.inject({
      method: "GET",
      url: "/auth/me",
      cookies: {
        cf_session: "Fe26.2**stale-session-cookie-placeholder**placeholder",
      },
    });

    expect(staleCookieResponse.statusCode).toBe(200);
  });

  it("requires auth config values when auth config is read", () => {
    expect(() => readAuthConfig({} as NodeJS.ProcessEnv)).toThrow(
      "SESSION_KEY is required",
    );
  });

  it("requires a high entropy session key", () => {
    expect(() =>
      readAuthConfig({
        SESSION_KEY: "short",
        API_PUBLIC_URL: "http://localhost:4100",
        CLIENT_URL: "http://localhost:4200",
        WEB_URL: "http://localhost:4300",
        GOOGLE_OAUTH_CLIENT_ID: "client",
        GOOGLE_OAUTH_CLIENT_SECRET: "secret",
      } as NodeJS.ProcessEnv),
    ).toThrow("SESSION_KEY must be at least 32 characters");
  });
});

class CapturingMagicLinkEmailSender {
  readonly sent: MagicLinkEmailInput[] = [];

  async sendMagicLink(input: MagicLinkEmailInput) {
    this.sent.push(input);
  }
}
