import {
  type OrganizationProvider,
  type ServiceProfileInput,
  type ServiceProviderUsage,
  type ServiceProviderUsageInput,
  type Vocabulary,
} from "@plyco/shared"
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  ProfilePanelDetailGrid,
  type ProfilePanelDetailRow,
} from "@/features/company/components/profile-panel-shell"
import {
  emptyServiceProviderUsageDraft,
  toServiceProviderUsageInput,
} from "@/features/company/lib/profile"
import { serviceProviderPurpose } from "@/features/company/services/lib/service-drafts"
import { codeValueList } from "@/features/company/services/lib/service-display"
import { ServiceProviderUsageForm } from "@/features/vendors/components/service-vendor-use-form"
import { serviceProviderUsageHelperText } from "@/features/vendors/components/service-provider-usage-helper-text"
import { codeLabel, type Option } from "@/features/vocabulary/lib/vocabulary"
import { AddVendorsForm } from "../add-vendors-form"

const needsAttention = (providerUsage: ServiceProviderUsage) => {
  const level = providerUsage.dataProcessingLevel
  if (level === "not_set") {
    return true
  }
  if (level !== "none") {
    return (
      !providerUsage.dataProcessed ||
      providerUsage.dataProcessed.length === 0 ||
      !providerUsage.dataRegions ||
      providerUsage.dataRegions.length === 0 ||
      !providerUsage.dpaStatus
    )
  }
  return false
}

export const ServiceProviderUsagePanel = ({
  dataProcessingLevelOptions,
  dataRegionOptions,
  dataTypeOptions,
  dpaStatusOptions,
  isMutationPending,
  service,
  serviceProviderUsage,
  organizationProviders,
  vocabulary,
  onCreate,
  onDelete,
  onUpdate,
}: {
  dataProcessingLevelOptions: Option[]
  dataRegionOptions: Option[]
  dataTypeOptions: Array<{ value: string; label: string }>
  dpaStatusOptions: Option[]
  isMutationPending: boolean
  service: ServiceProfileInput
  serviceProviderUsage: ServiceProviderUsage[]
  organizationProviders: OrganizationProvider[]
  vocabulary: Vocabulary | undefined
  onCreate: (
    providerUsage: ServiceProviderUsageInput,
    onSuccess?: () => void
  ) => void
  onDelete: (providerUsage: ServiceProviderUsage) => void
  onUpdate: (
    input: { id: string; providerUsage: ServiceProviderUsageInput },
    onSuccess?: () => void
  ) => void
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddProviders, setShowAddProviders] = useState(false)
  const [checkedProviderIds, setCheckedProviderIds] = useState<string[]>([])
  const selectedServiceUses = service.id
    ? serviceProviderUsage.filter(
        (providerUsage) => providerUsage.serviceId === service.id
      )
    : []
  const selectedProviderIds = new Set(
    selectedServiceUses.map(
      (providerUsage) => providerUsage.organizationProviderId
    )
  )
  const editingProviderUsage = selectedServiceUses.find(
    (providerUsage) => providerUsage.id === editingId
  )
  const providerOptions = organizationProviders.map((provider) => ({
    value: provider.id,
    label: provider.name,
  }))
  const serviceOptions = service.id
    ? [{ value: service.id, label: service.serviceName || "Selected service" }]
    : []
  const toggleExpanded = (providerUsageId: string) => {
    setExpandedIds((current) => {
      const next = new Set(current)

      if (next.has(providerUsageId)) {
        next.delete(providerUsageId)
      } else {
        next.add(providerUsageId)
      }

      return next
    })
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 border-b pb-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-950">
            Service Providers
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Providers used by this service and the data they process.
          </p>
        </div>
        {showAddProviders ? (
          <div className="flex gap-2">
            <Button
              disabled={checkedProviderIds.length === 0}
              type="button"
              onClick={() => {
                checkedProviderIds.forEach((organizationProviderId) => {
                  const mappedProvider = organizationProviders.find(
                    (p) => p.id === organizationProviderId
                  )
                  onCreate({
                    ...emptyServiceProviderUsageDraft,
                    serviceId: service.id ?? "",
                    organizationProviderId,
                    purpose:
                      mappedProvider?.purpose ||
                      serviceProviderPurpose(service),
                  })
                })
                setShowAddProviders(false)
                setCheckedProviderIds([])
              }}
            >
              Add
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddProviders(false)
                setCheckedProviderIds([])
              }}
            >
              Cancel
            </Button>
          </div>
        ) : editingProviderUsage ? (
          <div className="flex gap-2">
            <Button
              type="submit"
              form="service-provider-usage-form"
              disabled={isMutationPending}
            >
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingId(null)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            className="w-fit"
            disabled={!service.id || organizationProviders.length === 0}
            type="button"
            onClick={() => {
              setEditingId(null)
              setShowAddProviders(true)
              setCheckedProviderIds([])
            }}
          >
            <Plus />
            Add providers
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {!service.id ? (
          <div className="border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            Save this service before assigning providers.
          </div>
        ) : organizationProviders.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            Add providers to the provider inventory before assigning them to a
            service.
          </div>
        ) : showAddProviders ? (
          <AddVendorsForm
            selectedProviderIds={selectedProviderIds}
            organizationProviders={organizationProviders}
            checkedIds={checkedProviderIds}
            onChange={setCheckedProviderIds}
          />
        ) : editingProviderUsage ? (
          <ServiceProviderUsageForm
            dataProcessingLevelOptions={dataProcessingLevelOptions}
            dataRegionOptions={dataRegionOptions}
            dataTypeOptions={dataTypeOptions}
            defaultValues={toServiceProviderUsageInput(editingProviderUsage)}
            dpaStatusOptions={dpaStatusOptions}
            serviceOptions={serviceOptions}
            showServiceField={false}
            showButtons={false}
            submitDisabled={isMutationPending}
            submitLabel="Save provider usage"
            providerOptions={providerOptions}
            onCancel={() => setEditingId(null)}
            onSubmit={(providerUsage) => {
              onUpdate(
                {
                  id: editingProviderUsage.id,
                  providerUsage: {
                    ...providerUsage,
                    serviceId: service.id ?? "",
                  },
                },
                () => setEditingId(null)
              )
            }}
          />
        ) : selectedServiceUses.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No providers selected for this service.
          </div>
        ) : (
          <div className="grid gap-3">
            {selectedServiceUses.map((providerUsage) => {
              const expanded = expandedIds.has(providerUsage.id)

              return (
                <article
                  className="cursor-pointer border border-slate-200 bg-white p-4"
                  key={providerUsage.id}
                  onClick={() => toggleExpanded(providerUsage.id)}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="grid flex-1 gap-3">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-950">
                          {providerUsage.providerName || "Selected provider"}
                        </h4>
                        {needsAttention(providerUsage) && (
                          <span title="Needs attention">
                            <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                          </span>
                        )}
                      </div>
                      <p className="line-clamp-2 text-sm leading-5 text-slate-600">
                        {providerUsage.purpose}
                      </p>
                      {expanded ? (
                        <ProfilePanelDetailGrid
                          rows={[
                            [
                              "Data processing",
                              codeLabel(
                                vocabulary,
                                "data_processing_level",
                                providerUsage.dataProcessingLevel
                              ),
                              serviceProviderUsageHelperText.dataProcessingLevel,
                            ],
                            ...(providerUsage.dataProcessingLevel !== "none" &&
                            providerUsage.dataProcessingLevel !== "not_set"
                              ? ([
                                  [
                                    "DPA status",
                                    providerUsage.dpaStatus
                                      ? codeLabel(
                                          vocabulary,
                                          "dpa_status",
                                          providerUsage.dpaStatus
                                        )
                                      : "Not set",
                                    serviceProviderUsageHelperText.dpaStatus,
                                  ],
                                  [
                                    "Data processed",
                                    providerUsage.dataProcessed.length > 0
                                      ? providerUsage.dataProcessed.join(", ")
                                      : "No data types selected",
                                    serviceProviderUsageHelperText.dataProcessed,
                                  ],
                                  [
                                    "Data regions",
                                    codeValueList(
                                      vocabulary,
                                      "regions",
                                      providerUsage.dataRegions
                                    ),
                                    serviceProviderUsageHelperText.dataRegions,
                                  ],
                                ] as const satisfies readonly ProfilePanelDetailRow[])
                              : []),
                            [
                              "Purpose",
                              providerUsage.purpose || "Not set",
                              serviceProviderUsageHelperText.purpose,
                            ],
                          ]}
                        />
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        aria-label={expanded ? "Collapse" : "Expand"}
                        size="icon-sm"
                        type="button"
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation()
                          toggleExpanded(providerUsage.id)
                        }}
                      >
                        {expanded ? <ChevronUp /> : <ChevronDown />}
                      </Button>
                      <Button
                        aria-label="Edit provider usage"
                        size="icon-sm"
                        type="button"
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation()
                          setShowAddProviders(false)
                          setEditingId(providerUsage.id)
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        aria-label="Delete provider usage"
                        size="icon-sm"
                        type="button"
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation()
                          onDelete(providerUsage)
                        }}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
