import {
  cookieCategoryCodes,
  type CookieCategoryCode,
  type ServiceCookieCategory,
  type ServiceProfileInput,
} from "@plyco/shared"
import { useEffect, useState } from "react"

import { ProfilePanelShell } from "@/features/company/components/profile-panel-shell"
import {
  cookieCategoryWithDefaultConsent,
  normalizeCookiePreferences,
} from "@/features/company/services/lib/cookie-requirements"
import { type ServicePrivacyDraft } from "@/features/company/services/lib/service-drafts"
import { CookieCategoryCard } from "../cookie-category-card"

const CategoryCards = ({
  categories,
  isEditing,
  onEnabledChange,
  onRequiresConsentChange,
}: {
  categories: ServiceCookieCategory[]
  isEditing: boolean
  onEnabledChange?: (category: CookieCategoryCode, enabled: boolean) => void
  onRequiresConsentChange?: (
    category: CookieCategoryCode,
    requiresConsent: boolean
  ) => void
}) => {
  const visibleCategories = isEditing
    ? cookieCategoryCodes
    : cookieCategoryCodes.filter((category) =>
        categories.some((candidate) => candidate.category === category)
      )

  if (!isEditing && visibleCategories.length === 0) {
    return (
      <div className="border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
        No cookie categories enabled.
      </div>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {visibleCategories.map((category) => {
        const configured = categories.find(
          (candidate) => candidate.category === category
        )

        return (
          <CookieCategoryCard
            category={category}
            configured={configured}
            isEditing={isEditing}
            key={category}
            onEnabledChange={
              onEnabledChange
                ? (enabled) => onEnabledChange(category, enabled)
                : undefined
            }
            onRequiresConsentChange={
              onRequiresConsentChange
                ? (requiresConsent) =>
                    onRequiresConsentChange(category, requiresConsent)
                : undefined
            }
          />
        )
      })}
    </div>
  )
}

export const ServiceCookieCategoriesPanel = ({
  isMutationPending,
  needsAttention,
  service,
  onSave,
}: {
  isMutationPending: boolean
  needsAttention?: boolean
  service: ServiceProfileInput
  onSave: (patch: ServicePrivacyDraft, onSuccess?: () => void) => void
}) => {
  const serverCategories = service.privacy.cookieCategories
  const savedCategories = serverCategories ?? []
  const [isEditing, setIsEditing] = useState(false)
  const [draftCategories, setDraftCategories] =
    useState<ServiceCookieCategory[]>(savedCategories)

  useEffect(() => {
    if (!isEditing) {
      setDraftCategories(serverCategories ?? [])
    }
  }, [isEditing, serverCategories])

  const setCategoryEnabled = (
    category: CookieCategoryCode,
    enabled: boolean
  ) => {
    if (!enabled) {
      setDraftCategories((current) =>
        current.filter((configured) => configured.category !== category)
      )
      return
    }

    setDraftCategories((current) =>
      cookieCategoryCodes.flatMap((candidate) => {
        const configured = current.find(
          (existing) => existing.category === candidate
        )

        if (configured) {
          return [configured]
        }

        return candidate === category
          ? [cookieCategoryWithDefaultConsent(category)]
          : []
      })
    )
  }

  const setCategoryRequiresConsent = (
    category: CookieCategoryCode,
    requiresConsent: boolean
  ) => {
    setDraftCategories((current) =>
      current.map((configured) =>
        configured.category === category
          ? { ...configured, requiresConsent }
          : configured
      )
    )
  }

  return (
    <ProfilePanelShell
      description="Types of cookie categories used by this service."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      needsAttention={needsAttention}
      readOnlyContent={
        <CategoryCards categories={savedCategories} isEditing={false} />
      }
      saveLabel="Save"
      title="Cookie Categories"
      onCancel={() => {
        setDraftCategories(savedCategories)
        setIsEditing(false)
      }}
      onEdit={() => {
        setDraftCategories(savedCategories)
        setIsEditing(true)
      }}
      onSave={() => {
        onSave(
          {
            privacy: normalizeCookiePreferences({
              ...service.privacy,
              cookieCategories: draftCategories,
            }),
          },
          () => setIsEditing(false)
        )
      }}
    >
      <CategoryCards
        categories={draftCategories}
        isEditing
        onEnabledChange={setCategoryEnabled}
        onRequiresConsentChange={setCategoryRequiresConsent}
      />
    </ProfilePanelShell>
  )
}
