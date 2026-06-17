import {
  type DocumentSummary,
  type OrganizationProvider,
  type RecommendationsResponse,
  type ServiceProviderUsage,
  type BusinessActivity,
  isComplianceFieldVisible,
} from "@plyco/shared"
import { Link } from "react-router-dom"
import {
  Building2,
  ShieldCheck,
  Shield,
  Server,
  KeyRound,
  ClipboardList,
  Database,
  CheckCircle2,
  FileText,
} from "lucide-react"

import { type ProfileDraft } from "@/features/company/types/company"
import { DashboardServiceCard } from "@/features/dashboard/components/dashboard-service-card"
import { SIDEBAR_SECTION } from "@/features/shell/lib/navigation"
import {
  dashboardProgress,
  groupProgress,
  isProgressComplete,
  isActivityComplete,
} from "@/features/dashboard/lib/progress"
import {
  severityBorderClass,
  severityLabel,
  severityOrder,
} from "@/features/recommendations/lib/recommendations"

interface CategoryCardProps {
  title: string
  description: string
  href: string
  isComplete: boolean
  statusText?: string
  icon: React.ComponentType<{ className?: string }>
  className?: string
}

const CategoryCard = ({
  title,
  description,
  href,
  isComplete,
  statusText,
  icon: Icon,
  className = "",
}: CategoryCardProps) => {
  return (
    <Link
      to={href}
      className={`group relative flex flex-col justify-between border border-slate-200 bg-white p-4  hover:border-slate-300 focus-visible:ring-3 focus-visible:ring-slate-200 focus-visible:outline-none ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex size-10 items-center justify-center rounded-md bg-blue-50 text-slate-600">
            <Icon className="h-5 w-5" />
          </div>
          {isComplete ? (
            <CheckCircle2 className="h-6 w-6 text-emerald-600 fill-emerald-50 shrink-0" />
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-600 shrink-0">
              <div className="h-2 w-2 rounded-full bg-blue-600"></div>
            </div>
          )}
        </div>
        <h3 className="text-base font-semibold text-slate-950 group-hover:text-slate-700 transition-colors">
          {title}
        </h3>
        <p className="mt-1 text-sm text-slate-500 leading-normal">
          {statusText || description}
        </p>
      </div>
    </Link>
  )
}

const SectionHeading = ({ children }: { children: string }) => (
  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
    {children}
  </span>
)

const DocumentReasonsTooltip = ({
  outdatedDocuments,
}: {
  outdatedDocuments: DocumentSummary[]
}) => {
  if (outdatedDocuments.length === 0) {
    return null
  }

  return (
    <span className="group relative inline-flex">
      <button
        aria-label="Outdated document details"
        className="text-sm font-medium text-amber-700 underline-offset-4 hover:text-amber-900 hover:underline focus-visible:ring-3 focus-visible:ring-amber-100 focus-visible:outline-none"
        type="button"
      >
        Details
      </button>
      <span
        className="pointer-events-none absolute right-0 top-7 z-20 hidden w-80 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-xs font-normal leading-5 text-slate-600 shadow-lg group-hover:block group-focus-within:block"
        role="tooltip"
      >
        {outdatedDocuments.slice(0, 4).map((summary) => (
          <span className="block py-1" key={summary.template.id}>
            <strong className="block font-semibold text-slate-900">
              {summary.template.name}
            </strong>
            {(summary.staleReasons.length
              ? summary.staleReasons
              : ["Regenerate to refresh this document."]
            )
              .slice(0, 2)
              .map((reason) => (
                <span className="block" key={reason}>
                  {reason}
                </span>
              ))}
          </span>
        ))}
      </span>
    </span>
  )
}

export const DashboardPage = ({
  documents = [],
  documentsLoading = false,
  organizationProviders,
  profile,
  recommendations,
  recommendationsLoading = false,
  serviceProviderUsage,
  businessActivities = [],
}: {
  documents?: DocumentSummary[]
  documentsLoading?: boolean
  organizationProviders: OrganizationProvider[]
  profile: ProfileDraft
  recommendations?: RecommendationsResponse
  recommendationsLoading?: boolean
  serviceProviderUsage: ServiceProviderUsage[]
  businessActivities?: BusinessActivity[]
}) => {
  const progress = dashboardProgress({
    organizationProviders,
    profile,
    serviceProviderUsage,
    businessActivities,
  })
  const recommendationCounts = recommendations?.countsBySeverity ?? {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  }
  const recommendationTotal = severityOrder.reduce(
    (total, severity) => total + recommendationCounts[severity],
    0
  )
  const generatedDocuments = documents.filter((summary) => summary.document)
  const currentDocuments = documents.filter(
    (summary) => summary.status === "current"
  )
  const outdatedDocuments = documents.filter(
    (summary) => summary.status === "stale"
  )

  // Calculate completeness for activities
  const showLegalBasis = isComplianceFieldVisible(
    "businessActivity.legalBasis",
    profile.company.complianceGoals
  )
  const totalActivities = businessActivities.length
  const completedActivitiesCount = businessActivities.filter((activity) =>
    isActivityComplete(activity, showLegalBasis)
  ).length
  const isActivitiesComplete =
    totalActivities > 0 && completedActivitiesCount === totalActivities

  const activitiesStatusText =
    totalActivities === 0
      ? "No activities mapped"
      : isActivitiesComplete
        ? `${totalActivities} ${totalActivities === 1 ? "Activity" : "Activities"} completed`
        : `${totalActivities} ${totalActivities === 1 ? "Activity" : "Activities"} in progress`

  // Calculate completeness for data types
  const dataGroup = groupProgress(progress.data.dataTypes)
  const isDataComplete = isProgressComplete(dataGroup)
  const totalDataTypes = progress.data.dataTypes.length
  const dataTypesStatusText =
    totalDataTypes === 0
      ? "No data types mapped"
      : isDataComplete
        ? `${totalDataTypes} ${totalDataTypes === 1 ? "Data Type" : "Data Types"} completed`
        : `${totalDataTypes} ${totalDataTypes === 1 ? "Data Type" : "Data Types"} in progress`

  return (
    <div className="grid gap-8">
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="flex min-h-64 flex-col items-center justify-center gap-2 border border-slate-200 bg-white p-8 text-center">
          <span className="mb-2 text-xs font-bold tracking-wider text-slate-400 uppercase">
            Completed
          </span>
          <span className="mb-2 text-5xl font-extrabold text-slate-600">
            {progress.overall.percent}%
          </span>
          <div className="inline-flex items-center rounded-full bg-slate-50 px-4 py-1.5 text-xs font-semibold text-slate-700">
            {progress.overall.completedSections} of{" "}
            {progress.overall.totalSections} areas complete
          </div>
        </section>

        <section className="grid min-h-64 gap-5 border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="mb-2 text-xs font-bold tracking-wider text-slate-400 uppercase">
                  {recommendationsLoading
                    ? "Checking recommendations"
                    : recommendationTotal === 0
                      ? "No recommendations right now"
                      : `${recommendationTotal} ${recommendationTotal === 1 ? "recommendation" : "recommendations"}`}
                </h3>
              </div>
            </div>
            <Link
              className="text-sm font-medium text-slate-700 underline-offset-4 hover:text-slate-950 hover:underline focus-visible:ring-3 focus-visible:ring-slate-200 focus-visible:outline-none"
              to="/recommendations"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {severityOrder.map((severity) => (
              <div
                className={`rounded-sm border border-l-4 border-slate-200 px-4 py-3 ${severityBorderClass(severity)}`}
                key={severity}
              >
                <div className="text-xl font-semibold text-slate-950">
                  {recommendationsLoading
                    ? "..."
                    : recommendationCounts[severity]}
                </div>
                <div className="mt-1 text-xs font-medium text-slate-500">
                  {severityLabel(severity)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid min-h-64 gap-5 border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="mb-2 text-xs font-bold tracking-wider text-slate-400 uppercase">
                Documents
              </h3>
              <p className="text-sm text-slate-500">
                Generated policy freshness.
              </p>
            </div>
            <Link
              className="text-sm font-medium text-slate-700 underline-offset-4 hover:text-slate-950 hover:underline focus-visible:ring-3 focus-visible:ring-slate-200 focus-visible:outline-none"
              to="/documents"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-sm border border-l-4 border-slate-200 border-l-emerald-500 px-4 py-3">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-emerald-700" />
                <div className="text-xl font-semibold text-slate-950">
                  {documentsLoading ? "..." : currentDocuments.length}
                </div>
              </div>
              <div className="mt-1 text-xs font-medium text-slate-500">
                Policies up to date
              </div>
            </div>
            <div className="rounded-sm border border-l-4 border-slate-200 border-l-amber-500 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xl font-semibold text-slate-950">
                  {documentsLoading ? "..." : outdatedDocuments.length}
                </div>
                <DocumentReasonsTooltip outdatedDocuments={outdatedDocuments} />
              </div>
              <div className="mt-1 text-xs font-medium text-slate-500">
                Documents outdated
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            {documentsLoading
              ? "Checking document status..."
              : `${generatedDocuments.length} of ${documents.length} templates generated`}
          </p>
        </section>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <CategoryCard
          title="Profile"
          description="Company identity, operating context, and contacts."
          href="/company/profile"
          isComplete={isProgressComplete(progress.profile)}
          icon={Building2}
        />
        <CategoryCard
          title="Privacy"
          description="Rights handling, privacy preferences, and disclosures."
          href="/company/privacy"
          isComplete={isProgressComplete(progress.privacy)}
          icon={ShieldCheck}
        />
        <CategoryCard
          title="Infrastructure"
          description="Core systems, encryption, monitoring, and backups."
          href="/company/infrastructure"
          isComplete={isProgressComplete(progress.infrastructure)}
          icon={Server}
        />
        <CategoryCard
          title="Security"
          description="Development security, vulnerabilities, and incident response."
          href="/company/security"
          isComplete={isProgressComplete(progress.security)}
          icon={Shield}
        />
        <CategoryCard
          title="Access"
          description="Access hygiene, authentication, and training."
          href="/company/access"
          isComplete={isProgressComplete(progress.access)}
          icon={KeyRound}
        />
      </div>

      <section className="grid gap-4">
        <SectionHeading>{SIDEBAR_SECTION.productAndData}</SectionHeading>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <CategoryCard
            title="Activities"
            description="Processing activities mapping."
            href="/company/activities"
            isComplete={isActivitiesComplete}
            statusText={activitiesStatusText}
            icon={ClipboardList}
          />
          <CategoryCard
            title="Data Types"
            description="Data categories and protection rules."
            href="/company/data"
            isComplete={isDataComplete}
            statusText={dataTypesStatusText}
            icon={Database}
          />
        </div>
      </section>

      <section className="grid gap-4">
        <SectionHeading>Services</SectionHeading>

        {progress.services.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-slate-50 p-8 text-center rounded-lg">
            <h3 className="text-sm font-semibold text-slate-950">No services defined</h3>
            <p className="mt-1 text-sm text-slate-500">
              No services have been defined yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {progress.services.map((service) => {
              const rawService = profile.services.find((s) => s.id === service.id)
              if (!rawService) return null

              return (
                <DashboardServiceCard
                  key={service.id}
                  service={rawService}
                  serviceProviderUsage={serviceProviderUsage}
                />
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
