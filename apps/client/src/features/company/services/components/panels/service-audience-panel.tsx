import { zodResolver } from "@hookform/resolvers/zod"
import { type ServiceProfileInput, type Vocabulary } from "@plyco/shared"
import { useEffect, useState } from "react"
import { type Resolver, useForm, useWatch } from "react-hook-form"

import { MultiSelectField } from "@/components/form/multi-select-field"
import { TextField } from "@/components/form/text-field"
import { ToggleField } from "@/components/form/toggle-field"
import {
  EditPanelGrid,
  ProfilePanelDetailGrid,
  ProfilePanelShell,
  type ProfilePanelDetailRow,
} from "@/features/company/components/profile-panel-shell"
import { boolText } from "@/features/company/lib/display"
import {
  audiencePath,
  serviceAudienceDraft,
  serviceAudienceSchema,
  type ServiceAudienceDraft,
} from "@/features/company/services/lib/service-drafts"
import { codeValueList } from "@/features/company/services/lib/service-display"
import { type Option } from "@/features/vocabulary/lib/vocabulary"
import { serviceHelperText } from "../service-helper-text"

export const ServiceAudiencePanel = ({
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
      <EditPanelGrid>
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
      </EditPanelGrid>
    </ProfilePanelShell>
  )
}
