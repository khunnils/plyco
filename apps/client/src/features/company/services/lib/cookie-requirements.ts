import {
  type CookieCategoryCode,
  defaultCookieCategoryRequiresConsent,
  normalizeServicePrivacyProfile,
  type ServiceCookieCategory,
  type ServicePrivacyProfile,
} from "@plyco/shared"

export const hasCookieCategoriesRequiringConsent = (
  categories: ServiceCookieCategory[] | null | undefined
) => categories?.some((category) => category.requiresConsent) ?? false

export const cookieCategoryWithDefaultConsent = (
  category: CookieCategoryCode
): ServiceCookieCategory => ({
  category,
  requiresConsent: defaultCookieCategoryRequiresConsent(category),
})

export const normalizeCookiePreferences = (
  privacy: ServicePrivacyProfile
): ServicePrivacyProfile => normalizeServicePrivacyProfile(privacy)
