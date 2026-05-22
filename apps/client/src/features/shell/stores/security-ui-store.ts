import { create } from "zustand"

type SecurityUiState = {
  activeWorkspaceView:
    | "dashboard"
    | "companyProfile"
    | "companyService"
    | "companyActivities"
    | "companyPrivacy"
    | "companyInfrastructure"
    | "companyData"
    | "companyAccess"
    | "templates"
    | "documents"
    | "vendors"
    | "vocabulary"
  onboardingStep: number
  editingVendorId: string | null
  editingTemplateId: string | null
  viewingDocumentId: string | null
  editingCompanySection:
    | "profile"
    | "service"
    | "activities"
    | "privacy"
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
}

export const useSecurityUiStore = create<SecurityUiState>((set) => ({
  activeWorkspaceView: "dashboard",
  onboardingStep: 0,
  editingVendorId: null,
  editingTemplateId: null,
  viewingDocumentId: null,
  editingCompanySection: null,
  setActiveWorkspaceView: (view) => set({ activeWorkspaceView: view }),
  setOnboardingStep: (step) => set({ onboardingStep: step }),
  startEditingVendor: (id) => set({ editingVendorId: id }),
  startEditingTemplate: (id) => set({ editingTemplateId: id }),
  setViewingDocument: (id) => set({ viewingDocumentId: id }),
  setEditingCompanySection: (section) =>
    set({ editingCompanySection: section }),
}))
