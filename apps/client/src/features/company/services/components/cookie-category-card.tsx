import {
  cookieCategoryDescriptions,
  cookieCategoryLabels,
  defaultCookieCategoryRequiresConsent,
  type CookieCategoryCode,
  type ServiceCookieCategory,
} from "@plyco/shared"
import { ShieldAlert } from "lucide-react"

import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

export const CookieCategoryCard = ({
  category,
  configured,
  isEditing,
  onEnabledChange,
  onRequiresConsentChange,
}: {
  category: CookieCategoryCode
  configured: ServiceCookieCategory | undefined
  isEditing: boolean
  onEnabledChange?: (enabled: boolean) => void
  onRequiresConsentChange?: (requiresConsent: boolean) => void
}) => {
  const enabled = Boolean(configured)
  const requiresConsent =
    configured?.requiresConsent ?? defaultCookieCategoryRequiresConsent(category)
  const consentLabel = requiresConsent
    ? "Requires consent"
    : "Does not require consent"

  return (
    <article
      className={cn(
        "border border-slate-200 p-4",
        isEditing ? "bg-white" : "bg-slate-50"
      )}
    >
      {isEditing ? (
        <div className="grid gap-2">
          <div className="flex items-start justify-between gap-4">
            <h4 className="text-sm font-semibold text-slate-950">
              {cookieCategoryLabels[category]}
            </h4>
            <Switch
              checked={enabled}
              onCheckedChange={(checked) => onEnabledChange?.(checked)}
            />
          </div>
          <div className="flex items-end justify-between gap-4">
            <p className="min-w-0 flex-1 text-sm leading-5 text-slate-500">
              {cookieCategoryDescriptions[category]}
            </p>
            <button
              className={cn(
                "shrink-0 text-right text-xs font-medium text-slate-500",
                enabled
                  ? "cursor-pointer hover:text-slate-700"
                  : "pointer-events-none"
              )}
              type="button"
              tabIndex={enabled ? 0 : -1}
              onClick={() => onRequiresConsentChange?.(!requiresConsent)}
            >
              {consentLabel}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-2">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-semibold text-slate-950">
              {cookieCategoryLabels[category]}
            </h4>
            {requiresConsent ? (
              <span className="group relative inline-flex">
                <button
                  aria-label="Requires consent"
                  className="inline-flex size-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:bg-slate-100 focus-visible:text-slate-700 focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
                  type="button"
                >
                  <ShieldAlert className="size-3.5" />
                </button>
                <span
                  className="pointer-events-none absolute top-6 left-0 z-20 hidden w-48 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-xs leading-5 font-normal text-slate-600 shadow-lg group-focus-within:block group-hover:block"
                  role="tooltip"
                >
                  Requires consent
                </span>
              </span>
            ) : null}
          </div>
          <p className="text-sm leading-5 text-slate-500">
            {cookieCategoryDescriptions[category]}
          </p>
        </div>
      )}
    </article>
  )
}
