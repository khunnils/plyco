import {
  type ServiceProfileInput,
  type ServiceProviderUsage,
  type Vocabulary,
} from "@plyco/shared"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  ArrowRight,
  Box,
  Building2,
  Globe2,
  Layers3,
  MapPin,
  RadioTower,
  Plus,
} from "lucide-react"

import { useVocabulary } from "@/features/vocabulary/hooks/use-vocabulary"
import {
  useSaveSecurityProfile,
  useSecurityProfile,
} from "@/features/company/hooks/use-company"
import {
  useCreateServiceProviderUsage,
  useDeleteServiceProviderUsage,
  useUpdateServiceProviderUsage,
} from "@/features/vendors/hooks/use-vendors"
import {
  profileFromOrganization,
  dataTypeOptionsFromProfile,
} from "@/features/company/lib/profile"
import { ServiceProfilePage } from "./service-profile-page"
import { PageHeader } from "@/features/shell/components/page-header"
import {
  SIDEBAR_SECTION,
  sectionPageBreadcrumbs,
} from "@/features/shell/lib/navigation"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { codeLabel, type Option } from "@/features/vocabulary/lib/vocabulary"

const codeValueList = (
  vocabulary: Vocabulary | undefined,
  codeSetId: string,
  values: string[] | null
) =>
  values && values.length > 0
    ? values.map((value) => codeLabel(vocabulary, codeSetId, value)).join(", ")
    : "Not set"

const ServiceSelectorPage = ({
  businessActivityOptions,
  serviceProviderUsage,
  services,
  vocabulary,
}: {
  businessActivityOptions: Option[]
  serviceProviderUsage: ServiceProviderUsage[]
  services: ServiceProfileInput[]
  vocabulary: Vocabulary | undefined
}) => {
  const availableServices = services.filter((service) => service.id)

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-base font-semibold text-slate-950">Services</h2>
          <p className="mt-1 text-sm text-slate-500">
            Customer-facing products and apps, including audience, privacy
            settings, and provider usage.
          </p>
        </div>
        {availableServices.length > 0 ? (
          <Button asChild className="w-fit shrink-0" type="button">
            <Link to="/company/services/new">
              <Plus />
              Add service
            </Link>
          </Button>
        ) : null}
      </div>

      {availableServices.length === 0 ? (
        <Empty className="min-h-[420px] border-slate-200 bg-white">
          <EmptyHeader>
            <EmptyMedia
              className="size-12 rounded-full border-slate-200 bg-slate-50"
              variant="icon"
            >
              <Box />
            </EmptyMedia>
            <EmptyTitle>No services available</EmptyTitle>
            <EmptyDescription>
              Services will appear here once they have been added to this
              workspace.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild type="button">
              <Link to="/company/services/new">
                <Plus />
                Add service
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
        {availableServices.map((service, index) => {
          const serviceUses = service.id
            ? serviceProviderUsage.filter(
                (usage) => usage.serviceId === service.id
              )
            : []
          const activityLabels = service.businessActivityIds
            .map(
              (activityId) =>
                businessActivityOptions.find(
                  (option) => option.value === activityId
                )?.label ?? activityId
            )
            .join(", ")
          const url = service.serviceUrl?.trim()

          return (
            <Link
              className="group grid min-h-72 grid-rows-[auto_1fr_auto] overflow-hidden border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg focus-visible:ring-3 focus-visible:ring-slate-200 focus-visible:outline-none"
              key={service.id ?? `service-${index}`}
              to={
                service.id
                  ? `/company/services/${service.id}`
                  : "/company/services"
              }
            >
              <div className="h-1 bg-primary" />
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
                <div className="min-w-0">
                  <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-slate-100 text-slate-900">
                    <Box className="size-5" />
                  </div>
                  <h2 className="truncate text-lg font-semibold text-slate-950">
                    {service.serviceName?.trim() || `Service ${index + 1}`}
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

              <div className="grid gap-5 p-5">
                <p className="line-clamp-3 text-sm leading-6 text-slate-600">
                  {service.serviceDescription?.trim() ||
                    "No service description has been provided."}
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1 border-l-2 border-slate-200 pl-3">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <Layers3 className="size-3.5" />
                      Activities
                    </span>
                    <span className="line-clamp-2 text-sm font-medium text-slate-900">
                      {activityLabels || "Not set"}
                    </span>
                  </div>
                  <div className="grid gap-1 border-l-2 border-slate-200 pl-3">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <Building2 className="size-3.5" />
                      Audience
                    </span>
                    <span className="line-clamp-2 text-sm font-medium text-slate-900">
                      {codeValueList(
                        vocabulary,
                        "service_customer_types",
                        service.customerTypes
                      )}
                    </span>
                  </div>
                  <div className="grid gap-1 border-l-2 border-slate-200 pl-3">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <MapPin className="size-3.5" />
                      Regions
                    </span>
                    <span className="line-clamp-2 text-sm font-medium text-slate-900">
                      {codeValueList(
                        vocabulary,
                        "regions",
                        service.availabilityRegions
                      )}
                    </span>
                  </div>
                  <div className="grid gap-1 border-l-2 border-slate-200 pl-3">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <RadioTower className="size-3.5" />
                      Providers
                    </span>
                    <span className="text-sm font-medium text-slate-900">
                      {serviceUses.length === 1
                        ? "1 provider"
                        : `${serviceUses.length} providers`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs font-medium text-slate-500">
                <span>
                  Cookies and tracking:{" "}
                  {service.privacy.usesCookiesOrTrackingTechnologies === null
                    ? "Not answered"
                    : service.privacy.usesCookiesOrTrackingTechnologies
                      ? "Yes"
                      : "No"}
                </span>
                <span className="text-slate-900">View service</span>
              </div>
            </Link>
          )
        })}
        </div>
      )}
    </div>
  )
}

export const ServicesRoutePage = () => {
  const { serviceId } = useParams()
  const navigate = useNavigate()
  const securityProfile = useSecurityProfile()
  const vocabulary = useVocabulary()
  const saveProfile = useSaveSecurityProfile()
  const createServiceProviderUsage = useCreateServiceProviderUsage()
  const deleteServiceProviderUsage = useDeleteServiceProviderUsage()
  const updateServiceProviderUsage = useUpdateServiceProviderUsage()

  const snapshot = securityProfile.data
  const defaultValues = profileFromOrganization(snapshot?.organization ?? null)
  const organizationProviders = snapshot?.organizationProviders ?? []
  const serviceProviderUsage = snapshot?.serviceProviderUsage ?? []
  const businessActivities = snapshot?.businessActivities ?? []
  const vocabularyData = vocabulary.data

  const isCreatingService = serviceId === "new"
  const routedSelectedServiceId =
    serviceId && serviceId !== "new" ? serviceId : null

  const headerService =
    defaultValues.services.find(
      (service) => service.id === routedSelectedServiceId
    ) ?? defaultValues.services[0]

  const activeCompanyTitle = isCreatingService
    ? "Add service"
    : !serviceId
      ? "Services"
      : headerService?.serviceName?.trim() || "Service"
  const breadcrumbs = serviceId
    ? sectionPageBreadcrumbs(SIDEBAR_SECTION.productAndData, [
        { label: "Services", href: "/company/services" },
        { label: activeCompanyTitle },
      ])
    : sectionPageBreadcrumbs(SIDEBAR_SECTION.productAndData, [
        { label: "Services" },
      ])

  const isVendorMutationPending =
    createServiceProviderUsage.isPending ||
    deleteServiceProviderUsage.isPending ||
    updateServiceProviderUsage.isPending

  const dataTypeOptions = dataTypeOptionsFromProfile(
    defaultValues.dataHandling.dataTypesStored
  )

  const businessActivityOptions = businessActivities.map((activity) => ({
    value: activity.id,
    label: activity.name,
  }))

  return (
    <>
      <PageHeader
        breadcrumbs={breadcrumbs}
        eyebrow={SIDEBAR_SECTION.productAndData}
        title={activeCompanyTitle}
      />

      {!serviceId ? (
        <ServiceSelectorPage
          businessActivityOptions={businessActivityOptions}
          serviceProviderUsage={serviceProviderUsage}
          services={defaultValues.services}
          vocabulary={vocabularyData}
        />
      ) : (
        <ServiceProfilePage
          businessActivities={businessActivities}
          businessActivityOptions={businessActivityOptions}
          dataTypeOptions={dataTypeOptions}
          isCreatingService={isCreatingService}
          isProfileMutationPending={saveProfile.isPending}
          isVendorMutationPending={isVendorMutationPending}
          profile={defaultValues}
          selectedServiceId={routedSelectedServiceId}
          serviceProviderUsage={serviceProviderUsage}
          organizationProviders={organizationProviders}
          vocabulary={vocabularyData}
          onCancelCreateService={() =>
            navigate(
              routedSelectedServiceId
                ? `/company/services/${routedSelectedServiceId}`
                : "/company/services"
            )
          }
          onCreateProviderUsage={(providerUsage, onSuccess) =>
            createServiceProviderUsage.mutate(providerUsage, {
              onSuccess,
            })
          }
          onDeleteProviderUsage={(providerUsage) =>
            deleteServiceProviderUsage.mutate(providerUsage.id)
          }
          onSaveProfile={(profile, onSuccess) =>
            saveProfile.mutate(profile, { onSuccess })
          }
          onSelectService={(serviceId) => {
            navigate(
              serviceId ? `/company/services/${serviceId}` : "/company/services"
            )
          }}
          onUpdateProviderUsage={(input, onSuccess) =>
            updateServiceProviderUsage.mutate(input, { onSuccess })
          }
        />
      )}
    </>
  )
}
