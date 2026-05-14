import { create } from "zustand"

type CurrentOrganizationState = {
  selectedOrganizationId: string | null
  onboardingOrganizationIds: Set<string>
  selectOrganization: (id: string | null) => void
  markOnboarding: (organizationId: string) => void
  completeOnboarding: (organizationId: string) => void
  reset: () => void
}

export const useCurrentOrganizationStore = create<CurrentOrganizationState>(
  (set) => ({
    selectedOrganizationId: null,
    onboardingOrganizationIds: new Set(),
    selectOrganization: (id) => set({ selectedOrganizationId: id }),
    markOnboarding: (organizationId) =>
      set((state) => ({
        onboardingOrganizationIds: new Set(
          state.onboardingOrganizationIds
        ).add(organizationId),
      })),
    completeOnboarding: (organizationId) =>
      set((state) => {
        const next = new Set(state.onboardingOrganizationIds)
        next.delete(organizationId)
        return { onboardingOrganizationIds: next }
      }),
    reset: () =>
      set({
        selectedOrganizationId: null,
        onboardingOrganizationIds: new Set(),
      }),
  })
)
