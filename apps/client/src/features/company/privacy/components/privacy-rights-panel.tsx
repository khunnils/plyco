import { zodResolver } from "@hookform/resolvers/zod"
import {
  privacyProfileSchema,
  type PrivacyProfile,
  type Vocabulary,
} from "@plyco/shared"
import { useEffect, useState } from "react"
import { type Resolver, useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { MultiSelectField } from "@/components/form/multi-select-field"
import { SelectField } from "@/components/form/select-field"
import { ToggleField } from "@/components/form/toggle-field"
import {
  ProfilePanelDetailGrid,
  ProfilePanelShell,
} from "@/features/company/components/profile-panel-shell"
import { boolText } from "@/features/company/lib/display"
import {
  codeValueList,
  type Option,
} from "@/features/vocabulary/lib/vocabulary"
import { privacyHelperText } from "./privacy-helper-text"

const rightsSchema = privacyProfileSchema.pick({
  supportedRights: true,
  requestMethods: true,
  responseTimelineDaysStatus: true,
  responseTimelineDays: true,
  identityVerificationRequired: true,
  authorizedAgentSupported: true,
  appealProcessExists: true,
})

type RightsDraft = z.infer<typeof rightsSchema>

const toRightsDraft = (privacy: PrivacyProfile): RightsDraft => ({
  supportedRights: privacy.supportedRights,
  requestMethods: privacy.requestMethods,
  responseTimelineDaysStatus: privacy.responseTimelineDaysStatus,
  responseTimelineDays: privacy.responseTimelineDays,
  identityVerificationRequired: privacy.identityVerificationRequired,
  authorizedAgentSupported: privacy.authorizedAgentSupported,
  appealProcessExists: privacy.appealProcessExists,
})

const rightsRows = (draft: RightsDraft, vocabulary: Vocabulary | undefined) =>
  [
    [
      "Privacy supported rights",
      codeValueList(
        vocabulary,
        "privacy_supported_rights",
        draft.supportedRights
      ),
      privacyHelperText.supportedRights,
    ],
    [
      "Request methods",
      codeValueList(
        vocabulary,
        "privacy_request_methods",
        draft.requestMethods
      ),
      privacyHelperText.requestMethods,
    ],
    [
      "Response timeline status",
      draft.responseTimelineDaysStatus
        ? codeValueList(vocabulary, "defined_statuses", [
            draft.responseTimelineDaysStatus,
          ])
        : "Not set",
      privacyHelperText.responseTimelineDaysStatus,
    ],
    [
      "Response timeline",
      formatDays(draft.responseTimelineDays),
      privacyHelperText.responseTimelineDays,
    ],
    [
      "Identity verification",
      boolText(draft.identityVerificationRequired),
      privacyHelperText.identityVerificationRequired,
    ],
    [
      "Authorized representative requests",
      boolText(draft.authorizedAgentSupported),
      privacyHelperText.authorizedAgentSupported,
    ],
    [
      "Appeal process for denied requests",
      boolText(draft.appealProcessExists),
      privacyHelperText.appealProcessExists,
    ],
  ] as const

export const PrivacyRightsPanel = ({
  isMutationPending,
  needsAttention,
  privacy,
  requestMethodOptions,
  responseTimelineStatusOptions,
  supportedRightOptions,
  vocabulary,
  onSave,
}: {
  isMutationPending: boolean
  needsAttention?: boolean
  privacy: PrivacyProfile
  requestMethodOptions: Option[]
  responseTimelineStatusOptions: Option[]
  supportedRightOptions: Option[]
  vocabulary: Vocabulary | undefined
  onSave: (patch: RightsDraft, onSuccess?: () => void) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const draft = toRightsDraft(privacy)

  const form = useForm<RightsDraft>({
    defaultValues: draft,
    mode: "onBlur",
    resolver: zodResolver(rightsSchema) as Resolver<RightsDraft>,
    values: draft,
  })
  const responseTimelineDaysStatus = useWatch({
    control: form.control,
    name: "responseTimelineDaysStatus",
  })
  const responseTimelineDaysDisabled = responseTimelineDaysStatus !== "defined"

  useEffect(() => {
    if (responseTimelineDaysStatus === "not_defined") {
      form.setValue("responseTimelineDays", null)
    }
  }, [responseTimelineDaysStatus, form])

  const submit = form.handleSubmit((next) => {
    onSave(next, () => setIsEditing(false))
  })

  return (
    <ProfilePanelShell
      description="Rights supported and how requests are handled."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      needsAttention={needsAttention}
      readOnlyContent={
        <ProfilePanelDetailGrid rows={rightsRows(draft, vocabulary)} />
      }
      saveLabel="Save"
      title="Privacy Rights & Request Handling"
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
          error={form.formState.errors.supportedRights?.root}
          helperText={privacyHelperText.supportedRights}
          label="Privacy supported rights"
          name="supportedRights"
          options={supportedRightOptions}
          placeholder="Select supported rights"
        />
        <MultiSelectField
          control={form.control}
          error={form.formState.errors.requestMethods?.root}
          helperText={privacyHelperText.requestMethods}
          label="Request methods"
          name="requestMethods"
          options={requestMethodOptions}
          placeholder="Select request methods"
        />
        <SelectField
          control={form.control}
          helperText={privacyHelperText.responseTimelineDaysStatus}
          label="Response timeline status"
          name="responseTimelineDaysStatus"
          options={[
            { value: "", label: "Not set" },
            ...responseTimelineStatusOptions,
          ]}
          placeholder="Not set"
        />
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          <span>Response timeline days</span>
          <span className="-mt-1 text-xs leading-5 font-normal text-slate-500">
            {privacyHelperText.responseTimelineDays}
          </span>
          <input
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 transition outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            disabled={responseTimelineDaysDisabled}
            inputMode="numeric"
            min={0}
            type="number"
            {...form.register("responseTimelineDays", {
              setValueAs: (value) => (value === "" ? null : Number(value)),
            })}
          />
        </label>
        <ToggleField
          control={form.control}
          helperText={privacyHelperText.identityVerificationRequired}
          label="Identity verification required"
          name="identityVerificationRequired"
        />
        <ToggleField
          control={form.control}
          helperText={privacyHelperText.authorizedAgentSupported}
          label="Authorized agent supported"
          name="authorizedAgentSupported"
        />
        <ToggleField
          control={form.control}
          helperText={privacyHelperText.appealProcessExists}
          label="Appeal process exists"
          name="appealProcessExists"
        />
      </div>
    </ProfilePanelShell>
  )
}

const formatDays = (value: number | null) => {
  if (value === null || value === 0) {
    return "Not set"
  }

  return `${value} ${value === 1 ? "day" : "days"}`
}
