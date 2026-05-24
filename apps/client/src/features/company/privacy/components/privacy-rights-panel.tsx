import { zodResolver } from "@hookform/resolvers/zod"
import {
  privacyProfileSchema,
  type PrivacyProfile,
  type Vocabulary,
} from "@plyco/shared"
import { useState } from "react"
import { type Resolver, useForm } from "react-hook-form"
import { z } from "zod"

import { MultiSelectField } from "@/components/form/multi-select-field"
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

const rightsSchema = privacyProfileSchema.pick({
  supportedRights: true,
  requestMethods: true,
  responseTimelineDays: true,
  identityVerificationRequired: true,
  authorizedAgentSupported: true,
  appealProcessExists: true,
})

type RightsDraft = z.infer<typeof rightsSchema>

const toRightsDraft = (privacy: PrivacyProfile): RightsDraft => ({
  supportedRights: privacy.supportedRights,
  requestMethods: privacy.requestMethods,
  responseTimelineDays: privacy.responseTimelineDays,
  identityVerificationRequired: privacy.identityVerificationRequired,
  authorizedAgentSupported: privacy.authorizedAgentSupported,
  appealProcessExists: privacy.appealProcessExists,
})

const rightsRows = (draft: RightsDraft, vocabulary: Vocabulary | undefined) =>
  [
    [
      "Supported rights",
      codeValueList(
        vocabulary,
        "privacy_supported_rights",
        draft.supportedRights
      ),
    ],
    [
      "Request methods",
      codeValueList(
        vocabulary,
        "privacy_request_methods",
        draft.requestMethods
      ),
    ],
    [
      "Response timeline",
      draft.responseTimelineDays === 0 ? "Not set" : draft.responseTimelineDays,
    ],
    ["Identity verification", boolText(draft.identityVerificationRequired)],
    ["Authorized agent", boolText(draft.authorizedAgentSupported)],
    ["Appeal process", boolText(draft.appealProcessExists)],
  ] as const

export const PrivacyRightsPanel = ({
  isMutationPending,
  privacy,
  requestMethodOptions,
  supportedRightOptions,
  vocabulary,
  onSave,
}: {
  isMutationPending: boolean
  privacy: PrivacyProfile
  requestMethodOptions: Option[]
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

  const submit = form.handleSubmit((next) => {
    onSave(next, () => setIsEditing(false))
  })

  return (
    <ProfilePanelShell
      description="Rights supported and how requests are handled."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      readOnlyContent={
        <ProfilePanelDetailGrid rows={rightsRows(draft, vocabulary)} />
      }
      saveLabel="Save section"
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
          label="Supported rights"
          name="supportedRights"
          options={supportedRightOptions}
          placeholder="Select supported rights"
        />
        <MultiSelectField
          control={form.control}
          error={form.formState.errors.requestMethods?.root}
          label="Request methods"
          name="requestMethods"
          options={requestMethodOptions}
          placeholder="Select request methods"
        />
        <label className="grid gap-2 text-sm font-medium text-slate-800">
          Response timeline days
          <input
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 transition outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
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
          label="Identity verification required"
          name="identityVerificationRequired"
        />
        <ToggleField
          control={form.control}
          label="Authorized agent supported"
          name="authorizedAgentSupported"
        />
        <ToggleField
          control={form.control}
          label="Appeal process exists"
          name="appealProcessExists"
        />
      </div>
    </ProfilePanelShell>
  )
}
