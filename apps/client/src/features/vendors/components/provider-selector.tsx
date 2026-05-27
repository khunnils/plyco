import { ExternalLink, Plus, Search, X } from "lucide-react"
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
        existingProviderNames.map((name) => name.trim().toLowerCase()).filter(Boolean),
      ),
    [existingProviderNames],
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
        (provider) => (provider.category ?? "Provider") === selectedCategory,
      )
    }
    if (searchTerm.trim() !== "") {
      const lowerSearch = searchTerm.toLowerCase()
      result = result.filter(
        (provider) =>
          provider.name.toLowerCase().includes(lowerSearch) ||
          (provider.category &&
            provider.category.toLowerCase().includes(lowerSearch)) ||
          (provider.url && provider.url.toLowerCase().includes(lowerSearch)),
      )
    }
    return result
  }, [providers, selectedCategory, searchTerm])

  const selectedProviders = providers.filter((provider) =>
    selectedProviderIds.includes(provider.id),
  )
  const toggleProvider = (providerId: string, checked: boolean) => {
    setSelectedProviderIds((current) =>
      checked
        ? [...current, providerId]
        : current.filter((currentId) => currentId !== providerId),
    )
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
        ) : (
          <div />
        )}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-9 pr-4"
            placeholder="Search catalog..."
            value={searchTerm}
            type="text"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredProviders.map((provider) => {
          const alreadyAdded = existingProviderNameSet.has(
            provider.name.trim().toLowerCase(),
          )

          return (
              <label
                className={[
                  "border border-slate-200 p-4 text-left transition",
                  alreadyAdded
                    ? "bg-slate-50 text-slate-400"
                    : "cursor-pointer bg-white hover:border-blue-300 hover:bg-blue-50/40",
                ].join(" ")}
                key={provider.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <input
                      checked={
                        alreadyAdded || selectedProviderIds.includes(provider.id)
                      }
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                      disabled={alreadyAdded}
                      type="checkbox"
                      onChange={(event) =>
                        toggleProvider(provider.id, event.target.checked)
                      }
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold text-slate-950">
                          {provider.name}
                        </h3>
                        {alreadyAdded ? (
                          <Badge variant="secondary">Added</Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {provider.category ?? "Provider"}
                      </p>
                    </div>
                  </div>
                  {provider.logoUrl ? (
                    <img
                      alt=""
                      className="size-8 shrink-0 rounded-md object-contain"
                      src={provider.logoUrl}
                    />
                  ) : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-2 pl-7">
                  {provider.securityCriticality ? (
                    <Badge variant="warning">
                      {provider.securityCriticality}
                    </Badge>
                  ) : null}
                  {provider.handlesCustomerData ? (
                    <Badge variant="info">Customer data</Badge>
                  ) : null}
                </div>
                {provider.url ? (
                  <p className="mt-3 inline-flex items-center gap-1 pl-7 text-xs text-slate-500">
                    <ExternalLink className="size-3" />
                    {provider.url}
                  </p>
                ) : null}
              </label>
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
