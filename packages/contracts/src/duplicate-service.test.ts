import { describe, expect, it } from "vitest";
import { duplicateServiceInputSchema } from "./profiles.js";

const input = {
  serviceName: "Service (copy)",
  serviceUrl: "https://app.example.com",
  primaryHostingRegion: "eu",
};

describe("duplicate service input", () => {
  it("trims values and accepts HTTP and HTTPS URLs", () => {
    expect(
      duplicateServiceInputSchema.parse({
        ...input,
        serviceName: " Copy ",
        serviceUrl: " http://app.example.com ",
      }),
    ).toEqual({
      ...input,
      serviceName: "Copy",
      serviceUrl: "http://app.example.com",
    });
  });

  it.each([
    { serviceName: " " },
    { serviceUrl: "" },
    { serviceUrl: "example.com" },
    { serviceUrl: "ftp://example.com" },
    { serviceUrl: "javascript:alert(1)" },
    { primaryHostingRegion: "" },
    { primaryHostingRegion: "Unknown region" },
  ])("rejects invalid prompted fields %j", (override) => {
    expect(
      duplicateServiceInputSchema.safeParse({ ...input, ...override }).success,
    ).toBe(false);
  });
});
