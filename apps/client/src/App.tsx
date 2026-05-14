import { useAuthState, useLogout } from "@/features/auth/hooks/use-auth"
import { LoginScreen } from "@/features/auth/components/login-screen"
import { CreateOrganizationScreen } from "@/features/organizations/components/create-organization-screen"
import { useSelectedOrganization } from "@/features/organizations/hooks/use-selected-organization"
import { useCurrentOrganizationStore } from "@/features/organizations/stores/current-organization-store"
import { emptyProfileDraft } from "@/features/security-profile/lib/profile"
import { useSecurityProfile } from "@/features/security-profile/hooks/use-security-profile"
import { startGoogleLogin } from "@/lib/api"
import { LoadingState } from "@/features/shell/components/loading-state"
import { Onboarding } from "@/features/shell/components/onboarding"
import { Workspace } from "@/features/shell/components/workspace"

export const App = () => {
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

  const snapshot = securityProfile.data
  const shouldShowOnboarding =
    !snapshot?.organization ||
    (selectedOrganization
      ? onboardingOrganizationIds.has(selectedOrganization.id)
      : false)

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
      <CreateOrganizationScreen
        user={user}
        onLogout={() => logout.mutate()}
      />
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

  return <Workspace user={user} />
}

export default App
