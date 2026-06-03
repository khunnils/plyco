import { create } from "zustand"
import { type AuthUser } from "@plyco/shared"
import { type WizardDraft } from "../../components/types"

interface OnboardingState {
  name: string
  website: string
  draft: WizardDraft | null
  submitError: string | null
  isSubmitting: boolean
  user: AuthUser | null
  onCancel?: () => void
  onComplete?: () => void
  onLogout?: () => void

  setName: (name: string) => void
  setWebsite: (website: string) => void
  setDraft: (draft: WizardDraft | null) => void
  updateDraft: (updater: (current: WizardDraft) => WizardDraft) => void
  setSubmitError: (error: string | null) => void
  setIsSubmitting: (submitting: boolean) => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  name: "",
  website: "",
  draft: null,
  submitError: null,
  isSubmitting: false,
  user: null,
  onCancel: undefined,
  onComplete: undefined,
  onLogout: undefined,

  setName: (name) => set({ name }),
  setWebsite: (website) => set({ website }),
  setDraft: (draft) => set({ draft }),
  updateDraft: (updater) =>
    set((state) => ({
      draft: state.draft ? updater(state.draft) : null,
    })),
  setSubmitError: (submitError) => set({ submitError }),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  reset: () =>
    set({
      name: "",
      website: "",
      draft: null,
      submitError: null,
      isSubmitting: false,
      user: null,
      onCancel: undefined,
      onComplete: undefined,
      onLogout: undefined,
    }),
}))
