import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

type SelectFieldProps<T extends FieldValues, TValue extends string> = {
  control: Control<T>
  label: string
  name: FieldPath<T>
  options: Array<{ value: TValue; label: string }>
}

export const SelectField = <T extends FieldValues, TValue extends string>({
  control,
  label,
  name,
  options,
}: SelectFieldProps<T, TValue>) => (
  <Controller
    control={control}
    name={name}
    render={({ field }) => (
      <label className="grid gap-2 text-sm font-medium text-slate-800">
        {label}
        <select
          className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-normal text-slate-900 transition outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
          value={field.value}
          onBlur={field.onBlur}
          onChange={(event) => field.onChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    )}
  />
)
