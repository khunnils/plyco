import { type Vendor, type VendorInput } from "@complyflow/shared"
import { create } from "zustand"

type SecurityUiState = {
  onboardingStep: number
  editingVendorId: string | null
  onboardingVendors: Vendor[]
  setOnboardingStep: (step: number) => void
  startEditingVendor: (id: string | null) => void
  addOnboardingVendor: (vendor: VendorInput) => void
  updateOnboardingVendor: (id: string, vendor: VendorInput) => void
  removeOnboardingVendor: (id: string) => void
  clearOnboardingVendors: () => void
}

export const useSecurityUiStore = create<SecurityUiState>((set) => ({
  onboardingStep: 0,
  editingVendorId: null,
  onboardingVendors: [],
  setOnboardingStep: (step) => set({ onboardingStep: step }),
  startEditingVendor: (id) => set({ editingVendorId: id }),
  addOnboardingVendor: (vendor) =>
    set((state) => {
      const timestamp = new Date().toISOString()

      return {
        onboardingVendors: [
          ...state.onboardingVendors,
          {
            id: `local_${crypto.randomUUID()}`,
            ...vendor,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ],
      }
    }),
  updateOnboardingVendor: (id, vendor) =>
    set((state) => ({
      onboardingVendors: state.onboardingVendors.map((currentVendor) =>
        currentVendor.id === id
          ? { ...currentVendor, ...vendor, updatedAt: new Date().toISOString() }
          : currentVendor
      ),
      editingVendorId: null,
    })),
  removeOnboardingVendor: (id) =>
    set((state) => ({
      onboardingVendors: state.onboardingVendors.filter(
        (vendor) => vendor.id !== id
      ),
    })),
  clearOnboardingVendors: () => set({ onboardingVendors: [] }),
}))
