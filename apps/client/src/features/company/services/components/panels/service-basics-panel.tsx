import { zodResolver } from "@hookform/resolvers/zod"
import { type ServiceProfileInput } from "@plyco/shared"
import { useState } from "react"
import { type Resolver, useForm } from "react-hook-form"

import {
  ProfilePanelDetailGrid,
  ProfilePanelShell,
} from "@/features/company/components/profile-panel-shell"
import { boolText } from "@/features/company/lib/display"
import { normalizeCookiePreferences } from "@/features/company/services/lib/cookie-requirements"
import {
  basicsPath,
  serviceBasicsDraft,
  serviceBasicsSchema,
  type ServiceBasicsDraft,
} from "@/features/company/services/lib/service-drafts"
import { ServiceBasicsFormFields } from "../service-basics-form-fields"
import { serviceHelperText } from "../service-helper-text"

export const ServiceBasicsPanel = ({
  isMutationPending,
  needsAttention,
  service,
  onSave,
}: {
  isMutationPending: boolean
  needsAttention?: boolean
  service: ServiceProfileInput
  onSave: (patch: Partial<ServiceProfileInput>, onSuccess?: () => void) => void
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const draft = serviceBasicsDraft(service)
  const form = useForm<ServiceBasicsDraft>({
    defaultValues: draft,
    mode: "onBlur",
    resolver: zodResolver(serviceBasicsSchema) as Resolver<ServiceBasicsDraft>,
    values: draft,
  })
  const submit = form.handleSubmit(
    ({ usesCookiesOrTrackingTechnologies, ...basics }) => {
      onSave(
        {
          ...basics,
          privacy: normalizeCookiePreferences({
            ...service.privacy,
            usesCookiesOrTrackingTechnologies,
          }),
        },
        () => setIsEditing(false)
      )
    }
  )
  return (
    <ProfilePanelShell
      description="Core identification and public details of the service or product."
      isEditing={isEditing}
      isMutationPending={isMutationPending}
      needsAttention={needsAttention}
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
            [
              "Uses cookies or tracking technologies",
              boolText(service.privacy.usesCookiesOrTrackingTechnologies),
              serviceHelperText.usesCookiesOrTrackingTechnologies,
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
        control={form.control}
        descriptionName={basicsPath("serviceDescription")}
        errors={form.formState.errors}
        nameName={basicsPath("serviceName")}
        register={form.register}
        urlName={basicsPath("serviceUrl")}
      />
    </ProfilePanelShell>
  )
}
