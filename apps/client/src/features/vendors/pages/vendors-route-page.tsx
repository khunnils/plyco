import { useState } from "react"

import { useCountries, useVocabulary } from "@/features/vocabulary/hooks/use-vocabulary"
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

export const VendorsRoutePage = () => {
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
      <PageHeader eyebrow="Providers" title="Provider inventory" />
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
              setShowVendorCatalog(false)
              setShowCustomVendorForm(false)
            },
          })
        }
        onDeleteProvider={(provider) =>
          deleteProvider.mutate(provider.id)
        }
        onEditProvider={startEditingVendor}
        onShowCustomVendorFormChange={setShowCustomVendorForm}
        onShowVendorCatalogChange={setShowVendorCatalog}
        onSubmitProvider={(provider) => {
          if (editingProvider) {
            updateProvider.mutate(
              { id: editingProvider.id, provider },
              {
                onSuccess: () => {
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
              setShowVendorCatalog(false)
              setShowCustomVendorForm(false)
            },
          })
        }}
      />
    </>
  )
}
