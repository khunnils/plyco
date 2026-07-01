import {
  type ServiceProfileInput,
  type ServiceProviderUsage,
  type Vocabulary,
} from "@plyco/shared"
import { usePostHog } from "@posthog/react"
import { useId, useState } from "react"
import { createPortal } from "react-dom"
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
  Trash2,
} from "lucide-react"
import { SortableList } from "@/components/sortable-list"

import { POSTHOG_EVENTS } from "@/lib/posthog-events"
import { useVocabulary } from "@/features/vocabulary/hooks/use-vocabulary"
import {
  useSaveSecurityProfile,
  useSecurityProfile,
  useReorderServices,
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
import { EditPanelGrid } from "@/features/company/components/profile-panel-shell"

const codeValueList = (
  vocabulary: Vocabulary | undefined,
  codeSetId: string,
  values: string[] | null
) =>
  values && values.length > 0
    ? values.map((value) => codeLabel(vocabulary, codeSetId, value)).join(", ")
    : "Not set"

const DeleteServiceDialog = ({
  isOpen,
  isMutationPending,
  providerUsageCount,
  serviceName,
  onClose,
  onConfirm,
}: {
  isOpen: boolean
  isMutationPending: boolean
  providerUsageCount: number
  serviceName: string
  onClose: () => void
  onConfirm: () => void
}) => {
  const titleId = useId()
  const descriptionId = useId()

  if (!isOpen) {
    return null
  }

  return createPortal(
    <div
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4"
      role="dialog"
    >
      <div className="w-full max-w-md border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-red-50 text-red-700">
            <Trash2 className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-950" id={titleId}>
              Delete service?
            </h2>
            <p
              className="mt-2 text-sm leading-6 text-slate-600"
              id={descriptionId}
            >
              This will permanently delete{" "}
              <span className="font-medium text-slate-950">{serviceName}</span>,
              including service details, assigned activities, and{" "}
              {providerUsageCount === 1
                ? "1 linked provider usage record"
                : `${providerUsageCount} linked provider usage records`}
              . Providers and activity inventory items will not be deleted.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            disabled={isMutationPending}
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            disabled={isMutationPending}
            type="button"
            variant="destructive"
            onClick={onConfirm}
          >
            Delete service
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

const ServiceSelectorPage = ({
  businessActivityOptions,
  deleteDisabled,
  serviceProviderUsage,
  services,
  vocabulary,
  onDeleteService,
  onReorder,
  reorderDisabled,
}: {
  businessActivityOptions: Option[]
  deleteDisabled: boolean
  serviceProviderUsage: ServiceProviderUsage[]
  services: ServiceProfileInput[]
  vocabulary: Vocabulary | undefined
  onDeleteService: (
    service: ServiceProfileInput,
    providerUsageCount: number,
    onSuccess?: () => void
  ) => void
  onReorder: (ids: string[]) => void
  reorderDisabled: boolean
}) => {
  const availableServices = services.filter((service) => service.id)
  const [servicePendingDelete, setServicePendingDelete] =
    useState<ServiceProfileInput | null>(null)
  const pendingDeleteUsageCount = servicePendingDelete?.id
    ? serviceProviderUsage.filter(
        (usage) => usage.serviceId === servicePendingDelete.id
      ).length
    : 0

  return (
    <div className="grid gap-5">
      <DeleteServiceDialog
        isOpen={Boolean(servicePendingDelete)}
        isMutationPending={deleteDisabled}
        providerUsageCount={pendingDeleteUsageCount}
        serviceName={
          servicePendingDelete?.serviceName?.trim() || "this service"
        }
        onClose={() => setServicePendingDelete(null)}
        onConfirm={() => {
          if (!servicePendingDelete) {
            return
          }

          onDeleteService(servicePendingDelete, pendingDeleteUsageCount, () =>
            setServicePendingDelete(null)
          )
        }}
      />

      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
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
          <SortableList
            disabled={reorderDisabled}
            ids={availableServices.flatMap((service) =>
              service.id ? [service.id] : []
            )}
            layout="grid"
            onReorder={onReorder}
          >
            {(serviceId, dragHandle) => {
              const index = availableServices.findIndex(
                (service) => service.id === serviceId
              )
              const service = availableServices[index]
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
                <div className="relative h-full">
                  <Button
                    aria-label={`Delete ${
                      service.serviceName?.trim() || `service ${index + 1}`
                    }`}
                    className="absolute top-4 right-4 z-20 bg-white/95"
                    disabled={deleteDisabled}
                    size="icon-sm"
                    type="button"
                    variant="outline"
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      setServicePendingDelete(service)
                    }}
                  >
                    <Trash2 />
                  </Button>
                  <div className="absolute top-4 right-14 z-20">
                    {dragHandle}
                  </div>
                  <Link
                    className="group grid h-full min-h-72 grid-rows-[auto_1fr_auto] overflow-hidden border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg focus-visible:ring-3 focus-visible:ring-slate-200 focus-visible:outline-none"
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
                          {service.serviceName?.trim() ||
                            `Service ${index + 1}`}
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

                      <EditPanelGrid>
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
                      </EditPanelGrid>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs font-medium text-slate-500">
                      <span>
                        Cookies and tracking:{" "}
                        {service.privacy.usesCookiesOrTrackingTechnologies ===
                        null
                          ? "Not answered"
                          : service.privacy.usesCookiesOrTrackingTechnologies
                            ? "Yes"
                            : "No"}
                      </span>
                      <span className="text-slate-900">View service</span>
                    </div>
                  </Link>
                </div>
              )
            }}
          </SortableList>
        </div>
      )}
    </div>
  )
}

export const ServicesRoutePage = () => {
  const posthog = usePostHog()
  const { serviceId } = useParams()
  const navigate = useNavigate()
  const securityProfile = useSecurityProfile()
  const vocabulary = useVocabulary()
  const saveProfile = useSaveSecurityProfile()
  const reorderServices = useReorderServices()
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
          deleteDisabled={saveProfile.isPending}
          serviceProviderUsage={serviceProviderUsage}
          services={defaultValues.services}
          vocabulary={vocabularyData}
          onDeleteService={(service, providerUsageCount, onSuccess) => {
            if (!service.id) {
              return
            }

            saveProfile.mutate(
              {
                ...defaultValues,
                services: defaultValues.services.filter(
                  (currentService) => currentService.id !== service.id
                ),
              },
              {
                onSuccess: () => {
                  posthog.capture(POSTHOG_EVENTS.SERVICE_DELETED, {
                    service_id: service.id,
                    business_activity_count:
                      service.businessActivityIds?.length ?? 0,
                    provider_usage_count: providerUsageCount,
                  })
                  onSuccess?.()
                },
              }
            )
          }}
          onReorder={(ids) =>
            reorderServices.mutate(ids, {
              onSuccess: () =>
                posthog.capture(POSTHOG_EVENTS.SERVICE_REORDERED, {
                  count: ids.length,
                }),
            })
          }
          reorderDisabled={reorderServices.isPending}
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
              onSuccess: (createdProviderUsage) => {
                posthog.capture(POSTHOG_EVENTS.SERVICE_PROVIDER_USAGE_CREATED, {
                  service_id: createdProviderUsage.serviceId,
                  provider_id: createdProviderUsage.organizationProviderId,
                  system_type: createdProviderUsage.systemType,
                  data_type_count: createdProviderUsage.dataProcessed.length,
                })
                onSuccess?.()
              },
            })
          }
          onDeleteProviderUsage={(providerUsage) =>
            deleteServiceProviderUsage.mutate(providerUsage.id, {
              onSuccess: () =>
                posthog.capture(POSTHOG_EVENTS.SERVICE_PROVIDER_USAGE_DELETED, {
                  service_provider_usage_id: providerUsage.id,
                  service_id: providerUsage.serviceId,
                  provider_id: providerUsage.organizationProviderId,
                  system_type: providerUsage.systemType,
                }),
            })
          }
          onSaveProfile={(profile, onSuccess) =>
            saveProfile.mutate(profile, { onSuccess })
          }
          onServiceCreated={(service) =>
            posthog.capture(POSTHOG_EVENTS.SERVICE_CREATED, {
              service_id: service.id,
              business_activity_count: service.businessActivityIds?.length ?? 0,
            })
          }
          onServiceUpdated={(service, changedFields) =>
            posthog.capture(POSTHOG_EVENTS.SERVICE_UPDATED, {
              service_id: service.id,
              changed_fields: changedFields,
              changed_field_count: changedFields.length,
            })
          }
          onSelectService={(serviceId) => {
            navigate(
              serviceId ? `/company/services/${serviceId}` : "/company/services"
            )
          }}
          onUpdateProviderUsage={(input, onSuccess) =>
            updateServiceProviderUsage.mutate(input, {
              onSuccess: (providerUsage) => {
                posthog.capture(POSTHOG_EVENTS.SERVICE_PROVIDER_USAGE_UPDATED, {
                  service_provider_usage_id: providerUsage.id,
                  service_id: providerUsage.serviceId,
                  provider_id: providerUsage.organizationProviderId,
                  system_type: providerUsage.systemType,
                  data_type_count: providerUsage.dataProcessed.length,
                })
                onSuccess?.()
              },
            })
          }
        />
      )}
    </>
  )
}
