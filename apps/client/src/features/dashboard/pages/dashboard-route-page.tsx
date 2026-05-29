import { useSecurityProfile } from "@/features/company/hooks/use-company"
import { profileFromOrganization } from "@/features/company/lib/profile"
import { DashboardPage } from "@/features/dashboard/components/dashboard-page"
import { PageHeader } from "@/features/shell/components/page-header"

export const DashboardRoutePage = () => {
  const securityProfile = useSecurityProfile()
  const snapshot = securityProfile.data
  const defaultValues = profileFromOrganization(snapshot?.organization ?? null)
  const organizationProviders = snapshot?.organizationProviders ?? []
  const serviceProviderUsage = snapshot?.serviceProviderUsage ?? []
  const businessActivities = snapshot?.businessActivities ?? []

  return (
    <>
      <PageHeader eyebrow="Dashboard" title="Readiness Overview" />
      <DashboardPage
        businessActivities={businessActivities}
        organizationProviders={organizationProviders}
        profile={defaultValues}
        serviceProviderUsage={serviceProviderUsage}
      />
    </>
  )
}
