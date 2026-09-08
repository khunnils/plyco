import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { ApiError } from "../src/infrastructure/errors.js";
import { shouldCaptureFastifyError } from "../src/infrastructure/instrumentation.js";

const request = { method: "GET" };

describe("shouldCaptureFastifyError", () => {
  it("does not capture AUTHENTICATION_REQUIRED even when reply status is still 200", () => {
    const error = new ApiError(
      "AUTHENTICATION_REQUIRED",
      "Authentication is required.",
      401,
    );

    expect(shouldCaptureFastifyError(error, request, { statusCode: 200 })).toBe(
      false,
    );
  });

  it("does not capture other expected client ApiErrors", () => {
    const error = new ApiError(
      "ORGANIZATION_NOT_FOUND",
      "Organization not found.",
      404,
    );

    expect(shouldCaptureFastifyError(error, request, { statusCode: 200 })).toBe(
      false,
    );
  });

  it("captures server ApiErrors", () => {
    const error = new ApiError(
      "PROVIDER_CATALOG_LOAD_FAILED",
      "Provider catalog could not be loaded.",
      502,
    );

    expect(shouldCaptureFastifyError(error, request, { statusCode: 200 })).toBe(
      true,
    );
  });

  it("does not capture validation errors", () => {
    const error = new ZodError([]);

    expect(shouldCaptureFastifyError(error, request, { statusCode: 200 })).toBe(
      false,
    );
  });

  it("captures unexpected errors while reply status is still 200", () => {
    expect(
      shouldCaptureFastifyError(new Error("catalog exploded"), request, {
        statusCode: 200,
      }),
    ).toBe(true);
  });
});
