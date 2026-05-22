import { Pencil, Trash2 } from "lucide-react"
import {
  type Country,
  type ServiceVendorUse,
  type Vendor,
  type Vocabulary,
} from "@plyco/shared"

import { Button } from "@/components/ui/button"
import { codeLabel, countryLabel } from "@/features/vocabulary/lib/vocabulary"

export const VendorList = ({
  countries,
  serviceVendorUses,
  vocabulary,
  vendors,
  onDelete,
  onDeleteUse,
  onEdit,
  onEditUse,
}: {
  countries: Country[]
  serviceVendorUses: ServiceVendorUse[]
  vocabulary: Vocabulary | undefined
  vendors: Vendor[]
  onEdit: (vendor: Vendor) => void
  onDelete: (vendor: Vendor) => void
  onEditUse: (vendorUse: ServiceVendorUse) => void
  onDeleteUse: (vendorUse: ServiceVendorUse) => void
}) => {
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

        return (
          <article
            className="rounded-lg border border-slate-200 bg-white p-4"
            key={vendor.id}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
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
            {vendorUses.length > 0 ? (
              <div className="mt-4 grid gap-2 border-t border-slate-100 pt-3">
                {vendorUses.map((vendorUse) => (
                  <div
                    className="flex flex-col gap-2 rounded-md bg-slate-50 p-3 md:flex-row md:items-start md:justify-between"
                    key={vendorUse.id}
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {vendorUse.serviceName || "Unassigned service"}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {vendorUse.purpose}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {codeLabel(
                          vocabulary,
                          "data_processing_level",
                          vendorUse.dataProcessingLevel,
                        )}
                        {" - "}
                        {vendorUse.dataProcessingLevel !== "none"
                          ? vendorUse.dataProcessed.join(", ") ||
                              "No data types selected"
                          : "No data processing"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon-sm"
                        type="button"
                        variant="outline"
                        onClick={() => onEditUse(vendorUse)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        size="icon-sm"
                        type="button"
                        variant="outline"
                        onClick={() => onDeleteUse(vendorUse)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}
