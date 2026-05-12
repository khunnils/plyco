import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

type ToggleFieldProps<T extends FieldValues> = {
  control: Control<T>
  label: string
  name: FieldPath<T>
}

export const ToggleField = <T extends FieldValues>({
  control,
  label,
  name,
}: ToggleFieldProps<T>) => (
  <Controller
    control={control}
    name={name}
    render={({ field }) => (
      <label className="flex min-h-11 items-center justify-between gap-4 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800">
        <span>{label}</span>
        <input
          checked={Boolean(field.value)}
          className="size-4 accent-blue-600"
          type="checkbox"
          onBlur={field.onBlur}
          onChange={(event) => field.onChange(event.target.checked)}
        />
      </label>
    )}
  />
)
