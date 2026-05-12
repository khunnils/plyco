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
}: ListFieldProps<T>) => (
  <Controller
    control={control}
    name={name}
    render={({ field }) => (
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        {label}
        <input
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 transition outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
          placeholder={placeholder}
          type="text"
          value={Array.isArray(field.value) ? field.value.join(", ") : ""}
          onBlur={field.onBlur}
          onChange={(event) => field.onChange(splitList(event.target.value))}
        />
        {error && <span className="text-xs text-red-700">{error.message}</span>}
      </label>
    )}
  />
)
