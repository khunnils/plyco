import { create } from "zustand"

type SecurityUiState = {
  onboardingStep: number
  editingVendorId: string | null
  editingTemplateId: string | null
  viewingDocumentId: string | null
  setOnboardingStep: (step: number) => void
  startEditingVendor: (id: string | null) => void
  startEditingTemplate: (id: string | null) => void
  setViewingDocument: (id: string | null) => void
}

export const useSecurityUiStore = create<SecurityUiState>((set) => ({
  onboardingStep: 0,
  editingVendorId: null,
  editingTemplateId: null,
  viewingDocumentId: null,
  setOnboardingStep: (step) => set({ onboardingStep: step }),
  startEditingVendor: (id) => set({ editingVendorId: id }),
  startEditingTemplate: (id) => set({ editingTemplateId: id }),
  setViewingDocument: (id) => set({ viewingDocumentId: id }),
}))
