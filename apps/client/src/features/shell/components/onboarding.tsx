import { ChevronLeft, ChevronRight, Loader2, LogOut, Save } from "lucide-react"
import { type AuthUser } from "@complyflow/shared"
import { useState } from "react"
import { type FieldErrors } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  dataTypeOptionsFromProfile,
  emptyVendorDraft,
  toVendorInput,
  vendorInputFromProvider,
} from "@/features/security-profile/lib/profile"
import {
  ProfileAccessFields,
  ProfileCompanyFields,
  ProfileDataHandlingFields,
  ProfileForm,
  ProfileInfrastructureFields,
} from "@/features/security-profile/components/profile-form"
import { useSaveSecurityProfile } from "@/features/security-profile/hooks/use-security-profile"
import { ProviderSelector } from "@/features/vendors/components/provider-selector"
import { useCreateVendors, useProviders } from "@/features/vendors/hooks/use-vendors"
import { VendorForm } from "@/features/vendors/components/vendor-form"
import { VendorList } from "@/features/vendors/components/vendor-list"
import { useSelectedOrganization } from "@/features/organizations/hooks/use-selected-organization"
import { useCurrentOrganizationStore } from "@/features/organizations/stores/current-organization-store"
import { useSecurityUiStore } from "@/features/shell/stores/security-ui-store"
import { type ProfileDraft } from "@/features/security-profile/types/security-profile"
import {
  useCountries,
  useVocabulary,
} from "@/features/vocabulary/hooks/use-vocabulary"
import {
  codeLabel,
  codeOptions,
  countryOptions,
} from "@/features/vocabulary/lib/vocabulary"

const onboardingSteps = [
  {
    label: "Company",
    title: "Company profile",
    description:
      "Basic context for security reviews and future policy generation.",
  },
  {
    label: "Infrastructure",
    title: "Infrastructure profile",
    description:
      "The systems and operating practices that shape your baseline posture.",
  },
  {
    label: "Data",
    title: "Data handling",
    description: "A practical overview of the data you store and protect.",
  },
  {
    label: "Access",
    title: "Access controls",
    description: "How people get access, keep access, and lose access.",
  },
  {
    label: "Vendors",
    title: "Vendor inventory",
    description: "Choose common providers or add your own critical vendors.",
  },
]

const stepWithError = (errors: FieldErrors<ProfileDraft>) => {
  if (errors.company) {
    return 0
  }

  if (errors.infrastructure) {
    return 1
  }

  if (errors.dataHandling) {
    return 2
  }

  if (errors.access) {
    return 3
  }

  return 0
}

export const Onboarding = ({
  defaultValues,
  user,
  onLogout,
}: {
  defaultValues: ProfileDraft
  user: AuthUser
  onLogout: () => void
}) => {
  const [showCustomVendorForm, setShowCustomVendorForm] = useState(false)
  const providers = useProviders()
  const countries = useCountries()
  const vocabulary = useVocabulary()
  const saveProfile = useSaveSecurityProfile()
  const createVendors = useCreateVendors()
  const { selectedOrganization } = useSelectedOrganization()
  const completeOnboarding = useCurrentOrganizationStore(
    (state) => state.completeOnboarding
  )
  const isSaving =
    saveProfile.isPending || createVendors.isPending
  const saveError =
    saveProfile.error?.message ??
    createVendors.error?.message ??
    countries.error?.message ??
    vocabulary.error?.message ??
    null
  const {
    addOnboardingVendor,
    editingVendorId,
    onboardingStep,
    onboardingVendors,
    removeOnboardingVendor,
    setOnboardingStep,
    startEditingVendor,
    updateOnboardingVendor,
  } = useSecurityUiStore()
  const currentStep = onboardingSteps[onboardingStep]
  const editingVendor = onboardingVendors.find(
    (vendor) => vendor.id === editingVendorId
  )
  const isFinalStep = onboardingStep === onboardingSteps.length - 1

  return (
    <main className="min-h-svh bg-slate-50 px-4 py-6 text-slate-900 md:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-700">ComplyFlow</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">
              Security snapshot
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-white px-3 py-1 text-sm font-medium text-slate-600 ring-1 ring-slate-200">
              {onboardingStep + 1}/{onboardingSteps.length}
            </span>
            {user.picture ? (
              <img alt="" className="size-9 rounded-full" src={user.picture} />
            ) : null}
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <Button type="button" variant="outline" onClick={onLogout}>
              <LogOut />
              Logout
            </Button>
          </div>
        </div>

        <ProfileForm
          defaultValues={defaultValues}
          onInvalid={(errors) => setOnboardingStep(stepWithError(errors))}
          onSubmit={(profile) => {
            const vendorInputs = onboardingVendors.map(toVendorInput)
            saveProfile.mutate(profile, {
              onSuccess: () => {
                const orgId = selectedOrganization?.id
                if (orgId) {
                  completeOnboarding(orgId)
                }
                if (vendorInputs.length > 0) {
                  createVendors.mutate(vendorInputs)
                }
              },
            })
          }}
        >
          {(form) => {
            const dataTypeOptions = dataTypeOptionsFromProfile(
              form.watch("dataHandling.dataTypesStored")
            ).map((option) => ({
              ...option,
              label: codeLabel(vocabulary.data, "data_categories", option.value),
            }))

            return (
              <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <div className="mb-6">
                  <p className="text-sm font-medium text-slate-500">
                    {currentStep?.label}
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-950">
                    {currentStep?.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {currentStep?.description}
                  </p>
                </div>

                <div className="grid gap-5">
                  {onboardingStep === 0 && (
                    <ProfileCompanyFields
                      complianceGoalOptions={codeOptions(
                        vocabulary.data,
                        "compliance_goals",
                      )}
                      countryOptions={countryOptions(countries.data ?? [])}
                      form={form}
                      industryOptions={codeOptions(vocabulary.data, "industries")}
                      regionOptions={codeOptions(vocabulary.data, "regions")}
                    />
                  )}
                  {onboardingStep === 1 && (
                    <ProfileInfrastructureFields
                      form={form}
                      providers={providers.data ?? []}
                    />
                  )}
                  {onboardingStep === 2 && (
                    <ProfileDataHandlingFields
                      collectionMethodOptions={codeOptions(
                        vocabulary.data,
                        "collection_methods",
                      )}
                      dataCategoryOptions={codeOptions(
                        vocabulary.data,
                        "data_categories",
                      )}
                      form={form}
                      legalBasisOptions={codeOptions(vocabulary.data, "legal_basis")}
                      purposeOptions={codeOptions(vocabulary.data, "data_purposes")}
                      subjectTypeOptions={codeOptions(
                        vocabulary.data,
                        "subject_types",
                      )}
                    />
                  )}
                  {onboardingStep === 3 && <ProfileAccessFields form={form} />}
                  {onboardingStep === 4 && (
                    <>
                      <ProviderSelector
                        error={providers.error?.message ?? null}
                        isLoading={providers.isLoading}
                        providers={providers.data ?? []}
                        onChooseOther={() => {
                          startEditingVendor(null)
                          setShowCustomVendorForm(true)
                        }}
                        onChooseProvider={(provider) =>
                          addOnboardingVendor(vendorInputFromProvider(provider))
                        }
                      />
                      {(showCustomVendorForm || editingVendor) && (
                        <VendorForm
                          countryOptions={countryOptions(countries.data ?? [])}
                          criticalityOptions={codeOptions(
                            vocabulary.data,
                            "vendor_criticality",
                          )}
                          dataTypeOptions={dataTypeOptions}
                          dataProcessingLevelOptions={codeOptions(
                            vocabulary.data,
                            "data_processing_level",
                          )}
                          dataRegionOptions={codeOptions(vocabulary.data, "regions")}
                          defaultValues={
                            editingVendor
                              ? toVendorInput(editingVendor)
                              : emptyVendorDraft
                          }
                          dpaStatusOptions={codeOptions(
                            vocabulary.data,
                            "dpa_status",
                          )}
                          submitLabel={editingVendor ? "Save" : "Add vendor"}
                          vendorCategoryOptions={codeOptions(
                            vocabulary.data,
                            "vendor_category",
                          )}
                          onCancel={
                            editingVendor
                              ? () => {
                                  startEditingVendor(null)
                                  setShowCustomVendorForm(false)
                                }
                              : undefined
                          }
                          onSubmit={(vendor) => {
                            if (editingVendor) {
                              updateOnboardingVendor(editingVendor.id, vendor)
                            } else {
                              addOnboardingVendor(vendor)
                            }

                            setShowCustomVendorForm(false)
                          }}
                        />
                      )}
                      <VendorList
                        countries={countries.data ?? []}
                        vocabulary={vocabulary.data}
                        vendors={onboardingVendors}
                        onDelete={(vendor) => removeOnboardingVendor(vendor.id)}
                        onEdit={(vendor) => {
                          startEditingVendor(vendor.id)
                          setShowCustomVendorForm(true)
                        }}
                      />
                    </>
                  )}

                  {saveError && (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
                      {saveError}
                    </p>
                  )}

                  <div className="flex items-center justify-between border-t border-slate-200 pt-5">
                    <Button
                      disabled={onboardingStep === 0}
                      type="button"
                      variant="outline"
                      onClick={() => setOnboardingStep(onboardingStep - 1)}
                    >
                      <ChevronLeft />
                      Back
                    </Button>
                    {isFinalStep ? (
                      <Button disabled={isSaving} type="submit">
                        {isSaving ? <Loader2 /> : <Save />}
                        Finish onboarding
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => setOnboardingStep(onboardingStep + 1)}
                      >
                        Next
                        <ChevronRight />
                      </Button>
                    )}
                  </div>
                </div>
              </section>
            )
          }}
        </ProfileForm>
      </div>
    </main>
  )
}
