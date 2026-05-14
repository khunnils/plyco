import { ChevronLeft, ChevronRight, Loader2, LogOut, Save } from "lucide-react"
import {
  type AuthUser,
  type Provider,
  type VendorInput,
} from "@complyflow/shared"
import { useState } from "react"
import { type FieldErrors } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  dataTypeOptionsFromProfile,
  emptyVendorDraft,
  toVendorInput,
  vendorInputFromProvider,
} from "@/lib/profile"
import {
  ProfileAccessFields,
  ProfileCompanyFields,
  ProfileDataHandlingFields,
  ProfileForm,
  ProfileInfrastructureFields,
} from "@/components/security/profile-form"
import { ProviderSelector } from "@/components/security/provider-selector"
import { VendorForm } from "@/components/security/vendor-form"
import { VendorList } from "@/components/security/vendor-list"
import { useSecurityUiStore } from "@/stores/security-ui-store"
import { type MutationState, type ProfileDraft } from "@/types/security-profile"

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
  error,
  providers,
  providersError,
  providersLoading,
  saveState,
  user,
  onLogout,
  onSave,
}: {
  defaultValues: ProfileDraft
  error: string | null
  providers: Provider[]
  providersError: string | null
  providersLoading: boolean
  saveState: MutationState
  user: AuthUser
  onLogout: () => void
  onSave: (profile: ProfileDraft, vendors: VendorInput[]) => void
}) => {
  const [showCustomVendorForm, setShowCustomVendorForm] = useState(false)
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
          onSubmit={(profile) =>
            onSave(profile, onboardingVendors.map(toVendorInput))
          }
        >
          {(form) => {
            const dataTypeOptions = dataTypeOptionsFromProfile(
              form.watch("dataHandling.dataTypesStored")
            )

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
                  {onboardingStep === 0 && <ProfileCompanyFields form={form} />}
                  {onboardingStep === 1 && (
                    <ProfileInfrastructureFields
                      form={form}
                      providers={providers}
                    />
                  )}
                  {onboardingStep === 2 && (
                    <ProfileDataHandlingFields form={form} />
                  )}
                  {onboardingStep === 3 && <ProfileAccessFields form={form} />}
                  {onboardingStep === 4 && (
                    <>
                      <ProviderSelector
                        error={providersError}
                        isLoading={providersLoading}
                        providers={providers}
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
                          dataTypeOptions={dataTypeOptions}
                          defaultValues={
                            editingVendor
                              ? toVendorInput(editingVendor)
                              : emptyVendorDraft
                          }
                          submitLabel={
                            editingVendor ? "Update vendor" : "Add vendor"
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
                        vendors={onboardingVendors}
                        onDelete={(vendor) => removeOnboardingVendor(vendor.id)}
                        onEdit={(vendor) => {
                          startEditingVendor(vendor.id)
                          setShowCustomVendorForm(true)
                        }}
                      />
                    </>
                  )}

                  {error && (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
                      {error}
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
                      <Button disabled={saveState === "loading"} type="submit">
                        {saveState === "loading" ? <Loader2 /> : <Save />}
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
