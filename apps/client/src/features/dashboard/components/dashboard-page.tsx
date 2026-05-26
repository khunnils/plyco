import {
  type OrganizationProvider,
  type ServiceProviderUsage,
} from "@plyco/shared"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { type ProfileDraft } from "@/features/company/types/company"
import { ProgressBar } from "@/features/dashboard/components/progress-bar"
import {
  PlaceholderPanel,
  ProgressItemPanel,
  ProgressPanel,
} from "@/features/dashboard/components/panels/progress-panel"
import { ProgressRow } from "@/features/dashboard/components/progress-row"
import { MetricItem } from "@/features/dashboard/components/metric-item"
import {
  dashboardProgress,
  groupProgress,
} from "@/features/dashboard/lib/progress"
import { useTemplates } from "@/features/templates/hooks/use-templates"

export const DashboardPage = ({
  organizationProviders,
  profile,
  serviceProviderUsage,
}: {
  organizationProviders: OrganizationProvider[]
  profile: ProfileDraft
  serviceProviderUsage: ServiceProviderUsage[]
}) => {
  const progress = dashboardProgress({
    organizationProviders,
    profile,
    serviceProviderUsage,
  })
  const dataGroup = groupProgress([
    progress.data.general,
    ...progress.data.dataTypes,
  ])
  const templates = useTemplates()
  const templatesData = templates.data ?? {
    systemTemplates: [],
    organizationTemplates: [],
  }

  const completedVendors = progress.vendors.filter(
    (v) => v.totalFields > 0 && v.completedFields === v.totalFields
  ).length

  return (
    <div className="grid gap-6">
      <div className="grid gap-5 md:grid-cols-3 mb-4">
        {/* Panel 1: Readiness Progress */}
        <MetricItem
          value={`${progress.overall.percent}%`}
          label="Readiness completion"
          description={`${progress.overall.completedSections}/${progress.overall.totalSections} areas complete`}
        />

        {/* Panel 2: Vendors Defined */}
        <MetricItem
          value={organizationProviders.length}
          label="Vendors defined"
          description={`${completedVendors}/${organizationProviders.length} fully documented vendors`}
        />

        {/* Panel 3: Templates (simple counts) */}
        <MetricItem
          value={templatesData.organizationTemplates.length}
          label="Templates"
          description={`${templatesData.systemTemplates.length} system templates available`}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ProgressPanel
          description="Company identity, operating context, contacts, and high-level data posture."
          group={progress.profile}
          href="/company/profile"
          title="Profile"
        />
        <ProgressPanel
          description="Rights handling, privacy preferences, transfers, disclosures, and representation."
          group={progress.privacy}
          href="/company/privacy"
          title="Privacy"
        />
        <ProgressPanel
          description="Core systems, encryption, monitoring, incident response, backups, and vendor risk."
          group={progress.infrastructure}
          href="/company/infrastructure"
          title="Infrastructure"
        />
        <ProgressPanel
          description="Access controls, authentication requirements, and account lifecycle hygiene."
          group={progress.access}
          href="/company/access"
          title="Access"
        />
      </div>

      <section className="border border-slate-200 bg-white p-5">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Services</h2>
            <p className="mt-1 text-sm text-slate-500">
              Per-service progress across general details, audience, privacy,
              and provider usage.
            </p>
          </div>
          <Button asChild className="w-fit" type="button" variant="outline">
            <Link to="/company/services/new">Add service</Link>
          </Button>
        </div>
        {progress.services.length === 0 ? (
          <PlaceholderPanel
            actionLabel="Add service"
            description="Add a service before tracking service-specific readiness."
            href="/company/services/new"
            title="No services defined"
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {progress.services.map((service) => (
              <ProgressItemPanel key={service.id} item={service} />
            ))}
          </div>
        )}
      </section>

      <section className="border border-slate-200 bg-white p-5">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Data</h2>
            <p className="mt-1 text-sm text-slate-500">
              Organization-level data handling and completeness of each stored
              data type.
            </p>
          </div>
          <Button asChild className="w-fit" type="button" variant="outline">
            <Link to="/company/data">Open data</Link>
          </Button>
        </div>
        <div className="mb-4 grid gap-2">
          <div className="flex items-end justify-between gap-3">
            <p className="text-2xl font-semibold text-slate-950">
              {dataGroup.percent}%
            </p>
            <p className="text-sm text-slate-500">
              {dataGroup.completedSections}/{dataGroup.totalSections} sections
            </p>
          </div>
          <ProgressBar percent={dataGroup.percent} />
        </div>
        <div className="grid gap-3">
          <ProgressRow section={progress.data.general} />
          {progress.data.dataTypes.length === 0 ? (
            <PlaceholderPanel
              actionLabel="Add data type"
              description="Define the data categories your organization stores."
              href="/company/data"
              title="No data types defined"
            />
          ) : (
            progress.data.dataTypes.map((dataType) => (
              <ProgressRow key={dataType.title} section={dataType} />
            ))
          )}
        </div>
      </section>

      <section className="border border-slate-200 bg-white p-5">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Vendors</h2>
            <p className="mt-1 text-sm text-slate-500">
              Inventory completeness and service-specific processing details for
              each provider.
            </p>
          </div>
          <Button asChild className="w-fit" type="button" variant="outline">
            <Link to="/vendors">Open vendors</Link>
          </Button>
        </div>
        {progress.vendors.length === 0 ? (
          <PlaceholderPanel
            actionLabel="Add provider"
            description="Add providers before tracking vendor readiness."
            href="/vendors"
            title="No vendors defined"
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {progress.vendors.map((vendor) => (
              <ProgressItemPanel key={vendor.id} item={vendor} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
