import { Routes, Route, Navigate, useNavigate } from "react-router-dom"

import { useAuthState, useLogout } from "@/features/auth/hooks/use-auth"
import { LoginScreen } from "@/features/auth/components/login-screen"
import { OnboardingWizardPage } from "@/features/organizations/onboarding/pages/onboarding-wizard-page"
import { useSelectedOrganization } from "@/features/organizations/hooks/use-selected-organization"
import { useCurrentOrganizationStore } from "@/features/organizations/stores/current-organization-store"
import { emptyProfileDraft } from "@/features/company/lib/profile"
import { useSecurityProfile } from "@/features/company/hooks/use-company"
import { startGoogleLogin } from "@/lib/api"
import { LoadingState } from "@/features/shell/components/loading-state"
import { Onboarding } from "@/features/shell/components/onboarding"
import { WorkspaceLayout } from "@/features/shell/components/workspace-layout"

// Route Pages
import { DashboardRoutePage } from "@/features/dashboard/pages/dashboard-route-page"
import { CompanyProfileRoutePage } from "@/features/company/profile/pages/company-profile-route-page"
import { ServicesRoutePage } from "@/features/company/services/pages/services-route-page"
import { ActivitiesRoutePage } from "@/features/company/activities/pages/activities-route-page"
import { ProductDataGraphRoutePage } from "@/features/company/graph/pages/product-data-graph-route-page"
import { PrivacyProfileRoutePage } from "@/features/company/privacy/pages/privacy-profile-route-page"
import { InfrastructureProfileRoutePage } from "@/features/company/infrastructure/pages/infrastructure-profile-route-page"
import { DataHandlingProfileRoutePage } from "@/features/company/data-handling/pages/data-handling-profile-route-page"
import { AccessProfileRoutePage } from "@/features/company/access/pages/access-profile-route-page"
import { VendorsRoutePage } from "@/features/vendors/pages/vendors-route-page"
import { VocabularyRoutePage } from "@/features/vocabulary/pages/vocabulary-route-page"
import { DocumentsRoutePage } from "@/features/documents/pages/documents-route-page"

export const App = () => {
  const navigate = useNavigate()
  const authState = useAuthState()
  const user = authState.data?.user ?? null
  const isAuthenticated = Boolean(user)
  const { selectedOrganization } = useSelectedOrganization()
  const onboardingOrganizationIds = useCurrentOrganizationStore(
    (state) => state.onboardingOrganizationIds
  )
  const securityProfile = useSecurityProfile(
    isAuthenticated && Boolean(selectedOrganization)
  )
  const logout = useLogout()

  const shouldShowOnboarding = selectedOrganization
    ? onboardingOrganizationIds.has(selectedOrganization.id)
    : false

  if (
    authState.isLoading ||
    (isAuthenticated &&
      Boolean(selectedOrganization) &&
      securityProfile.isLoading)
  ) {
    return <LoadingState />
  }

  if (!user) {
    return (
      <LoginScreen
        error={authState.error?.message ?? null}
        onLogin={startGoogleLogin}
      />
    )
  }

  if (!selectedOrganization) {
    return (
      <Routes>
        <Route
          path="/onboarding/organization/*"
          element={
            <OnboardingWizardPage
              user={user}
              onLogout={() => logout.mutate()}
            />
          }
        />
        <Route path="*" element={<Navigate to="/onboarding/organization/identity" replace />} />
      </Routes>
    )
  }

  if (shouldShowOnboarding) {
    return (
      <Onboarding
        defaultValues={emptyProfileDraft}
        user={user}
        onLogout={() => logout.mutate()}
      />
    )
  }

  return (
    <Routes>
      <Route
        path="/onboarding/organization/*"
        element={
          <OnboardingWizardPage
            user={user}
            onCancel={() => navigate("/")}
            onComplete={() => navigate("/")}
          />
        }
      />
      <Route element={<WorkspaceLayout user={user} />}>
        <Route path="/" element={<DashboardRoutePage />} />
        <Route path="/company/profile" element={<CompanyProfileRoutePage />} />
        <Route path="/company/services" element={<ServicesRoutePage />} />
        <Route
          path="/company/services/:serviceId"
          element={<ServicesRoutePage />}
        />
        <Route path="/company/activities" element={<ActivitiesRoutePage />} />
        <Route path="/company/graph" element={<ProductDataGraphRoutePage />} />
        <Route path="/company/privacy" element={<PrivacyProfileRoutePage />} />
        <Route
          path="/company/infrastructure"
          element={<InfrastructureProfileRoutePage />}
        />
        <Route
          path="/company/data"
          element={<DataHandlingProfileRoutePage />}
        />
        <Route path="/company/access" element={<AccessProfileRoutePage />} />
        <Route path="/vendors" element={<VendorsRoutePage />} />
        <Route path="/vocabulary" element={<VocabularyRoutePage />} />
        <Route path="/documents" element={<DocumentsRoutePage />} />
        <Route path="/documents/:mode" element={<DocumentsRoutePage />} />
        <Route path="/documents/:mode/:id" element={<DocumentsRoutePage />} />
        <Route
          path="/templates/*"
          element={<Navigate to="/documents" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
