import { ExternalLink } from "lucide-react"
import { type Provider } from "@complyflow/shared"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const allCategories = "All"

export const ProviderSelector = ({
  providers,
  error,
  isLoading,
  onChooseProvider,
  onChooseOther,
}: {
  providers: Provider[]
  error?: string | null
  isLoading: boolean
  onChooseProvider: (provider: Provider) => void
  onChooseOther: () => void
}) => {
  const [selectedCategory, setSelectedCategory] = useState(allCategories)
  const categories = useMemo(
    () => [
      allCategories,
      ...Array.from(
        new Set(providers.map((provider) => provider.category ?? "Provider"))
      ).sort((first, second) => first.localeCompare(second)),
    ],
    [providers]
  )
  const filteredProviders =
    selectedCategory === allCategories
      ? providers
      : providers.filter(
          (provider) => (provider.category ?? "Provider") === selectedCategory
        )

  return (
    <div className="grid gap-3">
      {categories.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              aria-pressed={selectedCategory === category}
              className={cn(
                "rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-blue-300 hover:text-slate-950",
                selectedCategory === category &&
                  "border-blue-200 bg-blue-50 text-blue-700"
              )}
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredProviders.map((provider) => (
          <button
            className="rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40"
            key={provider.id}
            type="button"
            onClick={() => onChooseProvider(provider)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-950">
                  {provider.name}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {provider.category ?? "Provider"}
                </p>
              </div>
              {provider.logoUrl ? (
                <img
                  alt=""
                  className="size-8 rounded-md object-contain"
                  src={provider.logoUrl}
                />
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {provider.securityCriticality ? (
                <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
                  {provider.securityCriticality}
                </span>
              ) : null}
              {provider.handlesCustomerData ? (
                <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                  Customer data
                </span>
              ) : null}
            </div>
            {provider.url ? (
              <p className="mt-3 inline-flex items-center gap-1 text-xs text-slate-500">
                <ExternalLink className="size-3" />
                {provider.url}
              </p>
            ) : null}
          </button>
        ))}
      </div>
      {!isLoading && filteredProviders.length === 0 ? (
        <p className="text-sm text-slate-500">
          No providers match this category.
        </p>
      ) : null}
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading provider catalog...</p>
      ) : null}
      {error ? (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Provider catalog unavailable. Use Other to add a custom vendor.
        </p>
      ) : null}
      <Button
        className="w-fit"
        type="button"
        variant="outline"
        onClick={onChooseOther}
      >
        Other
      </Button>
    </div>
  )
}
