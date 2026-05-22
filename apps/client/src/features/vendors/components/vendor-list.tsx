import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react"
import {
  type Country,
  type ServiceVendorUse,
  type Vendor,
  type Vocabulary,
} from "@plyco/shared"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { codeLabel, countryLabel } from "@/features/vocabulary/lib/vocabulary"

export const VendorList = ({
  countries,
  serviceVendorUses,
  vocabulary,
  vendors,
  onDelete,
  onEdit,
}: {
  countries: Country[]
  serviceVendorUses: ServiceVendorUse[]
  vocabulary: Vocabulary | undefined
  vendors: Vendor[]
  onEdit: (vendor: Vendor) => void
  onDelete: (vendor: Vendor) => void
}) => {
  const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null)

  if (vendors.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
        No vendors added yet.
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {vendors.map((vendor) => {
        const vendorUses = serviceVendorUses.filter(
          (vendorUse) => vendorUse.vendorId === vendor.id,
        )
        const usesByService = Array.from(
          vendorUses
            .reduce((groups, vendorUse) => {
              const serviceKey = vendorUse.serviceId || "unassigned"
              const currentUses = groups.get(serviceKey) ?? []

              groups.set(serviceKey, [...currentUses, vendorUse])

              return groups
            }, new Map<string, ServiceVendorUse[]>())
            .entries(),
        )
        const expanded = expandedVendorId === vendor.id

        return (
          <article
            className="rounded-lg border border-slate-200 bg-white p-4"
            key={vendor.id}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <button
                aria-expanded={expanded}
                className="min-w-0 flex-1 text-left"
                type="button"
                onClick={() =>
                  setExpandedVendorId((current) =>
                    current === vendor.id ? null : vendor.id,
                  )
                }
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-950">
                      {vendor.displayName || vendor.name}
                    </h3>
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      {codeLabel(
                        vocabulary,
                        "vendor_criticality",
                        vendor.criticality,
                      )}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {codeLabel(vocabulary, "vendor_category", vendor.category)}
                    {vendor.countryOfRegistration
                      ? ` - ${countryLabel(countries, vendor.countryOfRegistration)}`
                      : ""}
                    {vendorUses.length > 0
                      ? ` - ${vendorUses.length} service use${vendorUses.length === 1 ? "" : "s"}`
                      : " - No service uses"}
                  </p>
                </div>
              </button>
              <div className="flex gap-2">
                <Button
                  aria-label={expanded ? "Collapse vendor" : "Expand vendor"}
                  size="icon-sm"
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setExpandedVendorId((current) =>
                      current === vendor.id ? null : vendor.id,
                    )
                  }
                >
                  {expanded ? <ChevronUp /> : <ChevronDown />}
                </Button>
                <Button
                  size="icon-sm"
                  type="button"
                  variant="outline"
                  onClick={() => onEdit(vendor)}
                >
                  <Pencil />
                </Button>
                <Button
                  size="icon-sm"
                  type="button"
                  variant="outline"
                  onClick={() => onDelete(vendor)}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
            {expanded && vendorUses.length > 0 ? (
              <div className="mt-4 grid gap-2 border-t border-slate-100 pt-3">
                {usesByService.map(([serviceKey, serviceUses]) => {
                  const firstUse = serviceUses[0]
                  const processingLabels = Array.from(
                    new Set(
                      serviceUses.map((vendorUse) =>
                        codeLabel(
                          vocabulary,
                          "data_processing_level",
                          vendorUse.dataProcessingLevel,
                        ),
                      ),
                    ),
                  )

                  return (
                    <div
                      className="rounded-md bg-slate-50"
                      key={`${vendor.id}:${serviceKey}`}
                    >
                      <div className="flex w-full items-center justify-between gap-3 p-3 text-left">
                        <span className="min-w-0 flex-1">
                          <span className="text-sm font-medium text-slate-900">
                            {firstUse?.serviceName || "Unassigned service"}
                          </span>
                          {processingLabels.map((processingLabel) => (
                            <span
                              className="ml-2 rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-600"
                              key={processingLabel}
                            >
                              {processingLabel}
                            </span>
                          ))}
                        </span>
                      </div>
                      <div className="grid gap-2 border-t border-white px-3 pb-3 pt-2">
                        {serviceUses.map((vendorUse) => (
                          <div
                            className="rounded-md bg-white px-3 py-2"
                            key={vendorUse.id}
                          >
                            <p className="text-sm text-slate-600">
                              {vendorUse.purpose}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {vendorUse.dataProcessingLevel !== "none"
                                ? vendorUse.dataProcessed.join(", ") ||
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
            {expanded && vendorUses.length === 0 ? (
              <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                No service uses for this vendor.
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}
