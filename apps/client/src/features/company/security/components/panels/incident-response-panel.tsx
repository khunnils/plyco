import { zodResolver } from "@hookform/resolvers/zod"
import {
  securityProfileSchema,
  type SecurityProfile,
  type Vocabulary,
} from "@plyco/shared"
import { useState, useEffect } from "react"
import { type Resolver, useForm } from "react-hook-form"
import { z } from "zod"

import { SelectField } from "@/components/form/select-field"
import { TextField } from "@/components/form/text-field"
import { ToggleField } from "@/components/form/toggle-field"
import {
  EditPanelGrid,
  ProfilePanelDetailGrid,
  ProfilePanelShell,
  type ProfilePanelDetailRow,
} from "@/features/company/components/profile-panel-shell"
import { boolText } from "@/features/company/lib/display"
import { codeLabel, type Option } from "@/features/vocabulary/lib/vocabulary"
import { securityHelperText as infrastructureHelperText } from "../security-helper-text"

const incidentSchema = securityProfileSchema.pick({
  incidentResponsePlanExists: true,
  incidentNotificationTimeline: true,
  customerNotificationProcess: true,
  incidentResponseLastTestedDate: true,
})

type IncidentDraft = z.infer<typeof incidentSchema>

const toIncidentDraft = (security: SecurityProfile): IncidentDraft => ({
  incidentResponsePlanExists: security.incidentResponsePlanExists,
  incidentNotificationTimeline: security.incidentNotificationTimeline,
  customerNotificationProcess: security.customerNotificationProcess,
  incidentResponseLastTestedDate: security.incidentResponseLastTestedDate,
})

const incidentRows = (
  draft: IncidentDraft,
  vocabulary: Vocabulary | undefined
) => {
  const rows: ProfilePanelDetailRow[] = [
    [
      "Incident response plan exists",
      boolText(draft.incidentResponsePlanExists),
      infrastructureHelperText.incidentResponsePlanExists,
    ],
    [
      "Notification timeline",
      draft.incidentNotificationTimeline
        ? codeLabel(
            vocabulary,
            "security_notification_timelines",
            draft.incidentNotificationTimeline
          )
        : "Not set",
      infrastructureHelperText.incidentNotificationTimeline,
    ],
    [
      "Customer notification process",
      draft.customerNotificationProcess
        ? codeLabel(
            vocabulary,
            "security_customer_notification_processes",
            draft.customerNotificationProcess
          )
        : "Not set",
      infrastructureHelperText.customerNotificationProcess,
    ],
  ]

  if (draft.incidentResponsePlanExists) {
    rows.push([
      "Last tested date",
      draft.incidentResponseLastTestedDate || "Not set",
      infrastructureHelperText.incidentResponseLastTestedDate,
    ])
  }

  return rows
}

export const IncidentResponsePanel = ({
  isMutationPending,
  needsAttention,
  security,
  securityCustomerNotificationProcessOptions,
  securityNotificationTimelineOptions,
  vocabulary,
  onSave,
}: {
  isMutationPending: boolean
  needsAttention?: boolean
  security: SecurityProfile
  securityCustomerNotificationProcessOptions: Option[]
  securityNotificationTimelineOptions: Option[]
  vocabulary: Vocabulary | undefined
  onSave: (patch: IncidentDraft, onSuccess?: () => void) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const draft = toIncidentDraft(security)

  const form = useForm<IncidentDraft>({
    defaultValues: draft,
    mode: "onBlur",
    resolver: zodResolver(incidentSchema) as Resolver<IncidentDraft>,
    values: draft,
  })

  const incidentResponsePlanExists = form.watch("incidentResponsePlanExists")

  useEffect(() => {
    if (!incidentResponsePlanExists) {
      form.setValue("incidentResponseLastTestedDate", null)
    }
  }, [incidentResponsePlanExists, form])

  const submit = form.handleSubmit((next) => {
    onSave(next, () => setIsEditing(false))
  })

  return (
    <ProfilePanelShell
      description="Breach notification plans, customer communication processes, and reporting timelines."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      needsAttention={needsAttention}
      readOnlyContent={
        <ProfilePanelDetailGrid rows={incidentRows(draft, vocabulary)} />
      }
      saveLabel="Save"
      title="Incident Response"
      onCancel={() => {
        form.reset(draft)
        setIsEditing(false)
      }}
      onEdit={() => setIsEditing(true)}
      onSave={submit}
    >
      <EditPanelGrid>
        <ToggleField
          control={form.control}
          helperText={infrastructureHelperText.incidentResponsePlanExists}
          label="Incident response plan exists"
          name="incidentResponsePlanExists"
        />
        <SelectField
          control={form.control}
          helperText={infrastructureHelperText.incidentNotificationTimeline}
          label="Notification timeline"
          name="incidentNotificationTimeline"
          options={[
            { value: "", label: "Not set" },
            ...securityNotificationTimelineOptions,
          ]}
          placeholder="Not set"
        />
        <SelectField
          control={form.control}
          helperText={infrastructureHelperText.customerNotificationProcess}
          label="Customer notification process"
          name="customerNotificationProcess"
          options={[
            { value: "", label: "Not set" },
            ...securityCustomerNotificationProcessOptions,
          ]}
          placeholder="Not set"
        />
        {incidentResponsePlanExists && (
          <TextField
            error={form.formState.errors.incidentResponseLastTestedDate}
            helperText={infrastructureHelperText.incidentResponseLastTestedDate}
            label="Last tested date"
            name="incidentResponseLastTestedDate"
            register={form.register}
            type="date"
          />
        )}
      </EditPanelGrid>
    </ProfilePanelShell>
  )
}
