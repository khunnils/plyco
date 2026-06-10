import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react"
import {
  type BusinessActivity,
  emptyServiceProfile,
  serviceProfileInputSchema,
  servicePrivacyProfileSchema,
  type ServiceProfileInput,
  type ServiceProviderUsage,
  type ServiceProviderUsageInput,
  type OrganizationProvider,
  type Vocabulary,
} from "@plyco/shared"
import { useEffect, useState } from "react"
import {
  type FieldPath,
  type Resolver,
  type UseFormReturn,
  useForm,
  useWatch,
} from "react-hook-form"
import { z } from "zod"

import { MultiSelectField } from "@/components/form/multi-select-field"
import { SelectField } from "@/components/form/select-field"
import { TextAreaField } from "@/components/form/text-area-field"
import { TextField } from "@/components/form/text-field"
import { ToggleField } from "@/components/form/toggle-field"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  ProfilePanelDetailGrid,
  ProfilePanelShell,
  type ProfilePanelDetailRow,
} from "@/features/company/components/profile-panel-shell"
import { ServiceProviderUsageForm } from "@/features/vendors/components/service-vendor-use-form"
import {
  emptyServiceProviderUsageDraft,
  toServiceProviderUsageInput,
} from "@/features/company/lib/profile"
import { serviceProviderUsageHelperText } from "@/features/vendors/components/service-provider-usage-helper-text"
import {
  type ProfileDraft,
  type SaveProfile,
} from "@/features/company/types/company"
import { codeLabel, type Option } from "@/features/vocabulary/lib/vocabulary"
import { serviceHelperText } from "./service-helper-text"

const serviceBasicsSchema = serviceProfileInputSchema.pick({
  serviceName: true,
  serviceDescription: true,
  serviceUrl: true,
})
const serviceAudienceSchema = serviceProfileInputSchema.pick({
  userTypes: true,
  customerTypes: true,
  availabilityRegions: true,
  childrenDirected: true,
  minimumUserAge: true,
})
const servicePrivacyDraftSchema = z.object({
  privacy: servicePrivacyProfileSchema,
})

type ServiceBasicsDraft = z.infer<typeof serviceBasicsSchema>
type ServiceAudienceDraft = z.infer<typeof serviceAudienceSchema>
type ServicePrivacyDraft = z.infer<typeof servicePrivacyDraftSchema>

const basicsPath = (field: string) => field as FieldPath<ServiceBasicsDraft>
const audiencePath = (field: string) => field as FieldPath<ServiceAudienceDraft>
const privacyPath = (field: string) =>
  `privacy.${field}` as FieldPath<ServicePrivacyDraft>

const boolText = (value: boolean | null) =>
  value === null ? "Not answered" : value ? "Yes" : "No"

const codeValueList = (
  vocabulary: Vocabulary | undefined,
  codeSetId: string,
  values: string[] | null
) =>
  values && values.length > 0
    ? values.map((value) => codeLabel(vocabulary, codeSetId, value)).join(", ")
    : "Not set"

const serviceBasicsDraft = (
  service: ServiceProfileInput
): ServiceBasicsDraft => ({
  serviceName: service.serviceName,
  serviceDescription: service.serviceDescription,
  serviceUrl: service.serviceUrl,
})

const serviceAudienceDraft = (
  service: ServiceProfileInput
): ServiceAudienceDraft => ({
  userTypes: service.userTypes,
  customerTypes: service.customerTypes,
  availabilityRegions: service.availabilityRegions,
  childrenDirected: service.childrenDirected,
  minimumUserAge: service.minimumUserAge,
})

const servicePrivacyDraft = (
  service: ServiceProfileInput
): ServicePrivacyDraft => ({
  privacy: service.privacy,
})

const serviceProviderPurpose = (service: ServiceProfileInput) =>
  `Used by ${service.serviceName?.trim() || "this service"}`

const ServiceBasicsFormFields = ({
  descriptionName,
  errors,
  nameName,
  register,
  urlName,
}: {
  descriptionName: FieldPath<ServiceBasicsDraft>
  errors: UseFormReturn<ServiceBasicsDraft>["formState"]["errors"]
  nameName: FieldPath<ServiceBasicsDraft>
  register: UseFormReturn<ServiceBasicsDraft>["register"]
  urlName: FieldPath<ServiceBasicsDraft>
}) => (
  <div className="grid gap-4 md:grid-cols-2">
    <TextField
      error={errors.serviceName}
      helperText={serviceHelperText.serviceName}
      label="Service name"
      name={nameName}
      placeholder="Acme Platform"
      register={register}
    />
    <TextField
      error={errors.serviceUrl}
      helperText={serviceHelperText.serviceUrl}
      label="Service URL"
      name={urlName}
      placeholder="https://app.acme.example"
      register={register}
    />
    <div className="md:col-span-2">
      <TextAreaField
        error={errors.serviceDescription}
        helperText={serviceHelperText.serviceDescription}
        label="Description"
        name={descriptionName}
        placeholder="Briefly describe the product or service"
        register={register}
      />
    </div>
  </div>
)

const AddServiceForm = ({
  isMutationPending,
  onCancel,
  onSubmit,
}: {
  isMutationPending: boolean
  onCancel: () => void
  onSubmit: (service: ServiceProfileInput) => void
}) => {
  const draft = serviceBasicsDraft(emptyServiceProfile)
  const form = useForm<ServiceBasicsDraft>({
    defaultValues: draft,
    mode: "onBlur",
    resolver: zodResolver(serviceBasicsSchema) as Resolver<ServiceBasicsDraft>,
    values: draft,
  })
  const submit = form.handleSubmit((basics) => {
    onSubmit({
      ...emptyServiceProfile,
      ...basics,
    })
  })

  return (
    <ProfilePanelShell
      description="Register a new service or application to define its security scope."
      isEditing
      isMutationPending={isMutationPending}
      readOnlyContent={null}
      saveLabel="Add service"
      title="Add service"
      onCancel={() => {
        form.reset(draft)
        onCancel()
      }}
      onEdit={() => undefined}
      onSave={submit}
    >
      <ServiceBasicsFormFields
        descriptionName={basicsPath("serviceDescription")}
        errors={form.formState.errors}
        nameName={basicsPath("serviceName")}
        register={form.register}
        urlName={basicsPath("serviceUrl")}
      />
    </ProfilePanelShell>
  )
}

const ServiceBasicsPanel = ({
  isMutationPending,
  service,
  onSave,
}: {
  isMutationPending: boolean
  service: ServiceProfileInput
  onSave: (patch: ServiceBasicsDraft, onSuccess?: () => void) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const draft = serviceBasicsDraft(service)
  const form = useForm<ServiceBasicsDraft>({
    defaultValues: draft,
    mode: "onBlur",
    resolver: zodResolver(serviceBasicsSchema) as Resolver<ServiceBasicsDraft>,
    values: draft,
  })
  const submit = form.handleSubmit((next) => {
    onSave(next, () => setIsEditing(false))
  })
  return (
    <ProfilePanelShell
      description="Core identification and public details of the service or product."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      readOnlyContent={
        <ProfilePanelDetailGrid
          rows={[
            [
              "Service name",
              service.serviceName || "Not set",
              serviceHelperText.serviceName,
            ],
            [
              "Service URL",
              service.serviceUrl || "Not set",
              serviceHelperText.serviceUrl,
            ],
            [
              "Description",
              service.serviceDescription || "Not set",
              serviceHelperText.serviceDescription,
            ],
          ]}
        />
      }
      saveLabel="Save"
      title="General"
      onCancel={() => {
        form.reset(draft)
        setIsEditing(false)
      }}
      onEdit={() => setIsEditing(true)}
      onSave={submit}
    >
      <ServiceBasicsFormFields
        descriptionName={basicsPath("serviceDescription")}
        errors={form.formState.errors}
        nameName={basicsPath("serviceName")}
        register={form.register}
        urlName={basicsPath("serviceUrl")}
      />
    </ProfilePanelShell>
  )
}

const ServiceActivitiesPanel = ({
  businessActivities,
  businessActivityOptions,
  isMutationPending,
  service,
  vocabulary,
  onSave,
}: {
  businessActivities: BusinessActivity[]
  businessActivityOptions: Option[]
  isMutationPending: boolean
  service: ServiceProfileInput
  vocabulary: Vocabulary | undefined
  onSave: (
    patch: Pick<ServiceProfileInput, "businessActivityIds">,
    onSuccess?: () => void
  ) => void
}) => {
  const [showAddActivities, setShowAddActivities] = useState(false)
  const [checkedActivityIds, setCheckedActivityIds] = useState<string[]>([])
  const selectedActivityIds = service.businessActivityIds
  const selectedActivityIdSet = new Set(selectedActivityIds)
  const selectedActivities = selectedActivityIds.map((activityId) => ({
    activity:
      businessActivities.find((activity) => activity.id === activityId) ?? null,
    id: activityId,
    label:
      businessActivityOptions.find((option) => option.value === activityId)
        ?.label ?? activityId,
  }))

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 border-b pb-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-950">
            Service Activities
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Processing activities this service supports.
          </p>
        </div>
        {showAddActivities ? (
          <div className="flex gap-2">
            <Button
              disabled={isMutationPending || checkedActivityIds.length === 0}
              type="button"
              onClick={() => {
                onSave(
                  {
                    businessActivityIds: [
                      ...selectedActivityIds,
                      ...checkedActivityIds.filter(
                        (activityId) => !selectedActivityIdSet.has(activityId)
                      ),
                    ],
                  },
                  () => {
                    setShowAddActivities(false)
                    setCheckedActivityIds([])
                  }
                )
              }}
            >
              Add
            </Button>
            <Button
              disabled={isMutationPending}
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddActivities(false)
                setCheckedActivityIds([])
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            className="w-fit"
            disabled={!service.id || businessActivityOptions.length === 0}
            type="button"
            onClick={() => {
              setShowAddActivities(true)
              setCheckedActivityIds([])
            }}
          >
            <Plus />
            Add Activities
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {!service.id ? (
          <div className="border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
            Save this service before assigning activities.
          </div>
        ) : businessActivityOptions.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
            Add activities to the activity inventory before assigning them to a
            service.
          </div>
        ) : showAddActivities ? (
          <AddActivitiesForm
            checkedIds={checkedActivityIds}
            options={businessActivityOptions}
            selectedActivityIds={selectedActivityIdSet}
            onChange={setCheckedActivityIds}
          />
        ) : selectedActivities.length === 0 ? (
          <div className="border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
            No activities selected for this service.
          </div>
        ) : (
          <div className="grid gap-3">
            {selectedActivities.map((selectedActivity) => {
              const roleLabel = selectedActivity.activity?.role
                ? codeLabel(
                    vocabulary,
                    "activity_role",
                    selectedActivity.activity.role
                  )
                : null
              const legalBasisLabel =
                selectedActivity.activity &&
                selectedActivity.activity.legalBasis.length > 0
                  ? codeValueList(
                      vocabulary,
                      "legal_basis",
                      selectedActivity.activity.legalBasis
                    )
                  : null

              return (
                <article
                  className="border border-slate-200 bg-white p-4"
                  key={selectedActivity.id}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="grid flex-1 gap-3">
                      <h4 className="text-sm font-semibold text-slate-950">
                        {selectedActivity.label}
                      </h4>
                      <p className="text-sm leading-5 text-slate-600">
                        {selectedActivity.activity?.purpose.trim() ||
                          "No description"}
                      </p>
                      {roleLabel || legalBasisLabel ? (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          {roleLabel ? (
                            <span>
                              <span className="font-medium text-slate-700">
                                Role:
                              </span>{" "}
                              {roleLabel}
                            </span>
                          ) : null}
                          {legalBasisLabel ? (
                            <span>
                              <span className="font-medium text-slate-700">
                                Legal basis:
                              </span>{" "}
                              {legalBasisLabel}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        aria-label="Delete service activity"
                        disabled={isMutationPending}
                        size="icon-sm"
                        type="button"
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation()
                          onSave({
                            businessActivityIds: selectedActivityIds.filter(
                              (activityId) => activityId !== selectedActivity.id
                            ),
                          })
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

const ServiceAudiencePanel = ({
  customerTypeOptions,
  isMutationPending,
  regionOptions,
  service,
  userTypeOptions,
  vocabulary,
  onSave,
}: {
  customerTypeOptions: Option[]
  isMutationPending: boolean
  regionOptions: Option[]
  service: ServiceProfileInput
  userTypeOptions: Option[]
  vocabulary: Vocabulary | undefined
  onSave: (patch: ServiceAudienceDraft, onSuccess?: () => void) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const draft = serviceAudienceDraft(service)
  const form = useForm<ServiceAudienceDraft>({
    defaultValues: draft,
    mode: "onBlur",
    resolver: zodResolver(
      serviceAudienceSchema
    ) as Resolver<ServiceAudienceDraft>,
    values: draft,
  })
  const childrenDirected = useWatch({
    control: form.control,
    name: audiencePath("childrenDirected"),
  })

  useEffect(() => {
    if (childrenDirected !== true) {
      form.setValue(audiencePath("minimumUserAge"), null)
    }
  }, [childrenDirected, form])

  const submit = form.handleSubmit((next) => {
    onSave(next, () => setIsEditing(false))
  })

  return (
    <ProfilePanelShell
      description="Target user types, customer industries, availability regions, and age restrictions."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      readOnlyContent={
        <ProfilePanelDetailGrid
          rows={[
            [
              "User types",
              codeValueList(
                vocabulary,
                "service_user_types",
                service.userTypes
              ),
              serviceHelperText.userTypes,
            ],
            [
              "Customer types",
              codeValueList(
                vocabulary,
                "service_customer_types",
                service.customerTypes
              ),
              serviceHelperText.customerTypes,
            ],
            [
              "Available regions",
              codeValueList(vocabulary, "regions", service.availabilityRegions),
              serviceHelperText.availabilityRegions,
            ],
            [
              "Directed to children",
              boolText(service.childrenDirected),
              serviceHelperText.childrenDirected,
            ],
            ...(service.childrenDirected
              ? [
                  [
                    "Minimum user age",
                    service.minimumUserAge === null
                      ? "Not answered"
                      : service.minimumUserAge === 0
                        ? "Not set"
                        : service.minimumUserAge,
                    serviceHelperText.minimumUserAge,
                  ] as ProfilePanelDetailRow,
                ]
              : []),
          ]}
        />
      }
      saveLabel="Save"
      title="Audience and Availability"
      onCancel={() => {
        form.reset(draft)
        setIsEditing(false)
      }}
      onEdit={() => setIsEditing(true)}
      onSave={submit}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <MultiSelectField
          control={form.control}
          error={form.formState.errors.userTypes?.root}
          helperText={serviceHelperText.userTypes}
          label="User types"
          name={audiencePath("userTypes")}
          options={userTypeOptions}
          placeholder="Select user types"
        />
        <MultiSelectField
          control={form.control}
          error={form.formState.errors.customerTypes?.root}
          helperText={serviceHelperText.customerTypes}
          label="Customer types"
          name={audiencePath("customerTypes")}
          options={customerTypeOptions}
          placeholder="Select customer types"
        />
        <MultiSelectField
          control={form.control}
          error={form.formState.errors.availabilityRegions?.root}
          helperText={serviceHelperText.availabilityRegions}
          label="Availability regions"
          name={audiencePath("availabilityRegions")}
          options={regionOptions}
          placeholder="Select availability regions"
        />
        <ToggleField
          control={form.control}
          helperText={serviceHelperText.childrenDirected}
          label="Directed to children"
          name={audiencePath("childrenDirected")}
        />
        {childrenDirected === true && (
          <TextField
            error={form.formState.errors.minimumUserAge}
            helperText={serviceHelperText.minimumUserAge}
            label="Minimum user age"
            name={audiencePath("minimumUserAge")}
            register={form.register}
            type="number"
            min={0}
          />
        )}
      </div>
    </ProfilePanelShell>
  )
}

const ServicePrivacyPanel = ({
  cookieConsentMechanismOptions,
  cookieTrackingCategoryOptions,
  isMutationPending,
  service,
  vocabulary,
  onSave,
}: {
  cookieConsentMechanismOptions: Option[]
  cookieTrackingCategoryOptions: Option[]
  isMutationPending: boolean
  service: ServiceProfileInput
  vocabulary: Vocabulary | undefined
  onSave: (patch: ServicePrivacyDraft, onSuccess?: () => void) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const draft = servicePrivacyDraft(service)
  const form = useForm<ServicePrivacyDraft>({
    defaultValues: draft,
    mode: "onBlur",
    resolver: zodResolver(
      servicePrivacyDraftSchema
    ) as Resolver<ServicePrivacyDraft>,
    values: draft,
  })
  const usesCookiesOrTrackingTechnologies = useWatch({
    control: form.control,
    name: privacyPath("usesCookiesOrTrackingTechnologies"),
  })
  const showCookieDetails = usesCookiesOrTrackingTechnologies === true

  useEffect(() => {
    if (usesCookiesOrTrackingTechnologies === false) {
      form.setValue(privacyPath("cookieTrackingCategories"), null)
      form.setValue(privacyPath("cookieConsentMechanism"), null)
      form.setValue(privacyPath("doNotTrackResponse"), null)
      form.setValue(privacyPath("globalPrivacyControlSupported"), null)
    }
  }, [usesCookiesOrTrackingTechnologies, form])

  const submit = form.handleSubmit((next) => {
    onSave(next, () => setIsEditing(false))
  })
  const cookieRows: ProfilePanelDetailRow[] = [
    [
      "Uses cookies or tracking technologies",
      boolText(service.privacy.usesCookiesOrTrackingTechnologies),
      serviceHelperText.usesCookiesOrTrackingTechnologies,
    ],
  ]

  if (service.privacy.usesCookiesOrTrackingTechnologies) {
    cookieRows.push(
      [
        "Cookie / tracking categories",
        codeValueList(
          vocabulary,
          "cookie_tracking_categories",
          service.privacy.cookieTrackingCategories
        ),
        serviceHelperText.cookieTrackingCategories,
      ],
      [
        "Cookie consent mechanism",
        service.privacy.cookieConsentMechanism
          ? codeLabel(
              vocabulary,
              "privacy_cookie_consent_mechanisms",
              service.privacy.cookieConsentMechanism
            )
          : "Not set",
        serviceHelperText.cookieConsentMechanism,
      ],
      [
        "Do Not Track response",
        boolText(service.privacy.doNotTrackResponse),
        serviceHelperText.doNotTrackResponse,
      ],
      [
        "Global Privacy Control",
        boolText(service.privacy.globalPrivacyControlSupported),
        serviceHelperText.globalPrivacyControlSupported,
      ]
    )
  }

  return (
    <ProfilePanelShell
      description="Cookie consent, browser signals, and visitor tracking options."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      readOnlyContent={<ProfilePanelDetailGrid rows={cookieRows} />}
      saveLabel="Save"
      title="Cookie Preferences"
      onCancel={() => {
        form.reset(draft)
        setIsEditing(false)
      }}
      onEdit={() => setIsEditing(true)}
      onSave={submit}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <ToggleField
          control={form.control}
          helperText={serviceHelperText.usesCookiesOrTrackingTechnologies}
          label="Uses cookies or tracking technologies"
          name={privacyPath("usesCookiesOrTrackingTechnologies")}
        />
        {showCookieDetails ? (
          <>
            <MultiSelectField
              control={form.control}
              error={
                form.formState.errors.privacy?.cookieTrackingCategories?.root
              }
              helperText={serviceHelperText.cookieTrackingCategories}
              label="Cookie / tracking categories"
              name={privacyPath("cookieTrackingCategories")}
              options={cookieTrackingCategoryOptions}
              placeholder="Select cookie / tracking categories"
            />
            <SelectField
              control={form.control}
              helperText={serviceHelperText.cookieConsentMechanism}
              label="Cookie consent mechanism"
              name={privacyPath("cookieConsentMechanism")}
              options={[
                { value: "", label: "Not set" },
                ...cookieConsentMechanismOptions,
              ]}
              placeholder="Not set"
            />
            <ToggleField
              control={form.control}
              helperText={serviceHelperText.doNotTrackResponse}
              label="Responds to Do Not Track"
              name={privacyPath("doNotTrackResponse")}
            />
            <ToggleField
              control={form.control}
              helperText={serviceHelperText.globalPrivacyControlSupported}
              label="Global Privacy Control supported"
              name={privacyPath("globalPrivacyControlSupported")}
            />
          </>
        ) : null}
      </div>
    </ProfilePanelShell>
  )
}

const ServiceHostingPanel = ({
  isMutationPending,
  regionOptions,
  service,
  vocabulary,
  onSave,
}: {
  isMutationPending: boolean
  regionOptions: Option[]
  service: ServiceProfileInput
  vocabulary: Vocabulary | undefined
  onSave: (patch: ServicePrivacyDraft, onSuccess?: () => void) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const draft = servicePrivacyDraft(service)
  const form = useForm<ServicePrivacyDraft>({
    defaultValues: draft,
    mode: "onBlur",
    resolver: zodResolver(
      servicePrivacyDraftSchema
    ) as Resolver<ServicePrivacyDraft>,
    values: draft,
  })
  const submit = form.handleSubmit((next) => {
    onSave(next, () => setIsEditing(false))
  })

  return (
    <ProfilePanelShell
      description="Primary hosting region for this service."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      readOnlyContent={
        <ProfilePanelDetailGrid
          rows={[
            [
              "Primary hosting region",
              service.privacy.primaryHostingRegion
                ? codeLabel(
                    vocabulary,
                    "regions",
                    service.privacy.primaryHostingRegion
                  )
                : "Not set",
              serviceHelperText.primaryHostingRegion,
            ],
          ]}
        />
      }
      saveLabel="Save"
      title="Service Hosting"
      onCancel={() => {
        form.reset(draft)
        setIsEditing(false)
      }}
      onEdit={() => setIsEditing(true)}
      onSave={submit}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          control={form.control}
          helperText={serviceHelperText.primaryHostingRegion}
          label="Primary hosting region"
          name={privacyPath("primaryHostingRegion")}
          options={[{ value: "", label: "Not set" }, ...regionOptions]}
          placeholder="Not set"
        />
      </div>
    </ProfilePanelShell>
  )
}

const AddActivitiesForm = ({
  checkedIds,
  options,
  selectedActivityIds,
  onChange,
}: {
  checkedIds: string[]
  options: Option[]
  selectedActivityIds: Set<string>
  onChange: (checkedIds: string[]) => void
}) => {
  const toggleActivity = (activityId: string, checked: boolean) => {
    onChange(
      checked
        ? [...checkedIds, activityId]
        : checkedIds.filter((currentId) => currentId !== activityId)
    )
  }

  return (
    <div className="grid gap-4 border border-slate-200 bg-white p-4">
      <div className="grid gap-2">
        {options.map((option) => {
          const disabled = selectedActivityIds.has(option.value)

          return (
            <label
              className={[
                "flex min-h-11 items-center gap-3 border bg-white px-3 py-2 text-sm",
                disabled
                  ? "border-slate-200 text-slate-400"
                  : "border-slate-200 text-slate-800",
              ].join(" ")}
              key={option.value}
            >
              <input
                checked={disabled || checkedIds.includes(option.value)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                disabled={disabled}
                type="checkbox"
                onChange={(event) =>
                  toggleActivity(option.value, event.target.checked)
                }
              />
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              {disabled ? <Badge variant="secondary">Selected</Badge> : null}
            </label>
          )
        })}
      </div>
    </div>
  )
}

const AddVendorsForm = ({
  selectedProviderIds,
  organizationProviders,
  checkedIds,
  onChange,
}: {
  selectedProviderIds: Set<string>
  organizationProviders: OrganizationProvider[]
  checkedIds: string[]
  onChange: (checkedIds: string[]) => void
}) => {
  const toggleProvider = (providerId: string, checked: boolean) => {
    onChange(
      checked
        ? [...checkedIds, providerId]
        : checkedIds.filter((currentId) => currentId !== providerId)
    )
  }

  return (
    <div className="grid gap-4 border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-2">
        {organizationProviders.map((provider) => {
          const disabled = selectedProviderIds.has(provider.id)

          return (
            <label
              className={[
                "flex min-h-11 items-center gap-3 border bg-white px-3 py-2 text-sm",
                disabled
                  ? "border-slate-200 text-slate-400"
                  : "border-slate-200 text-slate-800",
              ].join(" ")}
              key={provider.id}
            >
              <input
                checked={disabled || checkedIds.includes(provider.id)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                disabled={disabled}
                type="checkbox"
                onChange={(event) =>
                  toggleProvider(provider.id, event.target.checked)
                }
              />
              <span className="min-w-0 flex-1 truncate">{provider.name}</span>
              {disabled ? <Badge variant="secondary">Selected</Badge> : null}
            </label>
          )
        })}
      </div>
    </div>
  )
}

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

const ServiceProviderUsagePanel = ({
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
                    (p) => p.id === organizationProviderId,
                  )
                  onCreate({
                    ...emptyServiceProviderUsageDraft,
                    serviceId: service.id ?? "",
                    organizationProviderId,
                    purpose: mappedProvider?.purpose || serviceProviderPurpose(service),
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
                            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
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
                            ...(providerUsage.dataProcessingLevel !== "none" && providerUsage.dataProcessingLevel !== "not_set"
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

export const ServiceManager = ({
  businessActivities,
  businessActivityOptions,
  cookieConsentMechanismOptions,
  cookieTrackingCategoryOptions,
  customerTypeOptions,
  dataProcessingLevelOptions,
  dataRegionOptions,
  dataTypeOptions,
  dpaStatusOptions,
  isCreatingService,
  isProfileMutationPending,
  isVendorMutationPending,
  profile,
  regionOptions,
  selectedServiceId,
  serviceProviderUsage,
  userTypeOptions,
  organizationProviders,
  vocabulary,
  onCancelCreateService,
  onCreateProviderUsage,
  onDeleteProviderUsage,
  onSaveProfile,
  onSelectService,
  onUpdateProviderUsage,
}: {
  businessActivities: BusinessActivity[]
  businessActivityOptions: Option[]
  cookieConsentMechanismOptions: Option[]
  cookieTrackingCategoryOptions: Option[]
  customerTypeOptions: Option[]
  dataProcessingLevelOptions: Option[]
  dataRegionOptions: Option[]
  dataTypeOptions: Array<{ value: string; label: string }>
  dpaStatusOptions: Option[]
  isCreatingService: boolean
  isProfileMutationPending: boolean
  isVendorMutationPending: boolean
  profile: ProfileDraft
  regionOptions: Option[]
  selectedServiceId: string | null
  serviceProviderUsage: ServiceProviderUsage[]
  userTypeOptions: Option[]
  organizationProviders: OrganizationProvider[]
  vocabulary: Vocabulary | undefined
  onCancelCreateService: () => void
  onCreateProviderUsage: (
    providerUsage: ServiceProviderUsageInput,
    onSuccess?: () => void
  ) => void
  onDeleteProviderUsage: (providerUsage: ServiceProviderUsage) => void
  onSaveProfile: SaveProfile
  onSelectService: (id: string | null) => void
  onUpdateProviderUsage: (
    input: {
      id: string
      providerUsage: ServiceProviderUsageInput
    },
    onSuccess?: () => void
  ) => void
}) => {
  const selectedIndex = Math.max(
    profile.services.findIndex((service) => service.id === selectedServiceId),
    0
  )
  const selectedService = profile.services[selectedIndex] ?? emptyServiceProfile

  const activitiesCount = selectedService.businessActivityIds?.length ?? 0
  const selectedServiceUses = selectedService.id
    ? serviceProviderUsage.filter(
        (providerUsage) => providerUsage.serviceId === selectedService.id
      )
    : []
  const providersCount = selectedServiceUses.length

  const [activeTab, setActiveTab] = useState<
    "details" | "activities" | "providers"
  >("details")
  const [prevSelectedServiceId, setPrevSelectedServiceId] =
    useState(selectedServiceId)

  if (selectedServiceId !== prevSelectedServiceId) {
    setPrevSelectedServiceId(selectedServiceId)
    setActiveTab("details")
  }

  useEffect(() => {
    if (
      !isCreatingService &&
      profile.services.length > 0 &&
      !profile.services.some((service) => service.id === selectedServiceId)
    ) {
      const nextServiceId = profile.services[0]?.id ?? null

      if (selectedServiceId !== nextServiceId) {
        onSelectService(nextServiceId)
      }
    }
  }, [isCreatingService, onSelectService, profile.services, selectedServiceId])

  const saveServicePatch = (
    patch: Partial<ServiceProfileInput>,
    onSuccess?: () => void
  ) => {
    onSaveProfile(
      {
        ...profile,
        services: profile.services.map((currentService, index) =>
          index === selectedIndex
            ? {
                ...currentService,
                ...patch,
              }
            : currentService
        ),
      },
      onSuccess
    )
  }

  const createService = (service: ServiceProfileInput) => {
    onSaveProfile(
      {
        ...profile,
        services: [...profile.services, service],
      },
      (snapshot) => {
        const createdService = snapshot.organization?.services.at(-1)

        onSelectService(createdService?.id ?? null)
        onCancelCreateService()
      }
    )
  }

  if (isCreatingService) {
    return (
      <AddServiceForm
        isMutationPending={isProfileMutationPending}
        onCancel={onCancelCreateService}
        onSubmit={createService}
      />
    )
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(val) =>
        setActiveTab(val as "details" | "activities" | "providers")
      }
      className="grid gap-6"
    >
      <TabsList
        variant="line"
        className="gap-6 border-b border-slate-200 w-full justify-start pb-0 h-auto rounded-none p-0"
      >
        <TabsTrigger
          value="details"
          className="mb-[-2px] pb-3 pt-0 px-0 rounded-none text-slate-500 data-active:text-slate-900 font-medium data-active:font-semibold h-auto after:bottom-[-2px]"
        >
          Service details
        </TabsTrigger>
        <TabsTrigger
          value="activities"
          className="mb-[-2px] pb-3 pt-0 px-0 rounded-none text-slate-500 data-active:text-slate-900 font-medium data-active:font-semibold h-auto after:bottom-[-2px]"
        >
          Service Activities ({activitiesCount})
        </TabsTrigger>
        <TabsTrigger
          value="providers"
          className="mb-[-2px] pb-3 pt-0 px-0 rounded-none text-slate-500 data-active:text-slate-900 font-medium data-active:font-semibold h-auto after:bottom-[-2px]"
        >
          Service Providers ({providersCount})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="mt-0">
        <div className="grid gap-10">
          <ServiceBasicsPanel
            isMutationPending={isProfileMutationPending}
            service={selectedService}
            onSave={saveServicePatch}
          />
          <ServiceAudiencePanel
            customerTypeOptions={customerTypeOptions}
            isMutationPending={isProfileMutationPending}
            regionOptions={regionOptions}
            service={selectedService}
            userTypeOptions={userTypeOptions}
            vocabulary={vocabulary}
            onSave={saveServicePatch}
          />
          <ServicePrivacyPanel
            cookieConsentMechanismOptions={cookieConsentMechanismOptions}
            cookieTrackingCategoryOptions={cookieTrackingCategoryOptions}
            isMutationPending={isProfileMutationPending}
            service={selectedService}
            vocabulary={vocabulary}
            onSave={saveServicePatch}
          />
          <ServiceHostingPanel
            isMutationPending={isProfileMutationPending}
            regionOptions={regionOptions}
            service={selectedService}
            vocabulary={vocabulary}
            onSave={saveServicePatch}
          />
        </div>
      </TabsContent>

      <TabsContent value="activities" className="mt-0">
        <ServiceActivitiesPanel
          businessActivities={businessActivities}
          businessActivityOptions={businessActivityOptions}
          isMutationPending={isProfileMutationPending}
          service={selectedService}
          vocabulary={vocabulary}
          onSave={saveServicePatch}
        />
      </TabsContent>

      <TabsContent value="providers" className="mt-0">
        <ServiceProviderUsagePanel
          dataProcessingLevelOptions={dataProcessingLevelOptions}
          dataRegionOptions={dataRegionOptions}
          dataTypeOptions={dataTypeOptions}
          dpaStatusOptions={dpaStatusOptions}
          isMutationPending={isVendorMutationPending}
          service={selectedService}
          serviceProviderUsage={serviceProviderUsage}
          organizationProviders={organizationProviders}
          vocabulary={vocabulary}
          onCreate={onCreateProviderUsage}
          onDelete={onDeleteProviderUsage}
          onUpdate={onUpdateProviderUsage}
        />
      </TabsContent>
    </Tabs>
  )
}
