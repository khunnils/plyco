import { type Vendor, type VendorInput } from "@complyflow/shared"
import { create } from "zustand"

type SecurityUiState = {
  activeWorkspaceView:
    | "dashboard"
    | "company"
    | "templates"
    | "documents"
    | "vendors"
  onboardingStep: number
  editingVendorId: string | null
  editingTemplateId: string | null
  viewingDocumentId: string | null
  onboardingVendors: Vendor[]
  editingCompanySection:
    | "company"
    | "infrastructure"
    | "dataHandling"
    | "access"
    | null
  setActiveWorkspaceView: (view: SecurityUiState["activeWorkspaceView"]) => void
  setOnboardingStep: (step: number) => void
  startEditingVendor: (id: string | null) => void
  startEditingTemplate: (id: string | null) => void
  setViewingDocument: (id: string | null) => void
  setEditingCompanySection: (
    section: SecurityUiState["editingCompanySection"]
  ) => void
  addOnboardingVendor: (vendor: VendorInput) => void
  updateOnboardingVendor: (id: string, vendor: VendorInput) => void
  removeOnboardingVendor: (id: string) => void
  clearOnboardingVendors: () => void
}

export const useSecurityUiStore = create<SecurityUiState>((set) => ({
  activeWorkspaceView: "dashboard",
  onboardingStep: 0,
  editingVendorId: null,
  editingTemplateId: null,
  viewingDocumentId: null,
  editingCompanySection: null,
  onboardingVendors: [],
  setActiveWorkspaceView: (view) => set({ activeWorkspaceView: view }),
  setOnboardingStep: (step) => set({ onboardingStep: step }),
  startEditingVendor: (id) => set({ editingVendorId: id }),
  startEditingTemplate: (id) => set({ editingTemplateId: id }),
  setViewingDocument: (id) => set({ viewingDocumentId: id }),
  setEditingCompanySection: (section) =>
    set({ editingCompanySection: section }),
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
