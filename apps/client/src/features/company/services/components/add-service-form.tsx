import { zodResolver } from "@hookform/resolvers/zod"
import { emptyServiceProfile, type ServiceProfileInput } from "@plyco/shared"
import { type Resolver, useForm } from "react-hook-form"

import { ProfilePanelShell } from "@/features/company/components/profile-panel-shell"
import { normalizeCookiePreferences } from "@/features/company/services/lib/cookie-requirements"
import {
  basicsPath,
  serviceBasicsDraft,
  serviceBasicsSchema,
  type ServiceBasicsDraft,
} from "@/features/company/services/lib/service-drafts"
import { ServiceBasicsFormFields } from "./service-basics-form-fields"

export const AddServiceForm = ({
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
  const submit = form.handleSubmit(
    ({ usesCookiesOrTrackingTechnologies, ...basics }) => {
      onSubmit({
        ...emptyServiceProfile,
        ...basics,
        privacy: normalizeCookiePreferences({
          ...emptyServiceProfile.privacy,
          usesCookiesOrTrackingTechnologies,
        }),
      })
    }
  )

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
