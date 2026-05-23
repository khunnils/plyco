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
import { Section } from "@/features/shell/components/section"
import { VendorEmptyState } from "@/features/vendors/components/vendor-empty-state"
import { OrganizationProviderForm } from "@/features/vendors/components/vendor-form"
import { VendorList } from "@/features/vendors/components/vendor-list"
import { ProviderSelector } from "@/features/vendors/components/provider-selector"
import {
  emptyOrganizationProviderDraft,
  toOrganizationProviderInput,
  organizationProviderInputFromProvider,
} from "@/features/security-profile/lib/profile"
import { codeOptions, countryOptions } from "@/features/vocabulary/lib/vocabulary"

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
}) => (
  <Section
    description="Review organization providers or add common providers from the catalog."
    action={
      !showVendorCatalog && !showCustomVendorForm && !editingProvider ? (
        <Button
          className="w-fit"
          type="button"
          onClick={() => {
            onEditProvider(null)
            onShowVendorCatalogChange(true)
          }}
        >
          <Plus />
          Add providers
        </Button>
      ) : null
    }
    title="Vendors"
  >
    {showVendorCatalog ? (
      <div className="grid gap-4">
        <div>
          <h3 className="font-semibold text-slate-950">
            Add providers from catalog
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Filter by category, then choose providers to add to the organization
            inventory.
          </p>
        </div>
        <ProviderSelector
          error={providerError ?? null}
          existingProviderNames={organizationProviders.map(
            (provider) => provider.name,
          )}
          isLoading={isLoadingProviders}
          providers={providers}
          submitDisabled={isMutationPending}
          onCancel={() => {
            onShowVendorCatalogChange(false)
            onShowCustomVendorFormChange(false)
          }}
          onChooseOther={() => {
            onEditProvider(null)
            onShowVendorCatalogChange(false)
            onShowCustomVendorFormChange(true)
          }}
          onChooseProviders={(selectedProviders) => {
            onCreateProviders(
              selectedProviders.map(organizationProviderInputFromProvider),
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
        vendorCategoryOptions={codeOptions(vocabulary, "vendor_category")}
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
  </Section>
)
