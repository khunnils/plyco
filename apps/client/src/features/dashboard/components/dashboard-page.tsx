import {
  type OrganizationProvider,
  type ServiceProviderUsage,
  type BusinessActivity,
  isComplianceFieldVisible,
} from "@plyco/shared"
import { Link } from "react-router-dom"
import {
  Building2,
  ShieldCheck,
  Server,
  KeyRound,
  ClipboardList,
  Database,
  CheckCircle2,
  ArrowRight,
  Globe2,
  Box,
} from "lucide-react"

import { type ProfileDraft } from "@/features/company/types/company"
import {
  dashboardProgress,
  groupProgress,
  isProgressComplete,
  isActivityComplete,
  serviceDetailsProgress,
  providerUsageProgress,
} from "@/features/dashboard/lib/progress"

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
            <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-600 shrink-0">
              <div className="h-2 w-2 rounded-full bg-slate-600"></div>
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

export const DashboardPage = ({
  organizationProviders,
  profile,
  serviceProviderUsage,
  businessActivities = [],
}: {
  organizationProviders: OrganizationProvider[]
  profile: ProfileDraft
  serviceProviderUsage: ServiceProviderUsage[]
  businessActivities?: BusinessActivity[]
}) => {
  const progress = dashboardProgress({
    organizationProviders,
    profile,
    serviceProviderUsage,
  })

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
      {/* Centered Total Progress Card */}
      <div className="border border-slate-200 bg-white p-8 flex flex-col items-center justify-center text-center max-w-xl mx-auto w-full">
      <div className="h-4 bg-primary"></div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          Total Progress
        </span>
        <span className="text-6xl font-extrabold text-slate-600 mb-2">
          {progress.overall.percent}%
        </span>
        <span className="text-sm font-medium text-slate-500 mb-4">
          Readiness completion
        </span>
        <div className="inline-flex items-center rounded-full bg-slate-50 px-4 py-1.5 text-xs font-semibold text-slate-700">
          {progress.overall.completedSections} of {progress.overall.totalSections} areas complete
        </div>
      </div>

      {/* Grid of Category Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
          title="Access"
          description="Access hygiene, authentication, and training."
          href="/company/access"
          isComplete={isProgressComplete(progress.access)}
          icon={KeyRound}
        />
        <CategoryCard
          title="Activities"
          description="Processing activities mapping."
          href="/company/activities"
          isComplete={isActivitiesComplete}
          statusText={activitiesStatusText}
          icon={ClipboardList}
          className="lg:col-span-2"
        />
        <CategoryCard
          title="Data Types"
          description="Data categories and protection rules."
          href="/company/data"
          isComplete={isDataComplete}
          statusText={dataTypesStatusText}
          icon={Database}
          className="lg:col-span-2"
        />
      </div>

      {/* Services Section */}
      <section className=" border-slate-200 bg-white">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Services</h2>
            <p className="mt-1 text-sm text-slate-500">
              Per-service progress across general details, activities, and providers usage.
            </p>
          </div>
        </div>

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

              const detailsProgress = serviceDetailsProgress(rawService)
              const activitiesCount = rawService.businessActivityIds?.length ?? 0

              const selectedServiceUses = service.id
                ? serviceProviderUsage.filter((usage) => usage.serviceId === service.id)
                : []
              const totalProviders = selectedServiceUses.length
              const completedProviders = selectedServiceUses.filter((usage) => {
                const usageProgress = providerUsageProgress(usage)
                return usageProgress.completedFields === usageProgress.totalFields
              }).length

              const url = rawService.serviceUrl?.trim()

              return (
                <Link
                  key={service.id}
                  to={`/company/services/${service.id}`}
                  className="group flex flex-col justify-between overflow-hidden border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xsfocus-visible:ring-3 focus-visible:ring-slate-200 focus-visible:outline-none"
                >
                  <div className="h-1 bg-primary"></div>
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
                    <div className="min-w-0">
                      <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-slate-50 text-slate-600 transition group-hover:bg-slate-100">
                        <Box className="size-5" />
                      </div>
                      <h2 className="truncate text-lg font-semibold text-slate-950 group-hover:text-slate-700 transition-colors">
                        {rawService.serviceName?.trim() || "Unnamed service"}
                      </h2>
                      {url ? (
                        <p className="mt-1 flex min-w-0 items-center gap-1.5 truncate text-sm text-slate-500">
                          <Globe2 className="size-3.5 shrink-0" />
                          <span className="truncate">{url}</span>
                        </p>
                      ) : null}
                    </div>
                    <ArrowRight className="mt-1 size-5 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-900" />
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between gap-5">
                    <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">
                      {rawService.serviceDescription?.trim() ||
                        "No service description has been provided."}
                    </p>

                    <div className="grid gap-4 grid-cols-3">
                      <div className="grid gap-1 border-l-2 border-slate-200 pl-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Details
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          {detailsProgress.isComplete ? (
                            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 fill-emerald-50 shrink-0" />
                              Complete
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                              <div className="h-1.5 w-1.5 rounded-full bg-blue-600"></div>
                              {detailsProgress.percent}%
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-1 border-l-2 border-slate-200 pl-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Activities
                        </span>
                        <span className="text-xs font-semibold text-slate-900 mt-0.5">
                          {activitiesCount} mapped
                        </span>
                      </div>

                      <div className="grid gap-1 border-l-2 border-slate-200 pl-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Providers
                        </span>
                        <span className="text-xs font-semibold text-slate-900 mt-0.5">
                          {totalProviders} ({completedProviders} compl.)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs font-medium text-slate-500">
                    <span>
                      Cookies:{" "}
                      {rawService.privacy.usesCookiesOrTrackingTechnologies === null
                        ? "Not answered"
                        : rawService.privacy.usesCookiesOrTrackingTechnologies
                          ? "Yes"
                          : "No"}
                    </span>
                    <span className="text-slate-900 group-hover:text-blue-600 transition flex items-center gap-1">
                      View service <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
