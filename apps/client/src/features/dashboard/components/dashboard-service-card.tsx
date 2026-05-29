import { type ServiceProfileInput, type ServiceProviderUsage } from "@plyco/shared"
import { Link } from "react-router-dom"
import { ArrowRight, Box, CheckCircle2, Globe2 } from "lucide-react"

import {
  providerUsageProgress,
  serviceDetailsProgress,
} from "@/features/dashboard/lib/progress"

interface DashboardServiceCardProps {
  service: ServiceProfileInput
  serviceProviderUsage: ServiceProviderUsage[]
}

export const DashboardServiceCard = ({
  service,
  serviceProviderUsage,
}: DashboardServiceCardProps) => {
  const detailsProgress = serviceDetailsProgress(service)
  const activitiesCount = service.businessActivityIds?.length ?? 0

  const selectedServiceUses = service.id
    ? serviceProviderUsage.filter((usage) => usage.serviceId === service.id)
    : []
  const totalProviders = selectedServiceUses.length
  const completedProviders = selectedServiceUses.filter((usage) => {
    const usageProgress = providerUsageProgress(usage)
    return usageProgress.completedFields === usageProgress.totalFields
  }).length

  const url = service.serviceUrl?.trim()

  return (
    <Link
      to={`/company/services/${service.id}`}
      className="group flex flex-col justify-between overflow-hidden border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xs focus-visible:ring-3 focus-visible:ring-slate-200 focus-visible:outline-none"
    >
      <div className="h-1 bg-primary"></div>
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
        <div className="min-w-0">
          <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-slate-50 text-slate-600 transition group-hover:bg-slate-100">
            <Box className="size-5" />
          </div>
          <h2 className="truncate text-lg font-semibold text-slate-950 group-hover:text-slate-700 transition-colors">
            {service.serviceName?.trim() || "Unnamed service"}
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
          {service.serviceDescription?.trim() ||
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
          {service.privacy.usesCookiesOrTrackingTechnologies === null
            ? "Not answered"
            : service.privacy.usesCookiesOrTrackingTechnologies
              ? "Yes"
              : "No"}
        </span>
        <span className="text-slate-900 group-hover:text-blue-600 transition flex items-center gap-1">
          View service <ArrowRight className="size-3.5" />
        </span>
      </div>
    </Link>
  )
}
