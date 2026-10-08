import { useId } from "react"
import { FieldSettings } from "./field-settings"
import {
  Controller,
  type Control,
  type FieldError,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

const splitList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

type ListFieldProps<T extends FieldValues> = {
  control: Control<T>
  error?: FieldError
  label: string
  name: FieldPath<T>
  placeholder?: string
}

export const ListField = <T extends FieldValues>({
  control,
  error,
  label,
  name,
  placeholder,
}: ListFieldProps<T>) => {
  const fieldId = useId()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="group/field grid gap-2 text-sm font-medium text-slate-800">
          <span className="flex items-center justify-between gap-2">
            <label htmlFor={fieldId}>{label}</label>
            <FieldSettings label={label} name={name} />
          </span>
          <input
            id={fieldId}
            autoComplete="new-password"
            className="field-focus h-11 rounded-sm border border-slate-300 bg-white px-4 py-2.5 text-sm font-normal text-slate-900 transition outline-none"
            placeholder={placeholder}
            type="text"
            value={Array.isArray(field.value) ? field.value.join(", ") : ""}
            onBlur={field.onBlur}
            onChange={(event) => field.onChange(splitList(event.target.value))}
          />
          {error && (
            <span className="text-xs text-red-700">{error.message}</span>
          )}
        </div>
      )}
    />
  )
}
