import { Plus } from "lucide-react"
import {
  type Country,
  type Provider,
  type ServiceVendorUse,
  type Vendor,
  type VendorInput,
  type Vocabulary,
} from "@plyco/shared"

import { Button } from "@/components/ui/button"
import { Section } from "@/features/shell/components/section"
import { VendorEmptyState } from "@/features/vendors/components/vendor-empty-state"
import { VendorForm } from "@/features/vendors/components/vendor-form"
import { VendorList } from "@/features/vendors/components/vendor-list"
import { ProviderSelector } from "@/features/vendors/components/provider-selector"
import {
  emptyVendorDraft,
  toVendorInput,
  vendorInputFromProvider,
} from "@/features/security-profile/lib/profile"
import { codeOptions, countryOptions } from "@/features/vocabulary/lib/vocabulary"

export const VendorInventoryPage = ({
  countries,
  editingVendor,
  isLoadingProviders,
  isMutationPending,
  providerError,
  providers,
  serviceVendorUses,
  showCustomVendorForm,
  showVendorCatalog,
  vocabulary,
  vendors,
  onSubmitVendor,
  onCreateVendors,
  onDeleteVendor,
  onEditVendor,
  onShowCustomVendorFormChange,
  onShowVendorCatalogChange,
}: {
  countries: Country[]
  editingVendor: Vendor | undefined
  isLoadingProviders: boolean
  isMutationPending: boolean
  providerError?: string | null
  providers: Provider[]
  serviceVendorUses: ServiceVendorUse[]
  showCustomVendorForm: boolean
  showVendorCatalog: boolean
  vocabulary: Vocabulary | undefined
  vendors: Vendor[]
  onSubmitVendor: (vendor: VendorInput) => void
  onCreateVendors: (vendors: VendorInput[]) => void
  onDeleteVendor: (vendor: Vendor) => void
  onEditVendor: (vendorId: string | null) => void
  onShowCustomVendorFormChange: (show: boolean) => void
  onShowVendorCatalogChange: (show: boolean) => void
}) => (
  <Section
    description="Review organization vendors or add common providers from the catalog."
    action={
      !showVendorCatalog && !showCustomVendorForm && !editingVendor ? (
        <Button
          className="w-fit"
          type="button"
          onClick={() => {
            onEditVendor(null)
            onShowVendorCatalogChange(true)
          }}
        >
          <Plus />
          Add vendors
        </Button>
      ) : null
    }
    title="Vendors"
  >
    {showVendorCatalog ? (
      <div className="grid gap-4">
        <div>
          <h3 className="font-semibold text-slate-950">
            Add vendors from catalog
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Filter by category, then choose providers to add to the organization
            inventory.
          </p>
        </div>
        <ProviderSelector
          error={providerError ?? null}
          existingProviderNames={vendors.flatMap((vendor) => [
            vendor.name,
            vendor.displayName,
            vendor.providerOrganizationName,
          ])}
          isLoading={isLoadingProviders}
          providers={providers}
          submitDisabled={isMutationPending}
          onCancel={() => {
            onShowVendorCatalogChange(false)
            onShowCustomVendorFormChange(false)
          }}
          onChooseOther={() => {
            onEditVendor(null)
            onShowVendorCatalogChange(false)
            onShowCustomVendorFormChange(true)
          }}
          onChooseProviders={(selectedProviders) => {
            onCreateVendors(selectedProviders.map(vendorInputFromProvider))
          }}
        />
      </div>
    ) : null}

    {(showCustomVendorForm || editingVendor) && (
      <VendorForm
        countryOptions={countryOptions(countries)}
        criticalityOptions={codeOptions(vocabulary, "vendor_criticality")}
        defaultValues={editingVendor ? toVendorInput(editingVendor) : emptyVendorDraft}
        submitDisabled={isMutationPending}
        submitLabel={editingVendor ? "Save" : "Add vendor"}
        vendorCategoryOptions={codeOptions(vocabulary, "vendor_category")}
        onCancel={
          editingVendor
            ? () => {
                onEditVendor(null)
                onShowVendorCatalogChange(false)
                onShowCustomVendorFormChange(false)
              }
            : undefined
        }
        onSubmit={onSubmitVendor}
      />
    )}

    {!showVendorCatalog && !showCustomVendorForm && !editingVendor ? (
      vendors.length > 0 ? (
        <VendorList
          countries={countries}
          serviceVendorUses={serviceVendorUses}
          vocabulary={vocabulary}
          vendors={vendors}
          onDelete={onDeleteVendor}
          onEdit={(vendor) => {
            onEditVendor(vendor.id)
            onShowCustomVendorFormChange(true)
          }}
        />
      ) : (
        <VendorEmptyState
          onAdd={() => {
            onEditVendor(null)
            onShowVendorCatalogChange(true)
          }}
        />
      )
    ) : null}
  </Section>
)
