import { useEffect, useRef } from "react"
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom"
import { usePostHog } from "@posthog/react"

import { POSTHOG_EVENTS } from "@/lib/posthog-events"
import { useAuthState, useLogout } from "@/features/auth/hooks/use-auth"
import { LoginScreen } from "@/features/auth/components/login-screen"
import { OnboardingWizardPage } from "@/features/organizations/onboarding/pages/onboarding-wizard-page"
import { useSelectedOrganization } from "@/features/organizations/hooks/use-selected-organization"
import { useOrganizationSnapshot } from "@/features/company/hooks/use-company"
import { startGoogleLogin } from "@/lib/api"
import { LoadingState } from "@/features/shell/components/loading-state"
import { WorkspaceLayout } from "@/features/shell/components/workspace-layout"

// Route Pages
import { DashboardRoutePage } from "@/features/dashboard/pages/dashboard-route-page"
import { RecommendationsRoutePage } from "@/features/recommendations/pages/recommendations-route-page"
import { CompanyProfileRoutePage } from "@/features/company/profile/pages/company-profile-route-page"
import { ServicesRoutePage } from "@/features/company/services/pages/services-route-page"
import { ActivitiesRoutePage } from "@/features/company/activities/pages/activities-route-page"
import { ProductDataGraphRoutePage } from "@/features/company/graph/pages/product-data-graph-route-page"
import { PrivacyProfileRoutePage } from "@/features/company/privacy/pages/privacy-profile-route-page"
import { InfrastructureProfileRoutePage } from "@/features/company/infrastructure/pages/infrastructure-profile-route-page"
import { SecurityProfileRoutePage } from "@/features/company/security/pages/security-profile-route-page"
import { DataHandlingProfileRoutePage } from "@/features/company/data-handling/pages/data-handling-profile-route-page"
import { AccessProfileRoutePage } from "@/features/company/access/pages/access-profile-route-page"
import { VendorsRoutePage } from "@/features/vendors/pages/vendors-route-page"
import { DocumentsRoutePage } from "@/features/documents/pages/documents-route-page"
import {
  InvitationAcceptRoutePage,
  pendingInvitationStorageKey,
} from "@/features/invitations/pages/invitation-accept-route-page"
import {
  SettingsIndexRoutePage,
  SettingsRoutePage,
} from "@/features/settings/pages/settings-route-page"
import { TeamSettingsRoutePage } from "@/features/settings/pages/team-settings-route-page"
import { VocabularySettingsRoutePage } from "@/features/settings/pages/vocabulary-settings-route-page"
import { ApiKeysSettingsRoutePage } from "@/features/settings/pages/api-keys-settings-route-page"
import { McpServerSettingsRoutePage } from "@/features/settings/pages/mcp-server-settings-route-page"

export const App = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const posthog = usePostHog()
  const authState = useAuthState()
  const user = authState.data?.user ?? null
  const isAuthenticated = Boolean(user)
  const identifiedRef = useRef(false)
  const { selectedOrganization } = useSelectedOrganization()
  const organizationSnapshot = useOrganizationSnapshot(
    isAuthenticated && Boolean(selectedOrganization)
  )
  const logout = useLogout()
  const pendingInvitationToken =
    typeof window === "undefined"
      ? null
      : window.localStorage.getItem(pendingInvitationStorageKey)

  useEffect(() => {
    if (user && !identifiedRef.current) {
      identifiedRef.current = true
      posthog.identify(user.email)
      posthog.capture(POSTHOG_EVENTS.USER_SIGNED_IN)
    }
    if (!user) {
      identifiedRef.current = false
    }
  }, [user, posthog])

  useEffect(() => {
    if (
      user &&
      pendingInvitationToken &&
      !location.pathname.startsWith("/invites/")
    ) {
      navigate(`/invites/${pendingInvitationToken}`, { replace: true })
    }
  }, [location.pathname, navigate, pendingInvitationToken, user])

  if (
    authState.isLoading ||
    (isAuthenticated &&
      Boolean(selectedOrganization) &&
      organizationSnapshot.isLoading)
  ) {
    return <LoadingState />
  }

  if (!user) {
    if (location.pathname.startsWith("/invites/")) {
      return (
        <Routes>
          <Route
            path="/invites/:token"
            element={<InvitationAcceptRoutePage user={null} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )
    }

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
          path="/invites/:token"
          element={<InvitationAcceptRoutePage user={user} />}
        />
        <Route
          path="/onboarding/organization/*"
          element={
            <OnboardingWizardPage
              user={user}
              onComplete={() => navigate("/", { replace: true })}
              onLogout={() => logout.mutate()}
            />
          }
        />
        <Route
          path="*"
          element={<Navigate to="/onboarding/organization/identity" replace />}
        />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route
        path="/onboarding/organization/*"
        element={
            <OnboardingWizardPage
            user={user}
            onCancel={() => navigate("/", { replace: true })}
            onComplete={() => navigate("/", { replace: true })}
          />
        }
      />
      <Route
        path="/invites/:token"
        element={<InvitationAcceptRoutePage user={user} />}
      />
      <Route element={<WorkspaceLayout user={user} />}>
        <Route path="/" element={<DashboardRoutePage />} />
        <Route path="/recommendations" element={<RecommendationsRoutePage />} />
        <Route
          path="/rules"
          element={<Navigate replace to="/recommendations" />}
        />
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
          path="/company/security"
          element={<SecurityProfileRoutePage />}
        />
        <Route
          path="/company/data"
          element={<DataHandlingProfileRoutePage />}
        />
        <Route path="/company/access" element={<AccessProfileRoutePage />} />
        <Route path="/vendors" element={<VendorsRoutePage />} />
        <Route path="/settings" element={<SettingsRoutePage />}>
          <Route index element={<SettingsIndexRoutePage />} />
          <Route path="team" element={<TeamSettingsRoutePage />} />
          <Route path="vocabulary" element={<VocabularySettingsRoutePage />} />
          <Route path="api-keys" element={<ApiKeysSettingsRoutePage />} />
          <Route path="mcp-server" element={<McpServerSettingsRoutePage />} />
        </Route>
        <Route
          path="/vocabulary"
          element={<Navigate to="/settings/vocabulary" replace />}
        />
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
