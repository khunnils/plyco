import { type FieldPath, type UseFormReturn } from "react-hook-form"

import { TextAreaField } from "@/components/form/text-area-field"
import { TextField } from "@/components/form/text-field"
import { ToggleField } from "@/components/form/toggle-field"
import {
  basicsPath,
  type ServiceBasicsDraft,
} from "@/features/company/services/lib/service-drafts"
import { serviceHelperText } from "./service-helper-text"

export const ServiceBasicsFormFields = ({
  control,
  descriptionName,
  errors,
  nameName,
  register,
  urlName,
}: {
  control: UseFormReturn<ServiceBasicsDraft>["control"]
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
    <div className="md:col-span-2">
      <ToggleField
        control={control}
        helperText={serviceHelperText.usesCookiesOrTrackingTechnologies}
        label="Uses cookies or tracking technologies"
        name={basicsPath("usesCookiesOrTrackingTechnologies")}
      />
    </div>
  </div>
)
