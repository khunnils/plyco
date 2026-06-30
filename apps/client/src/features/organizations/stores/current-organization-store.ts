import { create } from "zustand"

type CurrentOrganizationState = {
  selectedOrganizationId: string | null
  selectOrganization: (id: string | null) => void
  reset: () => void
}

export const useCurrentOrganizationStore = create<CurrentOrganizationState>(
  (set) => ({
    selectedOrganizationId: null,
    selectOrganization: (id) => set({ selectedOrganizationId: id }),
    reset: () =>
      set({
        selectedOrganizationId: null,
      }),
  })
)
