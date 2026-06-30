import { create } from "zustand"

type SecurityUiState = {
  editingVendorId: string | null
  editingTemplateId: string | null
  viewingDocumentId: string | null
  startEditingVendor: (id: string | null) => void
  startEditingTemplate: (id: string | null) => void
  setViewingDocument: (id: string | null) => void
}

export const useSecurityUiStore = create<SecurityUiState>((set) => ({
  editingVendorId: null,
  editingTemplateId: null,
  viewingDocumentId: null,
  startEditingVendor: (id) => set({ editingVendorId: id }),
  startEditingTemplate: (id) => set({ editingTemplateId: id }),
  setViewingDocument: (id) => set({ viewingDocumentId: id }),
}))
