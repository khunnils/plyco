import { ChevronLeft, ChevronRight, Loader2, LogOut, Save } from "lucide-react"
import { type AuthUser } from "@plyco/shared"
import { type FieldErrors } from "react-hook-form"
import { usePostHog } from "@posthog/react"

import { Button } from "@/components/ui/button"
import {
  ProfileAccessFields,
  ProfileCompanyFields,
  ProfileDataHandlingFields,
  ProfileForm,
  ProfileInfrastructureFields,
} from "@/features/company/components/profile-form"
import { useSaveSecurityProfile } from "@/features/company/hooks/use-company"
import { useProviders } from "@/features/vendors/hooks/use-vendors"
import { useSelectedOrganization } from "@/features/organizations/hooks/use-selected-organization"
import { useCurrentOrganizationStore } from "@/features/organizations/stores/current-organization-store"
import { useSecurityUiStore } from "@/features/shell/stores/security-ui-store"
import { type ProfileDraft } from "@/features/company/types/company"
import {
  useCountries,
  useVocabulary,
} from "@/features/vocabulary/hooks/use-vocabulary"
import {
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
  const posthog = usePostHog()
  const providers = useProviders()
  const countries = useCountries()
  const vocabulary = useVocabulary()
  const saveProfile = useSaveSecurityProfile()
  const { selectedOrganization } = useSelectedOrganization()
  const completeOnboarding = useCurrentOrganizationStore(
    (state) => state.completeOnboarding
  )
  const isSaving = saveProfile.isPending
  const saveError =
    saveProfile.error?.message ??
    countries.error?.message ??
    vocabulary.error?.message ??
    null
  const { onboardingStep, setOnboardingStep } = useSecurityUiStore()
  const activeOnboardingStep = Math.min(
    onboardingStep,
    onboardingSteps.length - 1
  )
  const currentStep = onboardingSteps[activeOnboardingStep]
  const isFinalStep = activeOnboardingStep === onboardingSteps.length - 1

  return (
    <main className="min-h-svh bg-slate-50 px-4 py-6 text-slate-900 md:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-700">plyco</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">
              Security snapshot
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-md bg-white px-3 py-1 text-sm font-medium text-slate-600 ring-1 ring-slate-200">
              {activeOnboardingStep + 1}/{onboardingSteps.length}
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
            saveProfile.mutate(profile, {
              onSuccess: () => {
                posthog.capture("security_profile_saved")
                const orgId = selectedOrganization?.id
                if (orgId) {
                  completeOnboarding(orgId)
                }
              },
            })
          }}
        >
          {(form) => (
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
                {activeOnboardingStep === 0 && (
                  <ProfileCompanyFields
                    complianceGoalOptions={codeOptions(
                      vocabulary.data,
                      "compliance_goals"
                    )}
                    countryOptions={countryOptions(countries.data ?? [])}
                    form={form}
                    industryOptions={codeOptions(vocabulary.data, "industries")}
                    regionOptions={codeOptions(vocabulary.data, "regions")}
                  />
                )}
                {activeOnboardingStep === 1 && (
                  <ProfileInfrastructureFields
                    form={form}
                    providers={providers.data ?? []}
                  />
                )}
                {activeOnboardingStep === 2 && (
                  <ProfileDataHandlingFields
                    collectionMethodOptions={codeOptions(
                      vocabulary.data,
                      "collection_methods"
                    )}
                    form={form}
                    subjectTypeOptions={codeOptions(
                      vocabulary.data,
                      "subject_types"
                    )}
                  />
                )}
                {activeOnboardingStep === 3 && (
                  <ProfileAccessFields form={form} />
                )}

                {saveError && (
                  <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
                    {saveError}
                  </p>
                )}

                <div className="flex items-center justify-between border-t border-slate-200 pt-5">
                  <Button
                    disabled={activeOnboardingStep === 0}
                    type="button"
                    variant="outline"
                    onClick={() => setOnboardingStep(activeOnboardingStep - 1)}
                  >
                    <ChevronLeft />
                    Back
                  </Button>
                  {isFinalStep ? (
                    <Button disabled={isSaving} type="submit">
                      {isSaving ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Save />
                      )}
                      Finish onboarding
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() =>
                        setOnboardingStep(activeOnboardingStep + 1)
                      }
                    >
                      Next
                      <ChevronRight />
                    </Button>
                  )}
                </div>
              </div>
            </section>
          )}
        </ProfileForm>
      </div>
    </main>
  )
}
