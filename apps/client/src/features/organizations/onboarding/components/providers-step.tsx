import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, ArrowRight, LogOut, Check, Loader2 } from "lucide-react"
import {
  type Provider,
  type OrganizationProviderInput,
  type ProviderCriticality,
  type ProviderSystemType,
} from "@plyco/shared"

import { Button } from "@/components/ui/button"
import { useOnboardingStore } from "../stores/onboarding-store"
import { CreateShell } from "../../components/create-shell"
import { useProviders } from "@/features/vendors/hooks/use-vendors"

interface ProviderCategoryDefinition {
  id: string
  title: string
  description: string
  systemType: ProviderSystemType
}

const CATEGORIES: ProviderCategoryDefinition[] = [
  {
    id: "auth",
    title: "Workforce Identity Provider",
    description: "How employees signing on to systems, networks, and services are authenticated.",
    systemType: "auth",
  },
  {
    id: "source_control",
    title: "Code repository",
    description: "Where your team stores, manages, and reviews source code for your products.",
    systemType: "source_control",
  },
  {
    id: "cloud",
    title: "Main Cloud Providers",
    description: "The cloud platforms that host your product, databases, storage, or infrastructure.",
    systemType: "cloud",
  },
  {
    id: "analytics",
    title: "Analytics",
    description: "Tools used to capture, aggregate, and analyze user interactions with your product.",
    systemType: "analytics",
  },
  {
    id: "issue_tracking",
    title: "Issue tracking",
    description: "Where your team tracks bugs, roadmap work, and customer/product issues.",
    systemType: "issue_tracking",
  },
]

const getDomain = (url?: string) => {
  if (!url) return ""
  try {
    return new URL(url).hostname
  } catch {
    return ""
  }
}

const mapToOrganizationProviderInput = (
  provider: Provider,
  systemType: ProviderSystemType
): OrganizationProviderInput => {
  const rawCriticality = (provider.securityCriticality || "").toLowerCase()
  const validCriticalities: ProviderCriticality[] = ["low", "medium", "high", "critical"]
  const criticality = validCriticalities.includes(rawCriticality as ProviderCriticality)
    ? (rawCriticality as ProviderCriticality)
    : "medium"

  return {
    providerId: provider.id,
    systemTypes: [systemType],
    name: provider.name,
    legalName: provider.legalName || "",
    category: provider.categoryCode || "",
    countryOfRegistration: provider.countryOfRegistration || "",
    criticality,
    notes: "",
    purpose: provider.purpose || "",
  }
}

const toggleProviderSystemType = (
  providers: OrganizationProviderInput[],
  provider: Provider,
  systemType: ProviderSystemType
) => {
  const existingProvider = providers.find((item) => item.providerId === provider.id)

  if (!existingProvider) {
    return [...providers, mapToOrganizationProviderInput(provider, systemType)]
  }

  const selected = existingProvider.systemTypes.includes(systemType)
  const nextSystemTypes = selected
    ? existingProvider.systemTypes.filter((item) => item !== systemType)
    : [...existingProvider.systemTypes, systemType]

  if (nextSystemTypes.length === 0) {
    return providers.filter((item) => item.providerId !== provider.id)
  }

  return providers.map((item) =>
    item.providerId === provider.id
      ? { ...item, systemTypes: nextSystemTypes }
      : item
  )
}

export const ProvidersStep = () => {
  const navigate = useNavigate()
  const {
    draft,
    updateDraft,
    submitError,
    setSubmitError,
    onCancel,
    onLogout,
  } = useOnboardingStore()

  const { data: providers = [], isLoading, error } = useProviders(Boolean(draft))

  useEffect(() => {
    if (!draft) {
      navigate("../identity", { replace: true })
    }
  }, [draft, navigate])

  if (!draft) {
    return null
  }

  const actions = onCancel ? (
    <Button type="button" variant="outline" onClick={onCancel}>
      Close
    </Button>
  ) : onLogout ? (
    <Button type="button" variant="outline" onClick={onLogout}>
      <LogOut />
      Logout
    </Button>
  ) : null

  const handleNext = () => {
    setSubmitError(null)
    navigate("../review")
  }

  const handleBack = () => {
    navigate("../compliance")
  }

  const toggleProvider = (
    provider: Provider,
    systemType: ProviderSystemType
  ) => {
    updateDraft((current) => {
      return {
        ...current,
        providers: toggleProviderSystemType(
          current.providers,
          provider,
          systemType
        ),
      }
    })
  }

  const footer = (
    <div className="flex items-center justify-between border-t border-slate-200 pt-5 mt-8">
      <Button
        type="button"
        variant="outline"
        onClick={handleBack}
      >
        <ArrowLeft />
        Back
      </Button>
      <Button
        className="bg-slate-900 hover:bg-slate-800 text-white focus-visible:border-slate-950 focus-visible:ring-slate-100"
        type="button"
        onClick={handleNext}
      >
        Next
        <ArrowRight />
      </Button>
    </div>
  )

  return (
    <CreateShell
      actions={actions}
      onBack={handleBack}
      step="providers"
      titleAbove
      description="Select the core technology providers and platforms that power your business and systems."
      title="Technology Providers"
    >
      <section className="grid gap-8">
        {isLoading ? (
          <div className="flex min-h-60 flex-col items-center justify-center gap-2">
            <Loader2 className="size-8 animate-spin text-slate-400" />
            <p className="text-sm font-medium text-slate-500">Loading catalog providers...</p>
          </div>
        ) : error ? (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
            Could not load technology providers. Please try again.
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {CATEGORIES.map((category) => {
              const categoryProviders = providers.filter((p) =>
                p.systemTypes?.includes(category.systemType)
              )

              if (categoryProviders.length === 0) {
                return null
              }

              return (
                <div key={category.id} className="flex flex-col gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{category.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{category.description}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {categoryProviders.map((provider) => {
                      const isSelected = draft.providers.some(
                        (p) =>
                          p.providerId === provider.id &&
                          p.systemTypes.includes(category.systemType)
                      )

                      const domain = getDomain(provider.url)
                      const faviconUrl = provider.logoUrl || (domain ? `https://www.google.com/s2/favicons?sz=128&domain=${domain}` : undefined)

                      return (
                        <div
                          key={provider.id}
                          className={`flex items-center justify-between gap-3 p-3.5 rounded-lg border cursor-pointer select-none transition-all ${
                            isSelected
                              ? "border-slate-950 bg-slate-50/50 ring-1 ring-slate-950/20"
                              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/20"
                          }`}
                          onClick={() => toggleProvider(provider, category.systemType)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {faviconUrl ? (
                              <img
                                src={faviconUrl}
                                alt=""
                                className="size-8 rounded-md object-contain shrink-0 bg-white border border-slate-100 p-0.5"
                                onError={(e) => {
                                  // Fallback if image fails to load
                                  (e.target as HTMLElement).style.display = "none"
                                }}
                              />
                            ) : (
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-sm font-semibold text-slate-600 border border-slate-200">
                                {provider.name.charAt(0)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-950 truncate">
                                {provider.name}
                              </p>
                              {provider.category ? (
                                <p className="text-xs text-slate-400 truncate">
                                  {provider.category}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <div
                            className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                              isSelected
                                ? "border-slate-950 bg-slate-950 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected ? <Check className="size-3" /> : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {submitError ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {submitError}
          </p>
        ) : null}
        {footer}
      </section>
    </CreateShell>
  )
}
