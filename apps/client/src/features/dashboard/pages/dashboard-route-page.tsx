import { useSecurityProfile } from "@/features/company/hooks/use-company"
import { profileFromOrganization } from "@/features/company/lib/profile"
import { DashboardPage } from "@/features/dashboard/components/dashboard-page"
import { useDocuments } from "@/features/documents/hooks/use-documents"
import { useRecommendations } from "@/features/recommendations/hooks/use-recommendations"
import { PageHeader } from "@/features/shell/components/page-header"

export const DashboardRoutePage = () => {
  const securityProfile = useSecurityProfile()
  const documents = useDocuments()
  const recommendations = useRecommendations()
  const snapshot = securityProfile.data
  const defaultValues = profileFromOrganization(snapshot?.organization ?? null)
  const organizationProviders = snapshot?.organizationProviders ?? []
  const serviceProviderUsage = snapshot?.serviceProviderUsage ?? []
  const businessActivities = snapshot?.businessActivities ?? []

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Dashboard" }]}
        eyebrow="Dashboard"
        title="Dashboard"
      />
      <DashboardPage
        businessActivities={businessActivities}
        documents={documents.data ?? []}
        documentsLoading={documents.isLoading}
        organizationProviders={organizationProviders}
        profile={defaultValues}
        recommendations={recommendations.data}
        recommendationsLoading={recommendations.isLoading}
        serviceProviderUsage={serviceProviderUsage}
      />
    </>
  )
}
