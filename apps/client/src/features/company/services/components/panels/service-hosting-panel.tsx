import { zodResolver } from "@hookform/resolvers/zod"
import { type ServiceProfileInput, type Vocabulary } from "@plyco/shared"
import { useState } from "react"
import { type Resolver, useForm } from "react-hook-form"

import { SelectField } from "@/components/form/select-field"
import {
  EditPanelGrid,
  ProfilePanelDetailGrid,
  ProfilePanelShell,
} from "@/features/company/components/profile-panel-shell"
import {
  privacyPath,
  servicePrivacyDraft,
  servicePrivacyDraftSchema,
  type ServicePrivacyDraft,
} from "@/features/company/services/lib/service-drafts"
import { codeLabel, type Option } from "@/features/vocabulary/lib/vocabulary"
import { serviceHelperText } from "../service-helper-text"

export const ServiceHostingPanel = ({
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
      <EditPanelGrid>
        <SelectField
          control={form.control}
          helperText={serviceHelperText.primaryHostingRegion}
          label="Primary hosting region"
          name={privacyPath("primaryHostingRegion")}
          options={[{ value: "", label: "Not set" }, ...regionOptions]}
          placeholder="Not set"
        />
      </EditPanelGrid>
    </ProfilePanelShell>
  )
}
