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
import {
  ReadinessBadge,
  type ReadinessStatus,
  WorkspaceSetupSummary,
} from "@/features/dashboard/components/readiness-scores"
import { SIDEBAR_SECTION } from "@/features/shell/lib/navigation"
import {
  dashboardProgress,
  completionText,
  groupProgress,
  isProductAndDataComplete,
  isProgressComplete,
  isActivityComplete,
} from "@/features/dashboard/lib/progress"
import {
  severityBorderClass,
  severityLabel,
  severityOrder,
} from "@/features/recommendations/lib/recommendations"
import { readinessStatusWhenComplete } from "@/features/recommendations/lib/readiness-scores"

interface CategoryCardProps {
  title: string
  description: string
  href: string
  isComplete: boolean
  statusText?: string
  progressText?: string
  readinessStatus?: ReadinessStatus | null
  icon: React.ComponentType<{ className?: string }>
  className?: string
}

const CategoryCard = ({
  title,
  description,
  href,
  isComplete,
  statusText,
  progressText,
  readinessStatus,
  icon: Icon,
  className = "",
}: CategoryCardProps) => {
  return (
    <Link
      to={href}
      className={`group relative flex flex-col justify-between border border-slate-200 bg-white p-4 hover:border-slate-300 focus-visible:ring-3 focus-visible:ring-slate-200 focus-visible:outline-none ${className}`}
    >
      <div>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex size-10 items-center justify-center rounded-md bg-blue-50 text-slate-600">
            <Icon className="h-5 w-5" />
          </div>
          {isComplete ? (
            <CheckCircle2 className="h-6 w-6 shrink-0 fill-emerald-50 text-emerald-600" />
          ) : (
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-slate-600">
              <div className="h-2 w-2 rounded-full bg-slate-600"></div>
            </div>
          )}
        </div>
        <h3 className="text-base font-semibold text-slate-950 transition-colors group-hover:text-slate-700">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-normal text-slate-500">
          {statusText || description}
        </p>
        {progressText ? (
          <p className="mt-3 text-xs font-medium text-slate-600">
            {progressText}
          </p>
        ) : null}
      </div>
      {readinessStatus ? (
        <div className="mt-4">
          <ReadinessBadge status={readinessStatus} />
        </div>
      ) : null}
    </Link>
  )
}

const SectionHeading = ({
  children,
  readinessStatus,
}: {
  children: string
  readinessStatus?: ReadinessStatus | null
}) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
      {children}
    </span>
    {readinessStatus ? <ReadinessBadge status={readinessStatus} /> : null}
  </div>
)

const PolicyReasonsTooltip = ({
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
        aria-label="Outdated policy details"
        className="relative flex size-5 items-center justify-center rounded-full focus-visible:ring-3 focus-visible:ring-amber-100 focus-visible:outline-none"
        type="button"
      >
        <span className="absolute inline-flex size-4 animate-ping rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex size-3 rounded-full bg-amber-500" />
      </button>
      <span
        className="pointer-events-none absolute top-7 right-0 z-20 hidden w-80 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-xs leading-5 font-normal text-slate-600 shadow-lg group-focus-within:block group-hover:block"
        role="tooltip"
      >
        {outdatedDocuments.slice(0, 4).map((summary) => (
          <span className="block py-1" key={summary.template.id}>
            <strong className="block font-semibold text-slate-900">
              {summary.template.name}
            </strong>
            {(summary.staleReasons.length
              ? summary.staleReasons
              : ["Regenerate to refresh this policy."]
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
  const currentDocuments = documents.filter(
    (summary) => summary.status === "current"
  )
  const outdatedDocuments = documents.filter(
    (summary) => summary.status === "stale"
  )
  const privacyReadiness = readinessStatusWhenComplete(
    isProgressComplete(progress.privacy),
    recommendations?.scores.byArea.privacy
  )
  const infrastructureReadiness = readinessStatusWhenComplete(
    isProgressComplete(progress.infrastructure),
    recommendations?.scores.byArea.infrastructure
  )
  const securityReadiness = readinessStatusWhenComplete(
    isProgressComplete(progress.security),
    recommendations?.scores.byArea.security
  )
  const accessReadiness = readinessStatusWhenComplete(
    isProgressComplete(progress.access),
    recommendations?.scores.byArea.access
  )
  const productAndDataReadiness = readinessStatusWhenComplete(
    isProductAndDataComplete(progress),
    recommendations?.scores.byArea.productAndData
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
        <WorkspaceSetupSummary progress={progress.overall} />

        <section className="grid min-h-64 gap-5 border border-slate-200 bg-white p-6">
          <Link
            className="mb-2 inline-flex text-xs font-bold tracking-wider text-slate-400 uppercase hover:text-slate-600 focus-visible:ring-3 focus-visible:ring-slate-200 focus-visible:outline-none"
            to="/recommendations"
          >
            Recommendations
          </Link>
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
          <Link
            className="mb-2 inline-flex text-xs font-bold tracking-wider text-slate-400 uppercase hover:text-slate-600 focus-visible:ring-3 focus-visible:ring-slate-200 focus-visible:outline-none"
            to="/documents"
          >
            Policies
          </Link>
          <div className="grid grid-cols-1 gap-3">
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
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-amber-700" />
                  <div className="text-xl font-semibold text-slate-950">
                    {documentsLoading ? "..." : outdatedDocuments.length}
                  </div>
                </div>
                <PolicyReasonsTooltip outdatedDocuments={outdatedDocuments} />
              </div>
              <div className="mt-1 text-xs font-medium text-slate-500">
                Policies outdated
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CategoryCard
          title="Profile"
          description="Company identity, operating context, and contacts."
          href="/company/profile"
          isComplete={isProgressComplete(progress.profile)}
          progressText={completionText(progress.profile)}
          icon={Building2}
        />
        <CategoryCard
          title="Privacy"
          description="Rights handling, privacy preferences, and disclosures."
          href="/company/privacy"
          isComplete={isProgressComplete(progress.privacy)}
          progressText={completionText(progress.privacy)}
          readinessStatus={privacyReadiness}
          icon={ShieldCheck}
        />
        <CategoryCard
          title="Infrastructure"
          description="Core systems, encryption, monitoring, and backups."
          href="/company/infrastructure"
          isComplete={isProgressComplete(progress.infrastructure)}
          progressText={completionText(progress.infrastructure)}
          readinessStatus={infrastructureReadiness}
          icon={Server}
        />
        <CategoryCard
          title="Security"
          description="Development security, vulnerabilities, and incident response."
          href="/company/security"
          isComplete={isProgressComplete(progress.security)}
          progressText={completionText(progress.security)}
          readinessStatus={securityReadiness}
          icon={Shield}
        />
        <CategoryCard
          title="Access"
          description="Access hygiene, authentication, and training."
          href="/company/access"
          isComplete={isProgressComplete(progress.access)}
          progressText={completionText(progress.access)}
          readinessStatus={accessReadiness}
          icon={KeyRound}
        />
      </div>

      <section className="grid gap-4">
        <SectionHeading readinessStatus={productAndDataReadiness}>
          {SIDEBAR_SECTION.productAndData}
        </SectionHeading>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <h3 className="text-sm font-semibold text-slate-950">
              No services defined
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              No services have been defined yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {progress.services.map((service) => {
              const rawService = profile.services.find(
                (s) => s.id === service.id
              )
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
