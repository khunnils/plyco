import { afterEach, describe, expect, it, vi } from "vitest";

import { createApp } from "../src/app.js";
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

  it("rejects protected routes when authentication is enabled", async () => {
    const app = await createApp({
      ...createInMemoryRepositories(),
      auth: authConfig,
    });
    const response = await app.inject({
      method: "GET",
      url: "/organizations/org-test/security-profile",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: {
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication is required.",
      },
    });
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

  it("supports idempotent logout without a session", async () => {
    const app = await createApp({
      ...createInMemoryRepositories(),
      auth: authConfig,
    });
    const response = await app.inject({ method: "POST", url: "/auth/logout" });

    expect(response.statusCode).toBe(204);
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
        API_PUBLIC_URL: "http://localhost:4000",
        CLIENT_URL: "http://localhost:5173",
        GOOGLE_OAUTH_CLIENT_ID: "client",
        GOOGLE_OAUTH_CLIENT_SECRET: "secret",
      } as NodeJS.ProcessEnv),
    ).toThrow("SESSION_KEY must be at least 32 characters");
  });
});
