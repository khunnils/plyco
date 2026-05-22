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
  selectedServiceId: string | null
  servicesExpanded: boolean
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
  setSelectedServiceId: (id: string | null) => void
  setServicesExpanded: (expanded: boolean) => void
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
  selectedServiceId: null,
  servicesExpanded: true,
  editingCompanySection: null,
  setActiveWorkspaceView: (view) => set({ activeWorkspaceView: view }),
  setOnboardingStep: (step) => set({ onboardingStep: step }),
  startEditingVendor: (id) => set({ editingVendorId: id }),
  startEditingTemplate: (id) => set({ editingTemplateId: id }),
  setViewingDocument: (id) => set({ viewingDocumentId: id }),
  setSelectedServiceId: (id) => set({ selectedServiceId: id }),
  setServicesExpanded: (expanded) => set({ servicesExpanded: expanded }),
  setEditingCompanySection: (section) =>
    set({ editingCompanySection: section }),
}))
