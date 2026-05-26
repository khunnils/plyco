import { useEffect } from "react"
import { Plus, Trash2 } from "lucide-react"
import { emptyServiceProfile } from "@plyco/shared"
import {
  type FieldPath,
  type UseFormReturn,
  useFieldArray,
  useWatch,
} from "react-hook-form"

import { MultiSelectField } from "@/components/form/multi-select-field"
import { SelectField } from "@/components/form/select-field"
import { TextField } from "@/components/form/text-field"
import { ToggleField } from "@/components/form/toggle-field"
import { Button } from "@/components/ui/button"
import { type ProfileDraft } from "@/features/company/types/company"
import { type Option } from "@/features/vocabulary/lib/vocabulary"

const servicePath = (index: number, field: string) =>
  `services.${index}.${field}` as FieldPath<ProfileDraft>

const servicePrivacyPath = (index: number, field: string) =>
  `services.${index}.privacy.${field}` as FieldPath<ProfileDraft>

const MinimumAgeField = ({
  form,
  index,
}: {
  form: UseFormReturn<ProfileDraft>
  index: number
}) => {
  const error = form.formState.errors.services?.[index]?.minimumUserAge
  const childrenDirected = useWatch({
    control: form.control,
    name: servicePath(index, "childrenDirected"),
  })

  useEffect(() => {
    if (childrenDirected !== true) {
      form.setValue(servicePath(index, "minimumUserAge"), null)
    }
  }, [childrenDirected, form, index])

  if (childrenDirected !== true) {
    return null
  }

  return (
    <label className="grid gap-2 text-sm font-medium text-slate-800">
      Minimum user age
      <input
        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 transition outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
        inputMode="numeric"
        min={0}
        type="number"
        {...form.register(servicePath(index, "minimumUserAge"), {
          setValueAs: (value) => (value === "" ? null : Number(value)),
        })}
      />
      {error && <span className="text-xs text-red-700">{error.message}</span>}
    </label>
  )
}

export const ServiceProfileFields = ({
  businessActivityOptions,
  cookieConsentMechanismOptions,
  cookieTrackingCategoryOptions,
  customerTypeOptions,
  form,
  regionOptions,
  userTypeOptions,
}: {
  businessActivityOptions: Option[]
  cookieConsentMechanismOptions: Option[]
  cookieTrackingCategoryOptions: Option[]
  customerTypeOptions: Option[]
  form: UseFormReturn<ProfileDraft>
  regionOptions: Option[]
  userTypeOptions: Option[]
}) => {
  const { append, fields, remove } = useFieldArray({
    control: form.control,
    keyName: "fieldId",
    name: "services",
  })

  return (
    <div className="grid gap-4">
      {fields.map((field, index) => (
        <div
          className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-2"
          key={field.fieldId}
        >
          <div className="flex items-center justify-between gap-3 md:col-span-2">
            <h3 className="text-sm font-semibold text-slate-950">
              Service {index + 1}
            </h3>
            <Button
              disabled={fields.length === 1}
              size="icon-sm"
              type="button"
              variant="outline"
              onClick={() => remove(index)}
            >
              <Trash2 />
            </Button>
          </div>
          <TextField
            error={form.formState.errors.services?.[index]?.serviceName}
            label="Service name"
            name={servicePath(index, "serviceName")}
            placeholder="Acme Platform"
            register={form.register}
          />
          <TextField
            error={form.formState.errors.services?.[index]?.serviceUrl}
            label="Service URL"
            name={servicePath(index, "serviceUrl")}
            placeholder="https://app.acme.example"
            register={form.register}
          />
          <div className="md:col-span-2">
            <TextField
              error={
                form.formState.errors.services?.[index]?.serviceDescription
              }
              label="Description"
              name={servicePath(index, "serviceDescription")}
              placeholder="Briefly describe the product or service"
              register={form.register}
            />
          </div>
          <MultiSelectField
            control={form.control}
            error={
              form.formState.errors.services?.[index]?.businessActivityIds?.root
            }
            label="Business activities"
            name={servicePath(index, "businessActivityIds")}
            options={businessActivityOptions}
            placeholder="Select business activities"
          />
          <MultiSelectField
            control={form.control}
            error={form.formState.errors.services?.[index]?.userTypes?.root}
            label="User types"
            name={servicePath(index, "userTypes")}
            options={userTypeOptions}
            placeholder="Select user types"
          />
          <MultiSelectField
            control={form.control}
            error={form.formState.errors.services?.[index]?.customerTypes?.root}
            label="Customer types"
            name={servicePath(index, "customerTypes")}
            options={customerTypeOptions}
            placeholder="Select customer types"
          />
          <MultiSelectField
            control={form.control}
            error={
              form.formState.errors.services?.[index]?.availabilityRegions?.root
            }
            label="Availability regions"
            name={servicePath(index, "availabilityRegions")}
            options={regionOptions}
            placeholder="Select availability regions"
          />
          <ToggleField
            control={form.control}
            label="Directed to children"
            name={servicePath(index, "childrenDirected")}
          />
          <MinimumAgeField form={form} index={index} />
          <div className="grid gap-4 border-t border-slate-200 pt-4 md:col-span-2 md:grid-cols-2">
            <h4 className="text-sm font-semibold text-slate-900 md:col-span-2">
              Privacy & Hosting
            </h4>
            <ToggleField
              control={form.control}
              label="Uses cookies or tracking technologies"
              name={servicePrivacyPath(
                index,
                "usesCookiesOrTrackingTechnologies"
              )}
            />
            <MultiSelectField
              control={form.control}
              error={
                form.formState.errors.services?.[index]?.privacy
                  ?.cookieTrackingCategories?.root
              }
              label="Cookie / tracking categories"
              name={servicePrivacyPath(index, "cookieTrackingCategories")}
              options={cookieTrackingCategoryOptions}
              placeholder="Select cookie / tracking categories"
            />
            <SelectField
              control={form.control}
              label="Cookie consent mechanism"
              name={servicePrivacyPath(index, "cookieConsentMechanism")}
              options={[
                { value: "", label: "Not set" },
                ...cookieConsentMechanismOptions,
              ]}
              placeholder="Not set"
            />
            <ToggleField
              control={form.control}
              label="Responds to Do Not Track"
              name={servicePrivacyPath(index, "doNotTrackResponse")}
            />
            <ToggleField
              control={form.control}
              label="Global Privacy Control supported"
              name={servicePrivacyPath(index, "globalPrivacyControlSupported")}
            />
            <SelectField
              control={form.control}
              label="Primary hosting region"
              name={servicePrivacyPath(index, "primaryHostingRegion")}
              options={[{ value: "", label: "Not set" }, ...regionOptions]}
              placeholder="Not set"
            />
          </div>
        </div>
      ))}
      <Button
        className="w-fit"
        type="button"
        variant="outline"
        onClick={() => append({ ...emptyServiceProfile })}
      >
        <Plus />
        Add service
      </Button>
    </div>
  )
}
