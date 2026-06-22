import { useState } from "react"
import { usePostHog } from "@posthog/react"

import { POSTHOG_EVENTS } from "@/lib/posthog-events"
import {
  useCountries,
  useVocabulary,
} from "@/features/vocabulary/hooks/use-vocabulary"
import { useSecurityProfile } from "@/features/company/hooks/use-company"
import {
  useCreateOrganizationProvider,
  useCreateOrganizationProviders,
  useDeleteOrganizationProvider,
  useProviders,
  useUpdateOrganizationProvider,
} from "@/features/vendors/hooks/use-vendors"
import { useSecurityUiStore } from "@/features/shell/stores/security-ui-store"
import { VendorInventoryPage } from "@/features/vendors/components/vendor-inventory-page"
import { PageHeader } from "@/features/shell/components/page-header"
import {
  SIDEBAR_SECTION,
  sectionPageBreadcrumbs,
} from "@/features/shell/lib/navigation"

export const VendorsRoutePage = () => {
  const posthog = usePostHog()
  const providers = useProviders()
  const countries = useCountries()
  const vocabulary = useVocabulary()
  const securityProfile = useSecurityProfile()

  const createProvider = useCreateOrganizationProvider()
  const createProviders = useCreateOrganizationProviders()
  const updateProvider = useUpdateOrganizationProvider()
  const deleteProvider = useDeleteOrganizationProvider()

  const { editingVendorId, startEditingVendor } = useSecurityUiStore()

  const snapshot = securityProfile.data
  const serviceProviderUsage = snapshot?.serviceProviderUsage ?? []
  const organizationProviders = snapshot?.organizationProviders ?? []
  const providersList = providers.data ?? []
  const countriesList = countries.data ?? []
  const vocabularyData = vocabulary.data

  const [showVendorCatalog, setShowVendorCatalog] = useState(false)
  const [showCustomVendorForm, setShowCustomVendorForm] = useState(false)

  const isVendorMutationPending =
    createProvider.isPending ||
    createProviders.isPending ||
    updateProvider.isPending ||
    deleteProvider.isPending

  const editingProvider = organizationProviders.find(
    (provider) => provider.id === editingVendorId
  )

  return (
    <>
      <PageHeader
        breadcrumbs={sectionPageBreadcrumbs(SIDEBAR_SECTION.vendors, [
          { label: "Providers" },
        ])}
        eyebrow={SIDEBAR_SECTION.vendors}
        title="Providers"
      />
      <VendorInventoryPage
        countries={countriesList}
        editingProvider={editingProvider}
        isLoadingProviders={providers.isLoading}
        isMutationPending={isVendorMutationPending}
        providerError={providers.error?.message ?? null}
        providers={providersList}
        serviceProviderUsage={serviceProviderUsage}
        showCustomVendorForm={showCustomVendorForm}
        showVendorCatalog={showVendorCatalog}
        vocabulary={vocabularyData}
        organizationProviders={organizationProviders}
        onCreateProviders={(providerInputs) =>
          createProviders.mutate(providerInputs, {
            onSuccess: () => {
              posthog.capture(POSTHOG_EVENTS.VENDOR_ADDED_FROM_CATALOG, {
                vendor_count: providerInputs.length,
                vendor_names: providerInputs.map((p) => p.name),
              })
              setShowVendorCatalog(false)
              setShowCustomVendorForm(false)
            },
          })
        }
        onDeleteProvider={(provider) => {
          posthog.capture(POSTHOG_EVENTS.VENDOR_DELETED, {
            vendor_name: provider.name,
            vendor_category: provider.category,
          })
          deleteProvider.mutate(provider.id)
        }}
        onEditProvider={startEditingVendor}
        onShowCustomVendorFormChange={setShowCustomVendorForm}
        onShowVendorCatalogChange={setShowVendorCatalog}
        onSubmitProvider={(provider) => {
          if (editingProvider) {
            updateProvider.mutate(
              { id: editingProvider.id, provider },
              {
                onSuccess: () => {
                  posthog.capture(POSTHOG_EVENTS.VENDOR_UPDATED, {
                    vendor_name: provider.name,
                    vendor_category: provider.category,
                  })
                  startEditingVendor(null)
                  setShowVendorCatalog(false)
                  setShowCustomVendorForm(false)
                },
              }
            )
            return
          }

          createProvider.mutate(provider, {
            onSuccess: () => {
              posthog.capture(POSTHOG_EVENTS.VENDOR_ADDED_MANUALLY, {
                vendor_name: provider.name,
                vendor_category: provider.category,
              })
              setShowVendorCatalog(false)
              setShowCustomVendorForm(false)
            },
          })
        }}
      />
    </>
  )
}
