import { Pencil, Trash2 } from "lucide-react"
import { type Country, type Vendor, type Vocabulary } from "@complyflow/shared"

import { Button } from "@/components/ui/button"
import { codeLabel, countryLabel } from "@/features/vocabulary/lib/vocabulary"

export const VendorList = ({
  countries,
  vocabulary,
  vendors,
  onEdit,
  onDelete,
}: {
  countries: Country[]
  vocabulary: Vocabulary | undefined
  vendors: Vendor[]
  onEdit: (vendor: Vendor) => void
  onDelete: (vendor: Vendor) => void
}) => {
  if (vendors.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
        No vendors added yet.
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {vendors.map((vendor) => (
        <article
          className="rounded-lg border border-slate-200 bg-white p-4"
          key={vendor.id}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-slate-950">{vendor.name}</h3>
                <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-800">
                  {codeLabel(
                    vocabulary,
                    "data_processing_level",
                    vendor.dataProcessingLevel,
                  )}
                </span>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                  {codeLabel(
                    vocabulary,
                    "vendor_criticality",
                    vendor.criticality,
                  )}
                </span>
                {vendor.dataProcessingLevel !== "none" ? (
                  <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                    {codeLabel(vocabulary, "dpa_status", vendor.dpaStatus)}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-slate-600">{vendor.purpose}</p>
              <p className="mt-2 text-xs text-slate-500">
                {codeLabel(vocabulary, "vendor_category", vendor.category)}
                {vendor.countryOfRegistration
                  ? ` · ${countryLabel(countries, vendor.countryOfRegistration)}`
                  : ""}
                {" · "}
                {vendor.dataProcessingLevel !== "none"
                  ? vendor.dataProcessed
                      .map((value) =>
                        codeLabel(vocabulary, "data_categories", value),
                      )
                      .join(", ") || "No data types selected"
                  : "No data processing"}
              </p>
            </div>
            <div className="flex gap-2">
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
        </article>
      ))}
    </div>
  )
}
