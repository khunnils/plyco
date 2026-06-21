import { useState } from "react"
import { Plus } from "lucide-react"
import {
  type Country,
  type Provider,
  type ServiceProviderUsage,
  type OrganizationProvider,
  type OrganizationProviderInput,
  type Vocabulary,
} from "@plyco/shared"

import { Button } from "@/components/ui/button"
import { VendorEmptyState } from "@/features/vendors/components/vendor-empty-state"
import { OrganizationProviderForm } from "@/features/vendors/components/vendor-form"
import { VendorList } from "@/features/vendors/components/vendor-list"
import { ProviderSelector } from "@/features/vendors/components/provider-selector"
import { AddProviderDialog } from "@/features/vendors/components/add-provider-dialog"
import {
  emptyOrganizationProviderDraft,
  toOrganizationProviderInput,
  organizationProviderInputFromProvider,
} from "@/features/company/lib/profile"
import {
  codeOptions,
  countryOptions,
} from "@/features/vocabulary/lib/vocabulary"

export const VendorInventoryPage = ({
  countries,
  editingProvider,
  isLoadingProviders,
  isMutationPending,
  providerError,
  providers,
  serviceProviderUsage,
  showCustomVendorForm,
  showVendorCatalog,
  vocabulary,
  organizationProviders,
  onSubmitProvider,
  onCreateProviders,
  onDeleteProvider,
  onEditProvider,
  onShowCustomVendorFormChange,
  onShowVendorCatalogChange,
}: {
  countries: Country[]
  editingProvider: OrganizationProvider | undefined
  isLoadingProviders: boolean
  isMutationPending: boolean
  providerError?: string | null
  providers: Provider[]
  serviceProviderUsage: ServiceProviderUsage[]
  showCustomVendorForm: boolean
  showVendorCatalog: boolean
  vocabulary: Vocabulary | undefined
  organizationProviders: OrganizationProvider[]
  onSubmitProvider: (provider: OrganizationProviderInput) => void
  onCreateProviders: (providers: OrganizationProviderInput[]) => void
  onDeleteProvider: (provider: OrganizationProvider) => void
  onEditProvider: (providerId: string | null) => void
  onShowCustomVendorFormChange: (show: boolean) => void
  onShowVendorCatalogChange: (show: boolean) => void
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Vendors</h2>
          <p className="mt-1 text-sm text-slate-500">
            Review organization providers or add common providers from the
            catalog.
          </p>
        </div>
        {!showVendorCatalog && !showCustomVendorForm && !editingProvider ? (
          <Button
            className="w-fit shrink-0"
            type="button"
            onClick={() => {
              onEditProvider(null)
              onShowVendorCatalogChange(true)
            }}
          >
            <Plus />
            Add providers
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4">
        {showVendorCatalog ? (
          <div className="grid gap-4">
            <ProviderSelector
              error={providerError ?? null}
              existingProviderNames={organizationProviders.map(
                (provider) => provider.name
              )}
              isLoading={isLoadingProviders}
              providers={providers}
              submitDisabled={isMutationPending}
              onCancel={() => {
                onShowVendorCatalogChange(false)
                onShowCustomVendorFormChange(false)
              }}
              onChooseOther={() => {
                setIsAddDialogOpen(true)
              }}
              onChooseProviders={(selectedProviders) => {
                onCreateProviders(
                  selectedProviders.map(organizationProviderInputFromProvider)
                )
              }}
            />
          </div>
        ) : null}

        {(showCustomVendorForm || editingProvider) && (
          <OrganizationProviderForm
            countryOptions={countryOptions(countries)}
            criticalityOptions={codeOptions(vocabulary, "vendor_criticality")}
            defaultValues={
              editingProvider
                ? toOrganizationProviderInput(editingProvider)
                : emptyOrganizationProviderDraft
            }
            submitDisabled={isMutationPending}
            submitLabel={editingProvider ? "Save" : "Add provider"}
            title={editingProvider ? "Edit provider" : "Add provider"}
            providerCategoryOptions={codeOptions(
              vocabulary,
              "provider_categories"
            )}
            onCancel={
              editingProvider
                ? () => {
                    onEditProvider(null)
                    onShowVendorCatalogChange(false)
                    onShowCustomVendorFormChange(false)
                  }
                : undefined
            }
            onSubmit={onSubmitProvider}
          />
        )}

        {!showVendorCatalog && !showCustomVendorForm && !editingProvider ? (
          organizationProviders.length > 0 ? (
            <VendorList
              countries={countries}
              serviceProviderUsage={serviceProviderUsage}
              vocabulary={vocabulary}
              organizationProviders={organizationProviders}
              onDelete={onDeleteProvider}
              onEdit={(provider) => {
                onEditProvider(provider.id)
                onShowCustomVendorFormChange(true)
              }}
            />
          ) : (
            <VendorEmptyState
              onAdd={() => {
                onEditProvider(null)
                onShowVendorCatalogChange(true)
              }}
            />
          )
        ) : null}
      </div>

      <AddProviderDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={(providerInput) => {
          onSubmitProvider(providerInput)
          setIsAddDialogOpen(false)
        }}
        onTriggerManualAdd={() => {
          onEditProvider(null)
          onShowVendorCatalogChange(false)
          onShowCustomVendorFormChange(true)
        }}
      />
    </div>
  )
}
