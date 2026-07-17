import { emptyServiceProfile } from "@plyco/shared"
import { describe, expect, it } from "vitest"

import {
  cookieCategoryWithDefaultConsent,
  hasCookieCategoriesRequiringConsent,
  normalizeCookiePreferences,
} from "@/features/company/services/lib/cookie-requirements"

describe("cookie requirements", () => {
  it("creates category rows with deterministic consent defaults", () => {
    expect(cookieCategoryWithDefaultConsent("necessary")).toMatchObject({
      category: "necessary",
      requiresConsent: false,
    })
    expect(cookieCategoryWithDefaultConsent("preferences")).toMatchObject({
      category: "preferences",
      requiresConsent: true,
    })
    expect(cookieCategoryWithDefaultConsent("analytics")).toMatchObject({
      category: "analytics",
      requiresConsent: true,
    })
    expect(cookieCategoryWithDefaultConsent("marketing")).toMatchObject({
      category: "marketing",
      requiresConsent: true,
    })
  })

  it("uses each category's editable consent decision", () => {
    expect(
      hasCookieCategoriesRequiringConsent([
        {
          category: "necessary",
          requiresConsent: false,
        },
      ])
    ).toBe(false)
    expect(
      hasCookieCategoriesRequiringConsent([
        {
          category: "necessary",
          requiresConsent: true,
        },
      ])
    ).toBe(true)
  })

  it("clears categories and consent when cookie usage is disabled", () => {
    const privacy = normalizeCookiePreferences({
      ...emptyServiceProfile.privacy,
      usesCookiesOrTrackingTechnologies: false,
      cookieCategories: [
        {
          category: "analytics",
          requiresConsent: true,
        },
      ],
      cookieConsentMechanism: "cookie_banner",
      nonEssentialCookiesBlockedUntilConsent: true,
      cookieConsentWithdrawalMethod: "cookie_preferences",
      globalPrivacyControlSupported: true,
    })

    expect(privacy).toMatchObject({
      cookieCategories: null,
      cookieConsentMechanism: null,
      nonEssentialCookiesBlockedUntilConsent: null,
      cookieConsentWithdrawalMethod: null,
      globalPrivacyControlSupported: null,
    })
  })

  it("clears consent when no configured category requires it", () => {
    const privacy = normalizeCookiePreferences({
      ...emptyServiceProfile.privacy,
      usesCookiesOrTrackingTechnologies: true,
      cookieCategories: [
        {
          category: "necessary",
          requiresConsent: false,
        },
      ],
      cookieConsentMechanism: "cookie_banner",
      nonEssentialCookiesBlockedUntilConsent: true,
      cookieConsentWithdrawalMethod: "cookie_preferences",
      globalPrivacyControlSupported: true,
    })

    expect(privacy).toMatchObject({
      cookieConsentMechanism: null,
      nonEssentialCookiesBlockedUntilConsent: null,
      cookieConsentWithdrawalMethod: null,
      globalPrivacyControlSupported: null,
    })
  })
})
