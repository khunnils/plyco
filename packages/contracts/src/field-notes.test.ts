import { describe, expect, it } from "vitest";
import {
  emptySecurityProfile,
  securityProfileSchema,
  servicePrivacyProfileBaseSchema,
  emptyServiceProfile,
  storedDataTypeSchema,
  organizationProviderInputSchema,
} from "./index.js";

const note = {
  customerFacing: "  GitHub\nRequired reviewers  ",
  internal: "  Check settings  ",
};

describe("field notes", () => {
  it("normalizes text and removes empty entries without changing answers", () => {
    const parsed = securityProfileSchema.parse({
      ...emptySecurityProfile,
      codeReviewRequired: false,
      fieldNotes: {
        codeReviewRequired: note,
        secretScanning: { customerFacing: "  ", internal: "" },
      },
    });
    expect(parsed.codeReviewRequired).toBe(false);
    expect(parsed.fieldNotes).toEqual({
      codeReviewRequired: {
        customerFacing: "GitHub\nRequired reviewers",
        internal: "Check settings",
      },
    });
    expect(
      securityProfileSchema.parse(emptySecurityProfile).fieldNotes,
    ).toBeUndefined();
  });
  it.each(["id", "updatedAt", "sortOrder", "fieldNotes", "unknownField"])(
    "rejects %s as a security note key",
    (key) => {
      expect(
        securityProfileSchema.safeParse({
          ...emptySecurityProfile,
          fieldNotes: { [key]: note },
        }).success,
      ).toBe(false);
    },
  );
  it("bounds both visibility variants and rejects extra note attributes", () => {
    for (const kind of ["customerFacing", "internal"]) {
      expect(
        securityProfileSchema.safeParse({
          ...emptySecurityProfile,
          fieldNotes: {
            codeReviewRequired: { ...note, [kind]: "x".repeat(5001) },
          },
        }).success,
      ).toBe(false);
    }
    expect(
      securityProfileSchema.safeParse({
        ...emptySecurityProfile,
        fieldNotes: {
          codeReviewRequired: { ...note, public: true },
        },
      }).success,
    ).toBe(false);
  });
  it("accepts stable nested control keys and record-specific fields", () => {
    expect(
      servicePrivacyProfileBaseSchema.parse({
        ...emptyServiceProfile.privacy,
        fieldNotes: {
          "cookieCategories.analytics.requiresConsent": note,
        },
      }).fieldNotes,
    ).toHaveProperty("cookieCategories.analytics.requiresConsent");
    expect(
      storedDataTypeSchema.parse({
        name: "Email",
        fieldNotes: { isSensitive: note },
      }).fieldNotes,
    ).toBeDefined();
    expect(
      organizationProviderInputSchema.parse({
        name: "GitHub",
        criticality: "high",
        fieldNotes: { criticality: note },
      }).fieldNotes,
    ).toBeDefined();
    expect(
      storedDataTypeSchema.safeParse({
        name: "Email",
        fieldNotes: { criticality: note },
      }).success,
    ).toBe(false);
  });
});
