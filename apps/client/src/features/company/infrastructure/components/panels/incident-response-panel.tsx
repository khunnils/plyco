import { zodResolver } from "@hookform/resolvers/zod"
import {
  infrastructureProfileSchema,
  type InfrastructureProfile,
  type Vocabulary,
} from "@plyco/shared"
import { useState } from "react"
import { type Resolver, useForm } from "react-hook-form"
import { z } from "zod"

import { SelectField } from "@/components/form/select-field"
import { ToggleField } from "@/components/form/toggle-field"
import {
  ProfilePanelDetailGrid,
  ProfilePanelShell,
} from "@/features/company/components/profile-panel-shell"
import { boolText } from "@/features/company/lib/display"
import { codeLabel, type Option } from "@/features/vocabulary/lib/vocabulary"
import { infrastructureHelperText } from "../infrastructure-helper-text"

const incidentSchema = infrastructureProfileSchema.pick({
  incidentResponsePlanExists: true,
  incidentNotificationTimeline: true,
  customerNotificationProcess: true,
  incidentResponseLastTestedDate: true,
})

type IncidentDraft = z.infer<typeof incidentSchema>

const toIncidentDraft = (
  infrastructure: InfrastructureProfile
): IncidentDraft => ({
  incidentResponsePlanExists: infrastructure.incidentResponsePlanExists,
  incidentNotificationTimeline: infrastructure.incidentNotificationTimeline,
  customerNotificationProcess: infrastructure.customerNotificationProcess,
  incidentResponseLastTestedDate: infrastructure.incidentResponseLastTestedDate,
})

const incidentRows = (
  draft: IncidentDraft,
  vocabulary: Vocabulary | undefined
) =>
  [
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
    [
      "Last tested date",
      draft.incidentResponseLastTestedDate || "Not set",
      infrastructureHelperText.incidentResponseLastTestedDate,
    ],
  ] as const

export const IncidentResponsePanel = ({
  isMutationPending,
  needsAttention,
  infrastructure,
  securityCustomerNotificationProcessOptions,
  securityNotificationTimelineOptions,
  vocabulary,
  onSave,
}: {
  isMutationPending: boolean
  needsAttention?: boolean
  infrastructure: InfrastructureProfile
  securityCustomerNotificationProcessOptions: Option[]
  securityNotificationTimelineOptions: Option[]
  vocabulary: Vocabulary | undefined
  onSave: (patch: IncidentDraft, onSuccess?: () => void) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const draft = toIncidentDraft(infrastructure)

  const form = useForm<IncidentDraft>({
    defaultValues: draft,
    mode: "onBlur",
    resolver: zodResolver(incidentSchema) as Resolver<IncidentDraft>,
    values: draft,
  })

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
      <div className="grid gap-3 sm:grid-cols-2">
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
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          <span>Last tested date</span>
          <span className="-mt-1 text-xs leading-5 font-normal text-slate-500">
            {infrastructureHelperText.incidentResponseLastTestedDate}
          </span>
          <input
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 transition outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
            type="date"
            {...form.register("incidentResponseLastTestedDate", {
              setValueAs: (value) => (value === "" ? null : value),
            })}
          />
        </label>
      </div>
    </ProfilePanelShell>
  )
}
