import { create } from "zustand"

type SecurityUiState = {
  onboardingStep: number
  editingVendorId: string | null
  editingTemplateId: string | null
  viewingDocumentId: string | null
  selectedServiceId: string | null
  servicesExpanded: boolean
  setOnboardingStep: (step: number) => void
  startEditingVendor: (id: string | null) => void
  startEditingTemplate: (id: string | null) => void
  setViewingDocument: (id: string | null) => void
  setSelectedServiceId: (id: string | null) => void
  setServicesExpanded: (expanded: boolean) => void
}

export const useSecurityUiStore = create<SecurityUiState>((set) => ({
  onboardingStep: 0,
  editingVendorId: null,
  editingTemplateId: null,
  viewingDocumentId: null,
  selectedServiceId: null,
  servicesExpanded: true,
  setOnboardingStep: (step) => set({ onboardingStep: step }),
  startEditingVendor: (id) => set({ editingVendorId: id }),
  startEditingTemplate: (id) => set({ editingTemplateId: id }),
  setViewingDocument: (id) => set({ viewingDocumentId: id }),
  setSelectedServiceId: (id) => set({ selectedServiceId: id }),
  setServicesExpanded: (expanded) => set({ servicesExpanded: expanded }),
}))
