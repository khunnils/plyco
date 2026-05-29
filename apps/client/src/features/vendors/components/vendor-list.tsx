import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react"
import {
  type Country,
  type ServiceProviderUsage,
  type OrganizationProvider,
  type Vocabulary,
} from "@plyco/shared"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { codeLabel, countryLabel } from "@/features/vocabulary/lib/vocabulary"

export const VendorList = ({
  countries,
  serviceProviderUsage,
  vocabulary,
  organizationProviders,
  onDelete,
  onEdit,
}: {
  countries: Country[]
  serviceProviderUsage: ServiceProviderUsage[]
  vocabulary: Vocabulary | undefined
  organizationProviders: OrganizationProvider[]
  onEdit: (provider: OrganizationProvider) => void
  onDelete: (provider: OrganizationProvider) => void
}) => {
  const [expandedProviderId, setExpandedProviderId] = useState<string | null>(null)

  if (organizationProviders.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
        No providers added yet.
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {organizationProviders.map((provider) => {
        const providerUsage = serviceProviderUsage.filter(
          (usage) => usage.organizationProviderId === provider.id,
        )
        const usesByService = Array.from(
          providerUsage
            .reduce((groups, usage) => {
              const serviceKey = usage.serviceId || "unassigned"
              const currentUses = groups.get(serviceKey) ?? []

              groups.set(serviceKey, [...currentUses, usage])

              return groups
            }, new Map<string, ServiceProviderUsage[]>())
            .entries(),
        )
        const expanded = expandedProviderId === provider.id

        return (
          <article
            className="border border-slate-200 bg-slate-50 p-4"
            key={provider.id}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <button
                aria-expanded={expanded}
                className="min-w-0 flex-1 text-left"
                type="button"
                onClick={() =>
                  setExpandedProviderId((current) =>
                    current === provider.id ? null : provider.id,
                  )
                }
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-950">
                      {provider.name}
                    </h3>
                    <Badge variant="secondary">
                      {codeLabel(
                        vocabulary,
                        "vendor_criticality",
                        provider.criticality,
                      )}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {codeLabel(vocabulary, "provider_categories", provider.category)}
                    {provider.countryOfRegistration
                      ? ` - ${countryLabel(countries, provider.countryOfRegistration)}`
                      : ""}
                    {providerUsage.length > 0
                      ? ` - ${providerUsage.length} service use${providerUsage.length === 1 ? "" : "s"}`
                      : " - No service uses"}
                  </p>
                </div>
              </button>
              <div className="flex gap-2">
                <Button
                  aria-label={expanded ? "Collapse provider" : "Expand provider"}
                  size="icon-sm"
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setExpandedProviderId((current) =>
                      current === provider.id ? null : provider.id,
                    )
                  }
                >
                  {expanded ? <ChevronUp /> : <ChevronDown />}
                </Button>
                <Button
                  size="icon-sm"
                  type="button"
                  variant="outline"
                  onClick={() => onEdit(provider)}
                >
                  <Pencil />
                </Button>
                <Button
                  size="icon-sm"
                  type="button"
                  variant="outline"
                  onClick={() => onDelete(provider)}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
            {expanded && providerUsage.length > 0 ? (
              <div className="mt-4 grid gap-2 border-t border-slate-100 pt-3">
                {usesByService.map(([serviceKey, serviceUses]) => {
                  const firstUse = serviceUses[0]
                  const processingLabels = Array.from(
                    new Set(
                      serviceUses.map((usage) =>
                        codeLabel(
                          vocabulary,
                          "data_processing_level",
                          usage.dataProcessingLevel,
                        ),
                      ),
                    ),
                  )

                  return (
                    <div
                      className=" bg-white border border-slate-200"
                      key={`${provider.id}:${serviceKey}`}
                    >
                      <div className="flex w-full items-center justify-between gap-3 p-3 text-left">
                        <span className="min-w-0 flex-1">
                          <span className="text-sm font-medium text-slate-900">
                            {firstUse?.serviceName || "Unassigned service"}
                          </span>
                          {processingLabels.map((processingLabel) => (
                            <Badge
                              className="ml-2"
                              key={processingLabel}
                              variant="outline"
                            >
                              {processingLabel}
                            </Badge>
                          ))}
                        </span>
                      </div>
                      <div className="grid gap-2 border-t border-white px-3 pb-4 pt-0">
                        {serviceUses.map((usage) => (
                          <div
                            className="rounded-md bg-white px-3 py-0"
                            key={usage.id}
                          >
                            <p className="text-sm text-slate-600">
                              {usage.purpose}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {usage.dataProcessingLevel !== "none"
                                ? usage.dataProcessed.join(", ") ||
                                  "No data types selected"
                                : "No data processing"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : null}
            {expanded && providerUsage.length === 0 ? (
              <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                No service uses for this provider.
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}
