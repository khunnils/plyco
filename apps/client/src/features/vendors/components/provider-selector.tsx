import { Check, ExternalLink, Plus, Search, X } from "lucide-react"
import { type Provider } from "@plyco/shared"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const allCategories = "All"

export const ProviderSelector = ({
  providers,
  error,
  existingProviderNames = [],
  isLoading,
  submitDisabled = false,
  onCancel,
  onChooseProviders,
  onChooseOther,
}: {
  providers: Provider[]
  error?: string | null
  existingProviderNames?: string[]
  isLoading: boolean
  submitDisabled?: boolean
  onCancel: () => void
  onChooseProviders: (providers: Provider[]) => void
  onChooseOther: () => void
}) => {
  const [selectedCategory, setSelectedCategory] = useState(allCategories)
  const [selectedProviderIds, setSelectedProviderIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const existingProviderNameSet = useMemo(
    () =>
      new Set(
        existingProviderNames
          .map((name) => name.trim().toLowerCase())
          .filter(Boolean)
      ),
    [existingProviderNames]
  )
  const categories = useMemo(
    () => [
      allCategories,
      ...Array.from(
        new Set(providers.map((provider) => provider.category ?? "Provider"))
      ).sort((first, second) => first.localeCompare(second)),
    ],
    [providers]
  )
  const filteredProviders = useMemo(() => {
    let result = providers
    if (selectedCategory !== allCategories) {
      result = result.filter(
        (provider) => (provider.category ?? "Provider") === selectedCategory
      )
    }
    if (searchTerm.trim() !== "") {
      const lowerSearch = searchTerm.toLowerCase()
      result = result.filter(
        (provider) =>
          provider.name.toLowerCase().includes(lowerSearch) ||
          (provider.category &&
            provider.category.toLowerCase().includes(lowerSearch)) ||
          (provider.url && provider.url.toLowerCase().includes(lowerSearch))
      )
    }
    return result
  }, [providers, selectedCategory, searchTerm])

  const selectedProviders = providers.filter((provider) =>
    selectedProviderIds.includes(provider.id)
  )
  const toggleProvider = (providerId: string) => {
    setSelectedProviderIds((current) =>
      current.includes(providerId)
        ? current.filter((currentId) => currentId !== providerId)
        : [...current, providerId]
    )
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3">
        <div className="relative w-full max-w-xl">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="h-11 rounded-md border-slate-200 bg-white pr-4 pl-9"
            placeholder="Search catalog..."
            value={searchTerm}
            type="text"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {categories.length > 1 ? (
          <div className="flex flex-wrap  gap-2 pb-1">
            {categories.map((category) => (
              <button
                aria-pressed={selectedCategory === category}
                className={cn(
                  "shrink-0 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-950",
                  selectedCategory === category &&
                    "border-slate-900 bg-slate-900 text-white hover:border-slate-900 hover:text-white"
                )}
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        ) : (
          <div />
        )}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredProviders.map((provider) => {
          const alreadyAdded = existingProviderNameSet.has(
            provider.name.trim().toLowerCase()
          )
          const selected = selectedProviderIds.includes(provider.id)

          return (
            <button
              aria-pressed={alreadyAdded || selected}
              className={cn(
                "border p-4 text-left transition focus-visible:ring-1 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:outline-none",
                alreadyAdded
                  ? "border-slate-200 bg-slate-50 text-slate-400"
                  : "border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50",
                selected &&
                  !alreadyAdded &&
                  "border-slate-900 bg-slate-50"
              )}
              disabled={alreadyAdded}
              key={provider.id}
              type="button"
              onClick={() => toggleProvider(provider.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={cn(
                        "truncate font-semibold",
                        alreadyAdded ? "text-slate-500" : "text-slate-950"
                      )}
                    >
                      {provider.name}
                    </h3>
                    {alreadyAdded ? (
                      <Badge variant="secondary">Added</Badge>
                    ) : null}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-sm text-slate-500">
                    <p className="truncate">
                      {provider.category ?? "Provider"}
                    </p>
                    {provider.url ? (
                      <p className="inline-flex max-w-[60%] items-center gap-1 truncate text-xs">
                        <ExternalLink className="size-3" />
                        <span className="truncate">{provider.url}</span>
                      </p>
                    ) : null}
                  </div>
                </div>
              
              </div>
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X />
          Cancel
        </Button>
        <Button
          disabled={submitDisabled || selectedProviders.length === 0}
          type="button"
          onClick={() => onChooseProviders(selectedProviders)}
        >
          <Plus />
          Add selected
        </Button>
        <Button type="button" variant="outline" onClick={onChooseOther}>
          Other
        </Button>
      </div>
      {!isLoading && filteredProviders.length === 0 ? (
        <p className="text-sm text-slate-500">
          {searchTerm.trim() !== ""
            ? "No providers match your search."
            : "No providers match this category."}
        </p>
      ) : null}
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading provider catalog...</p>
      ) : null}
      {error ? (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Provider catalog unavailable. Use Other to add a custom provider.
        </p>
      ) : null}
    </div>
  )
}
